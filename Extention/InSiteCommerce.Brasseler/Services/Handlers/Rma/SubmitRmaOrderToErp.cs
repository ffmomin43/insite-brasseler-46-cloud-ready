using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.Logging;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using Insite.Data.Entities.Dtos;
using Insite.Order.Services.Dtos;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Rma
{
    [DependencyName("SubmitRmaOrderToErp")]
    public class SubmitRmaOrderToErp : HandlerBase<AddRmaParameter, AddRmaResult>
    {
        private readonly ICartPipeline CartPipeline;
        protected readonly UpdateCartResult updateCartResult;
        protected readonly IHandlerFactory HandlerFactory;

        public SubmitRmaOrderToErp(IHandlerFactory HandlerFactory, ICartPipeline cartPipeline)
        {
            this.HandlerFactory = HandlerFactory;
            CartPipeline = cartPipeline;
            updateCartResult = new UpdateCartResult();
        }

        public override int Order
        {
            get
            {
                return 650;
            }
        }

        public override AddRmaResult Execute(IUnitOfWork unitOfWork, AddRmaParameter parameter, AddRmaResult result)
        {
            //Uncomment following lines to disable RMA for Canada.
            if (result.OrderHistory.CustomerNumber.ElementAt(0) != '1')
            {
                return base.NextHandler.Execute(unitOfWork, parameter, result);
            }
            CustomerOrder customerOrder = new CustomerOrder();
            customerOrder = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(x => x.OrderNumber == result.OrderHistory.WebOrderNumber).FirstOrDefault();

            if (customerOrder == null)
            {
                CreateCustomerOrderRecord createCustomerOrder = new CreateCustomerOrderRecord(this.CartPipeline);
                CustomerOrder cartObj = createCustomerOrder.CreateNewCart(unitOfWork, result.OrderHistory, parameter, result);

                if (cartObj == null)
                {
                    return this.CreateErrorServiceResult(result, SubCode.Forbidden, MessageProvider.Current.Cart_CartNotFound);
                }

                result.Properties.Add("ReturnNumber", cartObj.OrderNumber);
                if(cartObj.Notes != null)
                {
                    result.Properties.Add("InvoiceNumber", cartObj.Notes.Split('/')[0]);
                }

                cartObj.RecalculatePromotions = false;
                cartObj.RecalculateTax = false;

                // Build up the update cart paramter.
                var updatecartObjParameter = new UpdateCartParameter();

                updatecartObjParameter.CartId = cartObj.Id;
                updatecartObjParameter.Status = "Return Requested";
                updatecartObjParameter.IsJobQuote = false;
                updatecartObjParameter.IsPayPal = false;
                updatecartObjParameter.ShipToId = cartObj.ShipToId;
                updatecartObjParameter.ShipViaId = cartObj.ShipViaId;

                IHandler<UpdateCartParameter, UpdateCartResult> updateHandler = this.HandlerFactory.GetHandler<IHandler<UpdateCartParameter, UpdateCartResult>>();
                var updateCartObjSubmitResult = updateHandler.Execute(unitOfWork, updatecartObjParameter, updateCartResult);

                LogHelper.For(this).Info(string.Format("{0}: RMA UpdateCart Message: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber) ? result.OrderHistory.ErpOrderNumber : result.OrderHistory.WebOrderNumber, updateCartObjSubmitResult.Message));

                return base.NextHandler.Execute(unitOfWork, parameter, result);
                //return this.CreateErrorServiceResult(result, SubCode.NotFound, MessageProvider.Current.Order_NotFound);
            }

            var userProfile = unitOfWork.GetRepository<UserProfile>().GetTable().FirstOrDefault(x => x.Id == customerOrder.InitiatedByUserProfileId);
            var billTo = unitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(x => x.Id == customerOrder.CustomerId);
            var shipTo = unitOfWork.GetRepository<Customer>().GetTable().FirstOrDefault(x => x.Id == customerOrder.ShipToId);
            var website = unitOfWork.GetRepository<Website>().GetTable().FirstOrDefault(x => x.Id == customerOrder.WebsiteId);
            var currency = unitOfWork.GetRepository<Currency>().GetTable().FirstOrDefault(x => x.Id == customerOrder.CurrencyId);

            // Check for null before setting up the SiteContext object.
            if (userProfile == null || billTo == null || shipTo == null)
            {
                return this.CreateErrorServiceResult(result, SubCode.NotFound, MessageProvider.Current.Order_NotFound);
            }

            SiteContextDto siteContextDto = new SiteContextDto(SiteContext.Current);
            siteContextDto.UserProfileDto = new UserProfileDto(userProfile);
            siteContextDto.BillTo = billTo;
            siteContextDto.ShipTo = shipTo;
            siteContextDto.CurrencyDto = new CurrencyDto(currency);

            //create new Cart
            CustomerOrder cart = CreateNewCart(unitOfWork, customerOrder, parameter, result);
            
            if (cart == null)
            {
                return this.CreateErrorServiceResult(result, SubCode.Forbidden, MessageProvider.Current.Cart_CartNotFound);
            }

            cart.RecalculatePromotions = false;
            cart.RecalculateTax = false;

            // Build up the update cart paramter.
            var updateCartParameter = new UpdateCartParameter();

            updateCartParameter.CartId = cart.Id;
            updateCartParameter.Status = "Return Requested";
            updateCartParameter.IsJobQuote = false;
            updateCartParameter.IsPayPal = false;
            updateCartParameter.ShipToId = cart.ShipToId;
            updateCartParameter.ShipViaId = cart.ShipViaId;

            IHandler<UpdateCartParameter, UpdateCartResult> handler = this.HandlerFactory.GetHandler<IHandler<UpdateCartParameter, UpdateCartResult>>();
            var updateCartSubmitResult = handler.Execute(unitOfWork, updateCartParameter, updateCartResult);

            LogHelper.For(this).Info(string.Format("{0}: RMA UpdateCart Message: {1}", string.IsNullOrEmpty(result.OrderHistory.WebOrderNumber) ? result.OrderHistory.ErpOrderNumber : result.OrderHistory.WebOrderNumber, updateCartSubmitResult.Message));

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

        protected CustomerOrder CreateNewCart(IUnitOfWork unitOfWork, CustomerOrder customerOrder, AddRmaParameter parameter, AddRmaResult result)
        {
            CustomSettings customSettings = new CustomSettings();
            CustomerOrder cart = new CustomerOrder()
            {
                Id = Guid.NewGuid(),
                OrderNumber = customSettings.RMA_OrderNumberPrefix + customerOrder.OrderNumber.Substring(1),
                OrderDate = DateTimeProvider.Current.Now,
                Customer = customerOrder.Customer,
                ShipTo = customerOrder.ShipTo,
                DropShipCustomer = customerOrder.DropShipCustomer,
                WebsiteId = customerOrder.WebsiteId,
                Website = customerOrder.Website,
                Affiliate = customerOrder.Affiliate,
                ShipVia = customerOrder.ShipVia,
                InitiatedByUserProfile = customerOrder.InitiatedByUserProfile,
                InitiatedByUserProfileId = customerOrder.InitiatedByUserProfileId,
                CurrencyId = customerOrder.CurrencyId,
                PlacedByUserName = customerOrder.PlacedByUserName,
                PlacedByUserProfile = customerOrder.PlacedByUserProfile,
                Status = "Return Requested",
                CustomerPO = customerOrder.CustomerPO,
                Notes = customerOrder.Notes,
                Type = "Return Requested",
                Salesperson = customerOrder.Salesperson,
                SalespersonId = customerOrder.SalespersonId,
                PlacedByUserProfileId = customerOrder.PlacedByUserProfileId,
                ShippingCharges = customerOrder.ShippingCharges
            };
            cart.OrderPromotionCodes = customerOrder.OrderPromotionCodes.ToList();
            cart.TermsCode = customerOrder.TermsCode;
            cart.ShippingCalculationNeededAsOf = DateTimeOffset.Now;

            this.CartPipeline.SetBillTo(new SetBillToParameter()
            {
                Cart = cart,
                BillTo = cart.Customer
            });

            this.CartPipeline.SetShipTo(new SetShipToParameter()
            {
                Cart = cart,
                ShipTo = cart.ShipTo
            });

            // Add the Returned Sequence in the Order Number
            var returnedSeq = unitOfWork.GetRepository<CustomerOrder>().GetTable().Where(x => x.OrderNumber.StartsWith(cart.OrderNumber)).Count();
            if (returnedSeq != 0)
            {
                returnedSeq += 1;
            }
            else
            {
                returnedSeq = 1;
            }
            cart.OrderNumber = cart.OrderNumber + "/" + returnedSeq;
            result.Properties.Add("ReturnNumber", cart.OrderNumber);

            // Getting the Invoice Number
            var invoiceNumber = string.Empty;
            if (!string.IsNullOrEmpty(result.OrderHistory.ErpOrderNumber))
            {
                var erpNumber = result.OrderHistory.ErpOrderNumber.Split('-')[0];
                var invoiceQuery = (from ih in unitOfWork.GetRepository<InvoiceHistory>().GetTable()
                                    join ihl in unitOfWork.GetRepository<InvoiceHistoryLine>().GetTable()
                                    on ih.Id equals ihl.InvoiceHistoryId
                                    where ihl.ErpOrderNumber == erpNumber
                                    select ih.InvoiceNumber);
                if (!string.IsNullOrEmpty(invoiceQuery.FirstOrDefault()))
                {
                    invoiceNumber = invoiceQuery.FirstOrDefault().Split('-')[0].ToString();
                    result.Properties.Add("InvoiceNumber", invoiceNumber);
                }
            }

            foreach (var customProperty in customerOrder.CustomProperties)
            {
                cart.SetProperty(customProperty.Name, customProperty.Value);
            }

            List<int> qtyReturn = new List<int>();
            
            List<int> line = new List<int>();
            var chkReturnType = 0; // To check partial return or full return based on quantity return
            foreach (var ol in customerOrder.OrderLines.ToList())
            {
                RmaLineDto rmaLineDto = parameter.RmaLines.FirstOrDefault((RmaLineDto r) => r.Line.Equals(ol.Line)) ?? new RmaLineDto();
                if (rmaLineDto.RmaQtyRequested != 0)
                {
                    if (ol.IsPromotionItem.Equals(true))
                    {
                        line.Add(ol.Line);
                    }

                    Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter addCartLineParameter = new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter();
                    addCartLineParameter.Cart = cart;
                    addCartLineParameter.Product = ol.Product;
                    addCartLineParameter.QtyOrdered = rmaLineDto.RmaQtyRequested;
                    addCartLineParameter.UnitOfMeasure = ol.UnitOfMeasure;
                    addCartLineParameter.CostCode = ol.CostCode;
                    addCartLineParameter.Notes = ol.Notes;
                    addCartLineParameter.CustomProperties = ol.CustomProperties.ToList();
                    qtyReturn.Add(rmaLineDto.RmaQtyRequested);

                    Insite.Cart.Services.Pipelines.Results.AddCartLineResult addCartLineResult = CartPipeline.AddCartLine(addCartLineParameter);
                    addCartLineResult.CartLine.SmartPart = ol.SmartPart;
                    addCartLineResult.CartLine.UnitCost = ol.UnitCost;
                    addCartLineResult.CartLine.UnitListPrice = ol.UnitListPrice;
                    addCartLineResult.CartLine.UnitNetPrice = ol.UnitNetPrice;
                    addCartLineResult.CartLine.UnitRegularPrice = ol.UnitRegularPrice;
                    addCartLineResult.CartLine.TotalNetPrice = ol.TotalNetPrice;
                    addCartLineResult.CartLine.TotalRegularPrice = ol.TotalRegularPrice;

                    if (ol.QtyOrdered > rmaLineDto.RmaQtyRequested)
                    {
                        chkReturnType += 1;
                    }
                }
            }

            if(chkReturnType != 0)
            {
                cart.Notes = invoiceNumber + "/" + 1; // 1 indicates the partial return
            }
            else if(customerOrder.OrderLines.Where(x => x.UnitNetPrice > 0).Count() > cart.OrderLines.Count())
            {
                cart.Notes = invoiceNumber + "/" + 1; // 1 indicates the partial return
            }
            else
            {
                cart.Notes = invoiceNumber + "/" + 0; // 0 indicates the full return
            }

            List<OrderLine> orderLineList = cart.OrderLines.ToList();
            for (int i = 0; i < orderLineList.Count; i++)
            {
                OrderLine orderLine = orderLineList[i];
                if (line.Contains(orderLine.Line))
                {
                    orderLine.IsPromotionItem = true;
                }
            }

            var totalQty = result.OrderHistory.OrderHistoryLines.Where(x => x.ProductErpNumber != "WEBDISCOUNT" && !line.Contains(Convert.ToInt32(x.LineNumber)) && (x.UnitNetPrice > 0 || x.QtyShipped < x.QtyOrdered)).Select(qty => qty.QtyOrdered).Sum();

            foreach (var promotion in customerOrder.CustomerOrderPromotions.ToList())
            {
                CustomerOrderPromotion orderPromotion = new CustomerOrderPromotion();
                orderPromotion.Id = new Guid();
                orderPromotion.CustomerOrderId = cart.Id;
                orderPromotion.PromotionId = promotion.PromotionId;
                orderPromotion.OrderLineId = promotion.OrderLineId;
                orderPromotion.CustomProperties = promotion.CustomProperties;
                cart.CustomerOrderPromotions.Add(orderPromotion);

                if (promotion.OrderLineId == null && cart.Notes.Split('/')[1] == "1" && !promotion.Promotion.Name.ToLower().Contains("shipping") && totalQty != 0 && qtyReturn.Count>0)
                {
                    orderPromotion.Amount = ((decimal)promotion.Amount / totalQty) * qtyReturn.Sum();
                }
                else
                {
                    orderPromotion.Amount = promotion.Amount;
                }
            }

            unitOfWork.GetRepository<CustomerOrder>().Insert(cart);
            unitOfWork.Save();

            return cart;
        }
    }
}
