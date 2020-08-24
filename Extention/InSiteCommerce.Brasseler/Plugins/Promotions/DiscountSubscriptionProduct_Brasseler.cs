using Insite.Common.Helpers;
using Insite.Core.Context;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.Plugins.Helper;
using InSiteCommerce.Brasseler.Plugins.Promotions;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Insite.Plugins.PromotionEngines.PromotionResultServices
{
    [DependencyName("DiscountSubscriptionProduct")]
    public class DiscountSubscriptionProduct_Brasseler : PromotionResultServiceBase
    {
        protected readonly ICustomerOrderUtilities CustomerOrderUtilities;
        public static decimal BeforeSmartSupplyDiscount;
        protected readonly IPromotionAmountProvider promotionAmountProvider;
        IPricingPipeline pricingPipeline;

        public DiscountSubscriptionProduct_Brasseler(IPricingPipeline pricingPipeline, ICustomerOrderUtilities customerOrderUtilities, IPromotionAmountProvider promotionAmountProvider)
          : base(pricingPipeline, promotionAmountProvider)
        {
            this.pricingPipeline = pricingPipeline;
            this.CustomerOrderUtilities = customerOrderUtilities;
            this.promotionAmountProvider = promotionAmountProvider;
        }

        public override string DisplayName
        {
            get
            {
                return "DiscountSubscriptionProduct";
            }
        }

        public override Dictionary<string, PromotionResultParameter> ParameterDescriptions
        {
            get
            {
                Dictionary<string, PromotionResultParameter> dictionary = new Dictionary<string, PromotionResultParameter>();

                string key1 = "IsPercent";
                dictionary.Add(key1, new PromotionResultParameter()
                {
                    Label = "Apply Discount",
                    ValueType = "checkbox"
                });
                return dictionary;
            }
        }

        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            //return customerOrderPromotion.CustomerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
            //{
            //    if (o.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
            //    {
            //        var IsSubscriptionOpted = o.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value;

            //        if (!string.IsNullOrEmpty(o.CostCode))
            //        {
            //            return true;
            //        }
            //    }
            //    return false;
            //})).Sum(orderLine =>
            //{
            //    //BUSA-463 Subscription: Get previous ActualPrice to calculate discount for this promotion
            //    if (!string.IsNullOrEmpty(orderLine.CostCode))
            //    {
            //        Decimal actualPrice = decimal.Parse(orderLine.CostCode, CultureInfo.InvariantCulture);

            //        Decimal qtyOrdered = orderLine.QtyOrdered;
            //        HelperUtility helperUtility = new HelperUtility();
            //        var currentCustomer = helperUtility.GetCurrentCustomerFlow(customerOrderPromotion.CustomerOrder);
            //        string amount = string.Empty;
            //        if (currentCustomer == null)
            //        {
            //            currentCustomer = customerOrderPromotion.CustomerOrder.Customer;
            //        }
            //        if (currentCustomer.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Count() > 0)
            //        {
            //            amount = currentCustomer.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Value;
            //        }

            //        if (string.IsNullOrEmpty(amount))
            //        {
            //            return 0;
            //        }
            //        Decimal? subscriptionDiscount = Decimal.Parse(amount, CultureInfo.InvariantCulture);

            //        Decimal percent = subscriptionDiscount.Value / new Decimal(100);

            //        Decimal Act = NumberHelper.ApplyDiscount(actualPrice, percent);

            //        Decimal num = actualPrice - Act;

            //        return NumberHelper.RoundCurrency(qtyOrdered * num);
            //    }
            //    else
            //        return 0;
            //});


            if (customerOrderPromotion.OrderLine != null)
            {

                if (customerOrderPromotion.OrderLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                {
                    var IsSubscriptionOpted = customerOrderPromotion.OrderLine.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value;

                    if (!string.IsNullOrEmpty(customerOrderPromotion.OrderLine.CostCode))
                    {
                        Decimal actualPrice = decimal.Parse(customerOrderPromotion.OrderLine.CostCode, CultureInfo.InvariantCulture);

                        Decimal qtyOrdered = customerOrderPromotion.OrderLine.QtyOrdered;
                        HelperUtility helperUtility = new HelperUtility();
                        var currentCustomer = helperUtility.GetCurrentCustomerFlow(customerOrderPromotion.CustomerOrder);
                        string amount = string.Empty;
                        if (currentCustomer == null)
                        {
                            currentCustomer = customerOrderPromotion.CustomerOrder.Customer;
                        }
                        if (currentCustomer.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Count() > 0)
                        {
                            amount = currentCustomer.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Value;
                        }

                        if (string.IsNullOrEmpty(amount))
                        {
                            return 0;
                        }
                        Decimal? subscriptionDiscount = Decimal.Parse(amount, CultureInfo.InvariantCulture);

                        Decimal percent = subscriptionDiscount.Value / new Decimal(100);

                        Decimal Act = NumberHelper.ApplyDiscount(actualPrice, percent);

                        Decimal num = actualPrice - Act;

                        return NumberHelper.RoundCurrency(qtyOrdered * num);
                    }


                }
            }
            return 0;
            //*********************************************************
            //ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, this.PromotionProvider);
            //return helper.GetPercentOrAmountProductDiscount(this.PromotionResult, customerOrderPromotion);
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (customerOrder.Status.EqualsIgnoreCase("Saved"))
            {
                if (customerOrder != null)
                {
                    IEnumerable<OrderLine> list = customerOrder.OrderLines;
                    foreach (var orderLine in list)
                    {
                        if (orderLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                        {
                            var IsSubscriptionOpted = orderLine.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value;
                            if (!string.IsNullOrEmpty(IsSubscriptionOpted) && IsSubscriptionOpted.EqualsIgnoreCase("true"))
                            {
                                orderLine.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value = "false";
                            }
                        }
                    }
                }
            }
            else
            {
                if (customerOrder != null)
                {
                    IEnumerable<OrderLine> list = customerOrder.OrderLines;
                    foreach (var orderLine in list)
                    {
                        if (orderLine.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                        {
                            var IsSubscriptionOpted = orderLine.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value;
                            if (!string.IsNullOrEmpty(IsSubscriptionOpted) && IsSubscriptionOpted.EqualsIgnoreCase("true"))
                            {
                                this.ApplyDiscountToOrderLines(this.PromotionResult, orderLine, customerOrder);
                            }
                        }
                    }
                }
            }
        }

        public override void ClearPromotionResult(CustomerOrder customerOrder)
        {
            List<OrderLine> list = customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
            {
                if (o.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Count() > 0)
                {
                    var IsSubscriptionOpted = o.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("IsSubscriptionOpted")).Value;
                    if (!string.IsNullOrEmpty(o.CostCode))
                    {
                        return true;
                    }
                }
                return false;
            })).ToList<OrderLine>();

            if (!list.Any<OrderLine>())
                return;
            foreach (OrderLine orderLine in list)
                orderLine.PromotionResult = (PromotionResult)null;
            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.pricingPipeline, this.promotionAmountProvider);
            IDictionary<Guid, ProductPriceDto> pricingServiceResult = helper.GetPricingServiceResult((IEnumerable<OrderLine>)list);
            foreach (OrderLine orderLine1 in list)
            {
                OrderLine orderLine = orderLine1;
                ProductPriceDto productPriceDto = pricingServiceResult.First<KeyValuePair<Guid, ProductPriceDto>>((Func<KeyValuePair<Guid, ProductPriceDto>, bool>)(o => o.Key == orderLine.Id)).Value;
                orderLine.CostCode = string.Empty;
                orderLine.UnitNetPrice = productPriceDto.UnitRegularPrice;
            }
            //TOBEREMOVED
            //.ForEach((Action<OrderLine>)(orderLine =>
            //{
            //    //orderLine.PromotionResult = (PromotionResult)null;
            //    orderLine.CostCode = string.Empty;
            //    IDictionary<Guid, ProductPriceDto> productPriceDto = GetPricingServiceResult((IEnumerable<OrderLine>) orderLine);

            //    orderLine.UnitNetPrice = productPriceDto.FirstOrDefault().Value.UnitRegularPrice;
            //}));
        }

        protected virtual void ApplyDiscountToOrderLines(PromotionResult promotionResult, OrderLine orderLine, CustomerOrder customerOrder)
        {
            CustomerOrderPromotion appliedPromotion = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p => p.PromotionId == promotionResult.PromotionId));
            List<OrderLine> list = new List<OrderLine>();
            list.Add(orderLine);
            if (SiteContext.Current != null && SiteContext.Current.ShipTo != null)
            {
                if (string.IsNullOrEmpty(orderLine.CostCode))
                {
                    //orderLine.PromotionResult = promotionResult;
                    ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.pricingPipeline, this.promotionAmountProvider);
                    IDictionary<Guid, ProductPriceDto> pricingServiceResult = helper.GetPricingServiceResult((IEnumerable<OrderLine>)list);
                    ProductPriceDto productPriceDto = pricingServiceResult.First(o => o.Key == orderLine.Id).Value;
                    Decimal UnitNetPrice = orderLine.UnitNetPrice;

                    // Check current flow of Customer.
                    HelperUtility helperUtility = new HelperUtility();
                    var currentCustomer = helperUtility.GetCurrentCustomerFlow(customerOrder);

                    if (currentCustomer.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Count() > 0)
                    {
                        var amount = currentCustomer.CustomProperties.FirstOrDefault(x => x.Name.EqualsIgnoreCase("SubscriptionDiscount")).Value;

                        if (string.IsNullOrEmpty(amount))
                        {
                            return;
                        }
                        Decimal? subscriptionDiscount = Decimal.Parse(amount, CultureInfo.InvariantCulture);
                        //return if subscription discount is zero
                        if (subscriptionDiscount < 1)
                        {
                            return;
                        }
                        Decimal percent = subscriptionDiscount.Value / new Decimal(100);
                        //BUSA-463 Subscription: Hold previous ActualPrice to calculate discount for this promotion
                        orderLine.CostCode = orderLine.UnitNetPrice.ToString(CultureInfo.InvariantCulture);

                        var num1 = NumberHelper.ApplyDiscount(UnitNetPrice, percent);
                        //if (orderLine.PromotionResult != null)
                        //{
                        //    if (!(orderLine.UnitNetPrice < num1))
                        //    {
                        //        CustomerOrderPromotion deleted = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p =>
                        //        {
                        //            Guid? orderLineId = p.OrderLineId;
                        //            Guid id = orderLine.Id;
                        //            if (!orderLineId.HasValue)
                        //                return false;
                        //            if (!orderLineId.HasValue)
                        //                return true;
                        //            return orderLineId.GetValueOrDefault() == id;
                        //        }));
                        //        if (deleted != null)
                        //        {
                        //            customerOrder.CustomerOrderPromotions.Remove(deleted);
                        //            this.UnitOfWork.GetRepository<CustomerOrderPromotion>().Delete(deleted);
                        //        }
                        //    }
                        //    else
                        //        return;
                        //}
                        //orderLine.PromotionResult = promotionResult;
                        orderLine.UnitListPrice = productPriceDto.UnitListPrice;
                        orderLine.UnitRegularPrice = productPriceDto.UnitRegularPrice;
                        orderLine.UnitNetPrice = num1;
                        orderLine.UnitNetPrice = orderLine.UnitNetPrice < Decimal.Zero ? Decimal.Zero : orderLine.UnitNetPrice;
                        orderLine.TotalRegularPrice = NumberHelper.RoundCurrency(orderLine.UnitListPrice * orderLine.QtyOrdered);
                        orderLine.TotalNetPrice = NumberHelper.RoundCurrency(orderLine.UnitNetPrice * orderLine.QtyOrdered);
                        this.AddOrUpdateCustomerOrderPromotion(customerOrder, appliedPromotion, orderLine, promotionResult);
                    }
                }
            }
        }

        protected override void AddOrUpdateCustomerOrderPromotion(CustomerOrder customerOrder, CustomerOrderPromotion appliedPromotion, OrderLine orderLine, PromotionResult promotionResult)
        {
            ICollection<CustomerOrderPromotion> customerOrderPromotions = customerOrder.CustomerOrderPromotions;
            foreach (CustomerOrderPromotion customerOrderPromotion in customerOrderPromotions.Where<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p =>
            {
                Guid? orderLineId = p.OrderLineId;
                Guid id = orderLine.Id;
                if (!orderLineId.HasValue)
                    return false;
                if (!orderLineId.HasValue)
                    return true;
                return orderLineId.GetValueOrDefault() == id;
            })))
                customerOrderPromotion.Amount = new Decimal?(new Decimal());
            if (appliedPromotion != null && appliedPromotion.Promotion != null && !appliedPromotion.OrderLineId.HasValue)
            {
                appliedPromotion.OrderLineId = new Guid?(orderLine.Id);
                appliedPromotion.OrderLine = orderLine;
                appliedPromotion.Amount = new Decimal?(this.PromotionProvider.GetAppliedAmount(appliedPromotion, string.Empty));
            }
            else
            {
                CustomerOrderPromotion customerOrderPromotion = new CustomerOrderPromotion()
                {
                    CustomerOrderId = customerOrder.Id,
                    CustomerOrder = customerOrder,
                    PromotionId = promotionResult.PromotionId,
                    Promotion = this.UnitOfWork.GetRepository<Promotion>().Get(promotionResult.PromotionId),
                    OrderLineId = new Guid?(orderLine.Id),
                    OrderLine = orderLine
                };
                customerOrderPromotion.Amount = new Decimal?(this.PromotionProvider.GetAppliedAmount(customerOrderPromotion,string.Empty));
                customerOrder.CustomerOrderPromotions.Add(customerOrderPromotion);
            }
        }
    }
}