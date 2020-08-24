using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Services.Handlers;
using System;
using System.Collections.Generic;
using System.Linq;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Cart.Services.Pipelines;
using Insite.Common.Providers;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Data.Repositories.Interfaces;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using System.Dynamic;
using System.Globalization;
using Insite.Core.Context;
using Insite.Core.Plugins.Utilities;
using Insite.Core.Localization;
using Insite.Core.Interfaces.Plugins.Emails;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Core.Plugins.Pipelines.Inventory.Parameters;
using Insite.Core.Plugins.Pipelines.Inventory;
using Insite.Core.Plugins.Inventory;
using Insite.Core.SystemSetting.Groups.Catalog;
using Insite.Core.Interfaces.Localization;
using InSiteCommerce.Brasseler.SystemSetting.Groups;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("UpdateCartCreateSSOrder")]
    public class UpdateCartCreateSSOrder : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly ICustomerOrderUtilities CustomerOrderUtilities;
        private readonly ICartPipeline CartPipeline;
        private readonly IOrderLineUtilities OrderLineUtilities;
        private readonly Lazy<IPromotionEngine> PromotionEngine;
        private readonly IPricingPipeline PricingPipeline;
        private readonly OrderManagementGeneralSettings OrderManagementGeneralSettings;
        private readonly ICurrencyFormatProvider CurrencyFormatProvider;
        private readonly Lazy<IEntityTranslationService> EntityTranslationService;
        private readonly Lazy<IEmailService> EmailService;
        private readonly Lazy<IProductUtilities> ProductUtilities;
        private readonly Lazy<IInventoryPipeline> inventoryPipeline;
        private readonly InventorySettings inventorySettings;
        private readonly Lazy<ITranslationLocalizer> translationLocalizer;
        private readonly CustomSettings customSettings;

        public UpdateCartCreateSSOrder(ICustomerOrderUtilities customerOrderUtilities, IOrderLineUtilities orderLineUtilities, ICartPipeline cartPipeline, Lazy<IPromotionEngine> promotionEngine, IPricingPipeline pricingPipeline, OrderManagementGeneralSettings orderManagementGeneralSettings, ICurrencyFormatProvider currencyFormatProvider, Lazy<IEntityTranslationService> entityTranslationService, Lazy<IEmailService> emailService, Lazy<IProductUtilities> productUtilities, Lazy<IInventoryPipeline> inventoryPipeline, InventorySettings inventorySettings, Lazy<ITranslationLocalizer> translationLocalizer, CustomSettings customSettings)
        {
            this.CustomerOrderUtilities = customerOrderUtilities;
            OrderLineUtilities = orderLineUtilities;
            CartPipeline = cartPipeline;
            this.PromotionEngine = promotionEngine;
            this.PricingPipeline = pricingPipeline;
            this.OrderManagementGeneralSettings = orderManagementGeneralSettings;
            this.CurrencyFormatProvider = currencyFormatProvider;
            this.EmailService = emailService;
            this.ProductUtilities = productUtilities;
            this.inventoryPipeline = inventoryPipeline;
            this.inventorySettings = inventorySettings;
            this.translationLocalizer = translationLocalizer;
            EntityTranslationService = entityTranslationService;
            this.customSettings = customSettings;
        }

        public override int Order
        {
            get
            {
                return 3050;//2220;  //2310
            }
        }

        //This handler Creates SS order 
        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("CreateSmartSupply") && !parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);

            if (parameter.Status.EqualsIgnoreCase("Submitted"))
            {
                var cart = result.GetCartResult.Cart;
                var isSubscriptionOrder = false;
                foreach (var ol in cart.OrderLines)
                {
                    if (ol.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                    {
                        if (ol.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).FirstOrDefault().Value.EqualsIgnoreCase("True"))
                        {
                            isSubscriptionOrder = true;
                            break;
                        }
                    }
                }

                if (isSubscriptionOrder)
                {
                    var subscriptionOrderExists = unitOfWork.GetRepository<SubscriptionBrasseler>().GetTable().Where(x => x.CustomerOrderId == cart.Id).Count();
                    if (subscriptionOrderExists == 0)
                    {
                        this.CreateSubscriptionOrderLine(unitOfWork, cart, parameter, result);
                    }
                }

            }
            else if (parameter.Status.EqualsIgnoreCase("CreateSmartSupply"))
            {
                CustomerOrder cart = result.GetCartResult.Cart;
                this.ConvertCartToSubscriptionOrder(unitOfWork, cart, parameter, result);
                result.GetCartResult.Cart.Status = "SubscriptionOrder";
                try
                {
                    unitOfWork.Save();
                }
                catch (Exception e)
                {
                    //kkk. create error - Something went wrong while creatin gSS order
                }


                return result; //created smart supply order 
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }


        protected void CreateSubscriptionOrderLine(IUnitOfWork unitOfWork, CustomerOrder cart, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (cart == null || cart.OrderLines.Count <= 0)
            {
                return;
            }

            CustomerOrder subscriptionOrder = this.CreateSubscriptionOrder(unitOfWork, cart);

            SubscriptionBrasseler subscriptionBrasseler = new SubscriptionBrasseler();
            subscriptionBrasseler.CustomerOrderId = subscriptionOrder.Id;
            subscriptionBrasseler.ActivationDate = subscriptionOrder.OrderDate;
            subscriptionBrasseler.DeActivationDate = DateTimeOffset.Parse(subscriptionOrder.OrderDate.AddYears(5).ToString());
            subscriptionBrasseler.ParentCustomerOrderId = subscriptionOrder.Id;// BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders 

            foreach (var ol in cart.OrderLines)
            {
                //BUSA-463 Subscription - Exclude subscription promotional product in susbcription order
                if (!ol.IsPromotionItem)
                {
                    var isSubscriptionOpted = ol.GetProperty("IsSubscriptionOpted", "false");

                    if (!isSubscriptionOpted.EqualsIgnoreCase("true"))
                    {
                        continue;
                    }

                    //save subscriptionOrder payment Method Starts
                    if (parameter.TermsCode.EqualsIgnoreCase("CK"))
                    {
                        subscriptionBrasseler.PaymentMethod = "CK";
                        subscriptionOrder.TermsCode = "CK";
                    }
                    else if (parameter.IsPaymentProfile && !string.IsNullOrEmpty(parameter.PaymentProfileId))
                    {
                        UserPaymentProfile userPaymentProfile = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(p => p.CardIdentifier == parameter.PaymentProfileId);
                        if (userPaymentProfile != null)
                        {
                            subscriptionBrasseler.PaymentMethod = userPaymentProfile.Id.ToString();
                            subscriptionOrder.TermsCode = "CC";
                        }
                    }
                    else if (parameter.StorePaymentProfile)
                    {
                        var CCResponse = result.GetCartResult.Cart.CreditCardTransactions.FirstOrDefault();
                        if (CCResponse != null)
                        {
                            var CCidentifier = CCResponse.PNRef.ToString().Split('|').FirstOrDefault();
                            var userPaymentProfile = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(x => x.CardIdentifier == CCidentifier);
                            if (userPaymentProfile != null)
                                subscriptionBrasseler.PaymentMethod = userPaymentProfile.Id.ToString();
                        }
                        subscriptionOrder.TermsCode = cart.TermsCode;
                    }
                    //else
                    //{
                    //    subscriptionBrasseler.PaymentMethod = "CK";
                    //}
                    //save subscriptionOrder payment Method Ends

                    //this.CustomerOrderUtilities.AddOrderLine(subscriptionOrder, this.OrderLineUtilities.Copy(ol));
                    Insite.Cart.Services.Pipelines.Results.AddCartLineResult addCartLineResult = this.CartPipeline.AddCartLine(new Insite.Cart.Services.Pipelines.Parameters.AddCartLineParameter()
                    {
                        Cart = subscriptionOrder,
                        Product = ol.Product,
                        QtyOrdered = ol.QtyOrdered,
                        UnitOfMeasure = ol.UnitOfMeasure,
                        CostCode = ol.CostCode,
                        Notes = ol.Notes,
                        CustomProperties = ol.CustomProperties.ToList()
                    });
                    addCartLineResult.CartLine.SmartPart = ol.SmartPart;

                    for (int index = subscriptionOrder.OrderLines.Count - 1; index >= 0; --index)
                    {
                        OrderLine orderLine = subscriptionOrder.OrderLines.ElementAt<OrderLine>(index);

                        if (!this.ProductUtilities.Value.IsQuoteRequired(orderLine.Product) || cart.Status == "QuoteProposed")
                        {
                            this.ProcessInventory(orderLine);
                        }

                        orderLine.PromotionResultId = null;
                    }
                }
            }

            subscriptionOrder.ShippingCalculationNeededAsOf = (DateTimeOffset)DateTimeProvider.Current.Now;
            subscriptionOrder.RecalculateTax = true;
            this.PromotionEngine.Value.ClearPromotions(subscriptionOrder);
            subscriptionOrder.RecalculatePromotions = true;
            PricingPipeline.GetCartPricing(new GetCartPricingParameter(subscriptionOrder));
            //this.CartHelper.Value.RecalculateCart(unitOfWork, subscriptionOrder, (OrderLine)null, true); kkk

            if (subscriptionOrder.CustomProperties.Where(x => x.Name == "subscriptionFrequencyOpted").Count() > 0)
            {
                var Frequency = subscriptionOrder.CustomProperties.FirstOrDefault(x => x.Name == "subscriptionFrequencyOpted").Value;
                subscriptionBrasseler.Frequency = int.Parse(Frequency);
                //BUSA-871 : Shipping SS order on future date provided by user                
                //subscriptionBrasseler.NextDelieveryDate = new DateTimeOffset(DateTimeProvider.Current.Now.AddDays(double.Parse(Frequency)), TimeSpan.Zero);
                subscriptionBrasseler.NextDelieveryDate = (DateTimeOffset.Now.AddDays(double.Parse(Frequency)));

            }
            if (subscriptionBrasseler != null)
            {
                unitOfWork.GetRepository<SubscriptionBrasseler>().Insert(subscriptionBrasseler);
            }

            SendSubscriptionCreationEmail(unitOfWork, subscriptionOrder);
        }


        protected CustomerOrder CreateSubscriptionOrder(IUnitOfWork unitOfWork, CustomerOrder customerOrder)
        {
            CustomerOrder subscriptionOrder = new CustomerOrder()
            {
                Id = Guid.Empty,
                OrderNumber = Guid.Empty.ToString(),
                OrderDate = (DateTimeOffset)DateTimeProvider.Current.Now,
                Customer = customerOrder.Customer,
                ShipTo = customerOrder.ShipTo,
                DropShipCustomer = customerOrder.DropShipCustomer,
                Website = customerOrder.Website,
                Affiliate = customerOrder.Affiliate,
                ShipVia = customerOrder.ShipVia,
                InitiatedByUserProfile = customerOrder.InitiatedByUserProfile,
                InitiatedByUserProfileId = customerOrder.InitiatedByUserProfileId,
                CurrencyId = customerOrder.CurrencyId,
                PlacedByUserName = customerOrder.PlacedByUserName,
                PlacedByUserProfile = customerOrder.PlacedByUserProfile,
                Status = "SubscriptionOrder",
                CustomerPO = customerOrder.CustomerPO,
                Notes = customerOrder.Notes
            };
            subscriptionOrder.ShippingCalculationNeededAsOf = DateTimeOffset.Now;
            this.SetCustomerOrderNumber(unitOfWork, subscriptionOrder);
            this.CartPipeline.SetBillTo(new SetBillToParameter()
            {
                Cart = subscriptionOrder,
                BillTo = subscriptionOrder.Customer
            });
            this.CartPipeline.SetShipTo(new SetShipToParameter()
            {
                Cart = subscriptionOrder,
                ShipTo = subscriptionOrder.ShipTo
            });
            unitOfWork.GetRepository<CustomerOrder>().Insert(subscriptionOrder);
            unitOfWork.Save();
            foreach (var customProperty in customerOrder.CustomProperties)
            {
                subscriptionOrder.SetProperty(customProperty.Name, customProperty.Value);
            }
            return subscriptionOrder;
        }

        protected void ConvertCartToSubscriptionOrder(IUnitOfWork unitOfWork, CustomerOrder subscriptionOrder, UpdateCartParameter parameter, UpdateCartResult result)
        {
            SubscriptionBrasseler subscriptionBrasseler = new SubscriptionBrasseler();
            subscriptionBrasseler.CustomerOrderId = subscriptionOrder.Id;
            subscriptionBrasseler.ActivationDate = subscriptionOrder.OrderDate;
            subscriptionBrasseler.DeActivationDate = DateTimeOffset.Parse(subscriptionOrder.OrderDate.AddYears(5).ToString());
            subscriptionBrasseler.ParentCustomerOrderId = subscriptionOrder.Id;// BUSA-759 : SS- Unable to identify the parent order ID when user places multiple smart supply orders 

            //save subscriptionOrder payment Method Starts
            if (parameter.TermsCode.EqualsIgnoreCase("CK"))
            {
                subscriptionBrasseler.PaymentMethod = "CK";
                subscriptionOrder.TermsCode = "CK";
            }
            else if (parameter.IsPaymentProfile && !string.IsNullOrEmpty(parameter.PaymentProfileId))
            {
                UserPaymentProfile userPaymentProfile = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(p => p.CardIdentifier == parameter.PaymentProfileId);
                if (userPaymentProfile != null)
                {
                    subscriptionBrasseler.PaymentMethod = userPaymentProfile.Id.ToString();
                    subscriptionOrder.TermsCode = "CC";
                }
            }

            subscriptionOrder.ShippingCalculationNeededAsOf = (DateTimeOffset)DateTimeProvider.Current.Now;
            subscriptionOrder.RecalculateTax = true;
            this.PromotionEngine.Value.ClearPromotions(subscriptionOrder);
            subscriptionOrder.RecalculatePromotions = true;
            this.PricingPipeline.GetCartPricing(new Insite.Core.Plugins.Pipelines.Pricing.Parameters.GetCartPricingParameter(subscriptionOrder));
            //this.CartHelper.Value.RecalculateCart(unitOfWork, subscriptionOrder, (OrderLine)null, true);

            if (subscriptionOrder.CustomProperties.Where(x => x.Name == "subscriptionFrequencyOpted").Count() > 0)
            {
                var Frequency = subscriptionOrder.CustomProperties.FirstOrDefault(x => x.Name == "subscriptionFrequencyOpted").Value;
                subscriptionBrasseler.Frequency = int.Parse(Frequency);
                //BUSA-781 logic to calculate next ship date when user selects date from calendar
                var isNextShipDate = subscriptionOrder.CustomProperties.FirstOrDefault(x => x.Name == "checkoutNextShipDate")?.Value;
                if (!string.IsNullOrEmpty(isNextShipDate))
                {
                    subscriptionBrasseler.NextDelieveryDate = new DateTimeOffset(Convert.ToDateTime(isNextShipDate), TimeSpan.Zero);
                }
                else
                {
                    //subscriptionBrasseler.NextDelieveryDate = new DateTimeOffset(DateTimeProvider.Current.Now.AddDays(double.Parse(Frequency)), TimeSpan.Zero); kkk

                    subscriptionBrasseler.NextDelieveryDate = (DateTimeOffset)DateTimeProvider.Current.Now.AddDays(double.Parse(Frequency));   //(DateTimeOffset.Now.AddDays(double.Parse(Frequency)));
                }
                //BUSA-781 end
            }
            if (subscriptionBrasseler != null)
            {
                unitOfWork.GetRepository<SubscriptionBrasseler>().Insert(subscriptionBrasseler);
            }

            CustomerOrder cart = result.GetCartResult.Cart;
            this.SetCustomerOrderNumber(unitOfWork, cart);

            SendSubscriptionCreationEmail(unitOfWork, subscriptionOrder);
        }

        private void SetCustomerOrderNumber(IUnitOfWork unitOfWork, CustomerOrder customerOrder)
        {
            if (!customerOrder.OrderNumber.IsGuid())
                return;
            ICustomerOrderRepository typedRepository = unitOfWork.GetTypedRepository<ICustomerOrderRepository>();
            //customerOrder.OrderNumber = typedRepository.GetNextOrderNumber(this.OrderManagementGeneralSettings.OrderNumberPrefix, this.OrderManagementGeneralSettings.OrderNumberFormat);
            //BUSA-1345: SS orders should start with S-series
            customerOrder.OrderNumber = typedRepository.GetNextOrderNumber(this.customSettings.SmartSupply_Prefix, this.OrderManagementGeneralSettings.OrderNumberFormat);
        }

        protected void SendSubscriptionCreationEmail(IUnitOfWork unitOfWork, CustomerOrder cart)
        {
            dynamic emailModel = new ExpandoObject();
            PopulateOrderEmailModel(emailModel, cart, unitOfWork);
            var emailTo = cart.CreatedBy;
            var emailList = unitOfWork.GetTypedRepository<IEmailListRepository>().GetOrCreateByName("SmartSupplyBeginningEmailList", "SmartSupply Beginning");

            if (emailTo != null)
                this.EmailService.Value.SendEmailList(emailList.Id, emailTo, emailModel, emailList.Subject, unitOfWork);
        }
        protected void PopulateOrderEmailModel(dynamic emailModel, CustomerOrder customerOrder, IUnitOfWork unitOfWork)
        {
            string str;
            string str1;
            string str2;
            emailModel.OrderNumber = customerOrder.OrderNumber;
            DateTimeOffset orderDate = customerOrder.OrderDate.ToLocalTime();  //BUSA-477 Order Confirmation email contains wrong time
            emailModel.OrderDate = orderDate.ToString(CultureInfo.InvariantCulture);
            emailModel.CustomerPO = customerOrder.CustomerPO;
            dynamic obj = emailModel;
            str = (customerOrder.BTCompanyName.IsBlank() ? string.Concat(customerOrder.BTFirstName, " ", customerOrder.BTLastName).Trim() : customerOrder.BTCompanyName);
            obj.BTDisplayName = str;

            emailModel.CustomerNumber = customerOrder.CustomerNumber;
            if (customerOrder.ShipTo != null && !string.IsNullOrEmpty(customerOrder.ShipTo.CustomerSequence))
            {
                // BUSA-472, 548, 508 : Duplicate Customers on Production Starts
                if (customerOrder.ShipTo.CustomerSequence.ToUpper().Contains("ISC"))
                {
                    emailModel.CustomerShipToNumber = SiteContext.Current.ShipTo.CustomerSequence;
                }
                else
                {
                    emailModel.CustomerShipToNumber = customerOrder.ShipTo.CustomerSequence;
                }
                // BUSA-472, 548, 508 : Duplicate Customers on Production Ends
            }
            else
            {
                emailModel.CustomerShipToNumber = string.Empty;
            }
            emailModel.BTAddress1 = customerOrder.BTAddress1;
            emailModel.BTAddress2 = customerOrder.BTAddress2;
            emailModel.BTAddress3 = customerOrder.BTAddress3;
            emailModel.BTCity = customerOrder.BTCity;
            emailModel.BTState = customerOrder.BTState;
            emailModel.BTZip = customerOrder.BTPostalCode;
            emailModel.BTPostalCode = customerOrder.BTPostalCode;
            emailModel.BTCountry = customerOrder.BTCountry;
            emailModel.BTCompany = customerOrder.BTCompanyName;
            emailModel.BTEmail = customerOrder.BTEmail;
            emailModel.BTPhone1 = customerOrder.BTPhone;
            dynamic obj1 = emailModel;
            str1 = (customerOrder.STCompanyName.IsBlank() ? string.Concat(customerOrder.STFirstName, " ", customerOrder.STLastName).Trim() : customerOrder.STCompanyName);
            obj1.STDisplayName = str1;
            emailModel.STAddress1 = customerOrder.STAddress1;
            emailModel.STAddress2 = customerOrder.STAddress2;
            emailModel.STAddress3 = customerOrder.STAddress3;
            emailModel.STCity = customerOrder.STCity;
            emailModel.STState = customerOrder.STState;
            emailModel.STZip = customerOrder.STPostalCode;
            emailModel.STPostalCode = customerOrder.STPostalCode;
            emailModel.STCountry = customerOrder.STCountry;
            emailModel.STCompany = customerOrder.STCompanyName;
            emailModel.STEmail = customerOrder.STEmail;
            emailModel.STPhone1 = customerOrder.STPhone;
            dynamic obj2 = emailModel;
            str2 = (customerOrder.ShipVia == null ? string.Empty : this.EntityTranslationService.Value.TranslateProperty<ShipVia>(customerOrder.ShipVia, (ShipVia o) => o.Description));
            obj2.ShipMethod = str2;
            emailModel.Notes = customerOrder.Notes;
            ICurrencyFormatProvider value = this.CurrencyFormatProvider;
            Currency currency = null;
            if (customerOrder.CurrencyId.HasValue)
            {
                currency = unitOfWork.GetTypedRepository<ICurrencyRepository>().Get(customerOrder.CurrencyId.Value);
            }
            emailModel.PromotionProductDiscountTotal = this.CustomerOrderUtilities.GetPromotionProductDiscountTotal(customerOrder);
            emailModel.PromotionProductDiscountTotalDisplay = value.GetString(emailModel.PromotionProductDiscountTotal, currency);
            emailModel.PromotionOrderDiscountTotal = this.CustomerOrderUtilities.GetPromotionOrderDiscountTotal(customerOrder);
            emailModel.PromotionOrderDiscountTotalDisplay = value.GetString(emailModel.PromotionOrderDiscountTotal, currency);
            emailModel.PromotionShippingDiscountTotal = this.CustomerOrderUtilities.GetPromotionShippingDiscountTotal(customerOrder);
            emailModel.PromotionShippingDiscountTotalDisplay = value.GetString(emailModel.PromotionShippingDiscountTotal, currency);
            emailModel.FullShippingCharge = customerOrder.ShippingCharges;
            emailModel.FullShippingChargeDisplay = value.GetString(customerOrder.ShippingCharges, currency);
            emailModel.Handling = customerOrder.HandlingCharges;
            emailModel.HandlingDisplay = value.GetString(customerOrder.HandlingCharges, currency);
            emailModel.LocalTax = customerOrder.LocalTax;
            emailModel.LocalTaxDisplay = value.GetString(customerOrder.LocalTax, currency);
            emailModel.StateTax = customerOrder.StateTax;
            emailModel.StateTaxDisplay = value.GetString(customerOrder.StateTax, currency);
            emailModel.TotalTax = this.CustomerOrderUtilities.GetTotalTax(customerOrder);
            emailModel.TotalTaxDisplay = value.GetString(emailModel.TotalTax, currency);
            emailModel.CreditCardWillBeCharged = customerOrder.CreditCardTransactions.Any<CreditCardTransaction>();
            emailModel.OrderSubTotal = this.CustomerOrderUtilities.GetOrderSubTotal(customerOrder);
            emailModel.OrderSubTotalDisplay = value.GetString(emailModel.OrderSubTotal, currency);
            emailModel.OrderSubTotalWithOutProductDiscounts = this.CustomerOrderUtilities.GetPromotionProductDiscountTotal(customerOrder) + this.CustomerOrderUtilities.GetOrderSubTotal(customerOrder);
            emailModel.OrderSubTotalWithOutProductDiscountsDisplay = value.GetString(emailModel.OrderSubTotalWithOutProductDiscounts, currency);
            emailModel.OrderGrandTotal = this.CustomerOrderUtilities.GetOrderTotal(customerOrder);
            emailModel.OrderGrandTotalDisplay = value.GetString(emailModel.OrderGrandTotal, currency);
            emailModel.GiftCardTotal = this.CustomerOrderUtilities.GetGiftCardTotal(customerOrder);
            emailModel.GiftCardTotalDisplay = value.GetString(emailModel.GiftCardTotal, currency);
            emailModel.OrderTotalDue = this.GetOrderTotalDue(customerOrder);
            emailModel.OrderTotalDueDisplay = value.GetString(emailModel.OrderTotalDue, currency);
            //emailModel.CustomerOrderTaxes = this.PopulateCustomerOrderTaxEmailModel(customerOrder, unitOfWork); kkk
            this.PopulateCustomerOrderTaxes(customerOrder, emailModel);
            //emailModel.OrderLines = this.PopulateOrderLineEmailModel(customerOrder, unitOfWork); kkk
            this.PopulateOrderLines(customerOrder, emailModel);

            if (customerOrder.CustomProperties.Where(x => x.Name == "subscriptionFrequencyOpted").Count() > 0)
            {
                var frequency = customerOrder.CustomProperties.FirstOrDefault(x => x.Name == "subscriptionFrequencyOpted").Value;
                if (!string.IsNullOrEmpty(frequency))
                {
                    emailModel.SubscriptionFrequency = int.Parse(frequency) / 7;
                }
            }
        }

        protected bool ProcessInventory(OrderLine orderLine)
        {
            if (!orderLine.Product.TrackInventory)
                return false;
            Decimal quantityToDecrement = this.GetQuantityToDecrement(orderLine);
            if (quantityToDecrement <= Decimal.Zero)
            {
                return true;
            }
            //this.InventoryProvider.Value.DecrementQtyOnHand(quantityToDecrement, orderLine.Product.Id, new Guid?());
            this.inventoryPipeline.Value.DecrementQtyOnHand(new DecrementQtyOnHandParameter()
            {
                DecrementInventoryParameter = new DecrementInventoryParameter()
                {
                    QtyToDecrement = quantityToDecrement,
                    ProductId = orderLine.Product.Id
                }
            });
            return false;
        }


        protected Decimal GetQuantityToDecrement(OrderLine orderLine)
        {
            Decimal num1 = orderLine.QtyOrdered;
            if (!orderLine.Product.UnitOfMeasure.EqualsIgnoreCase(orderLine.UnitOfMeasure))
            {
                ProductUnitOfMeasure productUnitOfMeasure = orderLine.Product.ProductUnitOfMeasures.FirstOrDefault<ProductUnitOfMeasure>(o => o.UnitOfMeasure.Equals(orderLine.UnitOfMeasure, StringComparison.OrdinalIgnoreCase));
                if (productUnitOfMeasure != null)
                    num1 *= productUnitOfMeasure.QtyPerBaseUnitOfMeasure;
            }
            if (!this.inventorySettings.AllowNegativeQtyOnHand && this.inventorySettings.InventoryService != "RealTime")
            {
                ProductInventory inventory = this.inventoryPipeline.Value.GetQtyOnHand(new GetQtyOnHandParameter(false)
                {
                    GetInventoryParameter = new GetInventoryParameter()
                    {
                        ProductIds = new List<Guid>()
            {
              orderLine.Product.Id
            },
                        Products = new List<Product>()
            {
              orderLine.Product
            }
                    }
                }).Inventories[orderLine.Product.Id];
                Decimal num2 = inventory != null ? inventory.QtyOnHand : Decimal.Zero;
                if (num2 < num1)
                    num1 = num2;
            }
            if (!(num1 > Decimal.Zero))
                return Decimal.Zero;
            return num1;
        }

        protected virtual Decimal GetOrderTotalDue(CustomerOrder customerOrder)
        {
            return this.CustomerOrderUtilities.GetOrderTotal(customerOrder) - this.CustomerOrderUtilities.GetGiftCardTotal(customerOrder);
        }

        protected void PopulateCustomerOrderTaxes(CustomerOrder customerOrder, dynamic emailModel)
        {
            emailModel.CustomerOrderTaxes = new List<ExpandoObject>();
            foreach (CustomerOrderTax customerOrderTax in
                from o in customerOrder.CustomerOrderTaxes
                orderby o.SortOrder
                select o)
            {
                dynamic expandoObjects = new ExpandoObject();
                expandoObjects.TaxCode = this.translationLocalizer.Value.TranslateLabel(customerOrderTax.TaxCode);
                expandoObjects.TaxDescription = this.translationLocalizer.Value.TranslateLabel(customerOrderTax.TaxDescription);
                expandoObjects.TaxRate = customerOrderTax.TaxRate;
                expandoObjects.TaxAmount = customerOrderTax.TaxAmount;
                expandoObjects.TaxAmountDisplay = this.CurrencyFormatProvider.GetString(customerOrderTax.TaxAmount, customerOrder.Currency);
                expandoObjects.SortOrder = customerOrderTax.SortOrder;
                emailModel.CustomerOrderTaxes.Add(expandoObjects);
            }
        }

        protected void PopulateOrderLines(CustomerOrder customerOrder, dynamic emailModel)
        {
            emailModel.OrderLines = new List<ExpandoObject>();
            foreach (OrderLine orderLine in customerOrder.OrderLines)
            {
                dynamic expandoObjects = new ExpandoObject();
                expandoObjects.ProductNumber = orderLine.Product.ErpNumber;
                expandoObjects.Description = orderLine.Description;
                expandoObjects.QtyOrdered = decimal.Round(orderLine.QtyOrdered, 2);
                expandoObjects.QtyOrderedDisplay = expandoObjects.QtyOrdered.ToString("0.##");
                expandoObjects.UnitNetPrice = orderLine.UnitNetPrice;
                expandoObjects.UnitNetPriceDisplay = this.CurrencyFormatProvider.GetString(orderLine.UnitNetPrice, customerOrder.Currency);
                expandoObjects.ExtendedUnitNetPrice = this.OrderLineUtilities.GetTotalNetPrice(orderLine);
                dynamic currency = expandoObjects;
                ICurrencyFormatProvider currencyFormatProvider = this.CurrencyFormatProvider;
                currency.ExtendedUnitNetPriceDisplay = currencyFormatProvider.GetString(expandoObjects.ExtendedUnitNetPrice, customerOrder.Currency);
                emailModel.OrderLines.Add(expandoObjects);
            }
        }

    }
}
