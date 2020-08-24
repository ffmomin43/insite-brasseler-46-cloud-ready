using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Common.Providers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using Insite.Order.Services.Dtos;
using Insite.Order.Services.Parameters;
using Insite.Order.Services.Results;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Services.Handlers.Rma
{
    public class CreateCustomerOrderRecord
    {
        private readonly ICartPipeline CartPipeline;
        private readonly CustomSettings customSettings;

        public CreateCustomerOrderRecord(ICartPipeline cartPipeline)
        {
            CartPipeline = cartPipeline;
            customSettings = new CustomSettings();
        }


        public CustomerOrder CreateNewCart(IUnitOfWork unitOfWork, OrderHistory customerOrder, AddRmaParameter parameter, AddRmaResult result)
        {
            var orderNumber = string.Empty;
            if (string.IsNullOrEmpty(customerOrder.WebOrderNumber) && !string.IsNullOrEmpty(customerOrder.ErpOrderNumber))
            {
                orderNumber = customerOrder.ErpOrderNumber.Split('-')[0];
            }
            else
            {
                orderNumber = customerOrder.WebOrderNumber.Substring(0,1) == "W" ? customerOrder.WebOrderNumber.Substring(1) : customerOrder.WebOrderNumber.Split('-')[0];
            }
            
            Customer customer = new Customer();
            if (string.IsNullOrEmpty(customerOrder.CustomerSequence) || customerOrder.CustomerSequence.Equals(customerOrder.CustomerNumber))
            {
                customer = unitOfWork.GetRepository<Customer>().GetTable().Where(x => x.CustomerNumber == customerOrder.CustomerNumber).FirstOrDefault();
            }
            else
            {
                customer = unitOfWork.GetRepository<Customer>().GetTable().Where(x => x.CustomerNumber == customerOrder.CustomerNumber && x.CustomerSequence == customerOrder.CustomerSequence).FirstOrDefault();
            }

            SiteContextDto siteContextDto = new SiteContextDto(SiteContext.Current);
            var websiteId = siteContextDto.Website.Id;
            var website = siteContextDto.Website;

            Salesperson salesperson = new Salesperson();
            salesperson = unitOfWork.GetRepository<Salesperson>().GetTable().Where(x => x.Name.Equals(customerOrder.Salesperson)).FirstOrDefault();

            ShipVia shipVia =  unitOfWork.GetRepository<ShipVia>().GetTable().Where(x => x.ShipCode.ToLower().Equals(customerOrder.ShipCode.ToLower())).FirstOrDefault();

            CustomerOrder cart = new CustomerOrder()
            {
                Id = new Guid(),
                OrderNumber = customSettings.RMA_OrderNumberPrefix + orderNumber,
                OrderDate = DateTimeProvider.Current.Now,
                Customer = customer,
                WebsiteId = websiteId,
                Website = website,
                Status = "Return Requested",
                CustomerPO = customerOrder.CustomerPO,
                Notes = customerOrder.Notes,
                Type = "Return Requested",
                Salesperson = salesperson,
                SalespersonId = salesperson.Id,
                ShippingCharges = customerOrder.ShippingCharges,
                ShipCode = customerOrder.ShipCode,
                ShipVia = shipVia
            };

            foreach (var promotion in customerOrder.OrderHistoryPromotions.ToList())
            {
                CustomerOrderPromotion orderPromotion = new CustomerOrderPromotion()
                {
                    Id = new Guid(),
                    CustomerOrderId = cart.Id,
                    PromotionId = promotion.PromotionId,
                    OrderLineId = promotion.OrderHistoryLineId,
                    Amount = promotion.Amount,
                    CustomProperties = promotion.CustomProperties
                };
                cart.CustomerOrderPromotions.Add(orderPromotion);
            }

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
                }
            }

            foreach (var customProperty in customerOrder.CustomProperties)
            {
                cart.SetProperty(customProperty.Name, customProperty.Value);
            }

            var chkReturnType = 0; // To check partial return or full return based on quantity return
            foreach (var ol in customerOrder.OrderHistoryLines.ToList())
            {
                RmaLineDto rmaLineDto = parameter.RmaLines.FirstOrDefault((RmaLineDto r) => r.Line.Equals(ol.LineNumber)) ?? new RmaLineDto();
                if (rmaLineDto.RmaQtyRequested != 0)
                {
                    AddCartLineParameter addCartLineParameter = new AddCartLineParameter();
                    addCartLineParameter.Cart = cart;
                    addCartLineParameter.Product = unitOfWork.GetRepository<Product>().GetTable().Where(x => x.Name.Equals(ol.ProductErpNumber)).FirstOrDefault();
                    addCartLineParameter.QtyOrdered = rmaLineDto.RmaQtyRequested;
                    addCartLineParameter.UnitOfMeasure = ol.UnitOfMeasure;
                    addCartLineParameter.Notes = ol.Notes;
                    addCartLineParameter.CustomProperties = ol.CustomProperties.ToList();

                    Insite.Cart.Services.Pipelines.Results.AddCartLineResult addCartLineResult = CartPipeline.AddCartLine(addCartLineParameter);
                    addCartLineResult.CartLine.UnitCost = ol.UnitCost;
                    addCartLineResult.CartLine.UnitListPrice = addCartLineParameter.Product.BasicListPrice;
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

            if (chkReturnType != 0 || customerOrder.OrderHistoryLines.Count() > cart.OrderLines.Count())
            {
                cart.Notes = invoiceNumber + "/" + 1; // 1 indicates the partial return
            }
            else
            {
                cart.Notes = invoiceNumber + "/" + 0; // 0 indicates the full return
            }

            unitOfWork.GetRepository<CustomerOrder>().Insert(cart);
            unitOfWork.Save();

            return cart;
        }
    }
}
