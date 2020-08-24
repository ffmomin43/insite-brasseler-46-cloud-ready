using Insite.Common.Dependencies;
using Insite.Common.Helpers;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Plugins.Pricing;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    public class ProductPromotionHelper_Brasseler
    {
        IPricingPipeline pricingPipeline;
        protected readonly IUnitOfWork UnitOfWork;
        protected readonly IPromotionAmountProvider PromotionProvider;

        public ProductPromotionHelper_Brasseler(IPricingPipeline PricingPipeline, IPromotionAmountProvider promotionProvider)
        {
            this.pricingPipeline = PricingPipeline;
            this.UnitOfWork = DependencyLocator.Current.GetInstance<IUnitOfWorkFactory>().GetUnitOfWork();
            this.PromotionProvider = promotionProvider;
        }

        public virtual IDictionary<Guid, ProductPriceDto> GetPricingServiceResult(IEnumerable<OrderLine> orderLines)
        {
            GetProductPricingResult productPricing = this.pricingPipeline.GetProductPricing(new GetProductPricingParameter(true)
            {
                PricingServiceParameters = orderLines.ToDictionary(o => o.Id, o => new PricingServiceParameter(o.ProductId)
                {
                    OrderLine = o,
                    CustomerOrderId = o.CustomerOrderId
                })
            });
            PipelineHelper.VerifyResults((PipeResultBase)productPricing);
            return productPricing.ProductPriceDtos;
        }

        //public void ApplyDiscountToOrderLines(PromotionResult promotionResult, IEnumerable<OrderLine> orderLines)
        //{
        //    if (!promotionResult.Amount.HasValue)
        //        throw new ArgumentNullException("Amount");
        //    if (promotionResult.Amount.Value == Decimal.Zero)
        //        throw new ArgumentOutOfRangeException("Amount");
        //    foreach (OrderLine orderLine1 in orderLines)
        //    {
        //        orderLine1.PromotionResult = promotionResult;
        //        PricingServiceResult pricingServiceResult = this.GetPricingServiceResult(orderLine1);
        //        OrderLine orderLine2 = orderLine1;
        //        bool? isPercent = promotionResult.IsPercent;
        //        Decimal lowestPrice;
        //        Decimal actualPrice = pricingServiceResult.ActualPrice;
        //        Decimal retailPrice = orderLine1.RegularPrice;
        //        Decimal? amount = promotionResult.Amount;

        //        if ((isPercent.HasValue ? (isPercent.GetValueOrDefault() ? 1 : 0) : 0) == 0)
        //        {
        //            lowestPrice = GetLowestPriceBaseAmountBasedPromotion(actualPrice, retailPrice, amount);
        //        }
        //        else
        //        {
        //            lowestPrice = GetLowestPriceBasePercentBasedPromotion(actualPrice, retailPrice, amount);
        //        }
        //        orderLine2.ActualPrice = lowestPrice;
        //        orderLine1.RegularPrice = pricingServiceResult.RegularPrice;
        //        orderLine1.ActualPrice = orderLine1.ActualPrice < Decimal.Zero ? Decimal.Zero : orderLine1.ActualPrice;
        //    }
        //}
        public virtual void ApplyDiscountToOrderLines(PromotionResult promotionResult, IEnumerable<OrderLine> orderLines, CustomerOrder customerOrder)
        {
            if (!promotionResult.Amount.HasValue)
                throw new ArgumentNullException("Amount");
            Decimal? amount = promotionResult.Amount;
            if (amount.Value == Decimal.Zero)
                throw new ArgumentOutOfRangeException("Amount");
            IList<OrderLine> source = orderLines as IList<OrderLine> ?? (IList<OrderLine>)orderLines.ToList<OrderLine>();
            if (!source.Any<OrderLine>())
                return;
            IDictionary<Guid, ProductPriceDto> pricingServiceResult = this.GetPricingServiceResult((IEnumerable<OrderLine>)source);
            CustomerOrderPromotion appliedPromotion = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p => p.PromotionId == promotionResult.PromotionId));
            foreach (OrderLine orderLine1 in (IEnumerable<OrderLine>)source)
            {
                OrderLine orderLine = orderLine1;
                ProductPriceDto productPriceDto = pricingServiceResult.First<KeyValuePair<Guid, ProductPriceDto>>((Func<KeyValuePair<Guid, ProductPriceDto>, bool>)(o => o.Key == orderLine.Id)).Value;
                bool? isPercent = promotionResult.IsPercent;
                Decimal lowestPrice;
                Decimal actualPrice = productPriceDto.UnitRegularPrice;/*pricingServiceResult.ActualPrice*/
                Decimal retailPrice = orderLine1.UnitListPrice;
                Decimal? promoAmount = promotionResult.Amount;

                if ((isPercent.HasValue ? (isPercent.GetValueOrDefault() ? 1 : 0) : 0) == 0)
                {
                    lowestPrice = GetLowestPriceBaseAmountBasedPromotion(actualPrice, retailPrice, amount);
                }
                else
                {
                    lowestPrice = GetLowestPriceBasePercentBasedPromotion(actualPrice, retailPrice, amount);
                }
                Decimal num3 = lowestPrice;
                if (orderLine.PromotionResult != null)
                {
                    if (!(orderLine.UnitNetPrice < num3))
                    {
                        CustomerOrderPromotion deleted = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p =>
                        {
                            Guid? orderLineId = p.OrderLineId;
                            Guid id = orderLine.Id;
                            if (!orderLineId.HasValue)
                                return false;
                            if (!orderLineId.HasValue)
                                return true;
                            return orderLineId.GetValueOrDefault() == id;
                        }));
                        if (deleted != null)
                        {
                            customerOrder.CustomerOrderPromotions.Remove(deleted);
                            this.UnitOfWork.GetRepository<CustomerOrderPromotion>().Delete(deleted);
                        }
                    }
                    else
                    {   // BUSA-1242: category level promotion is inserted into CustomerOrderPromotion table with null values
                        if (appliedPromotion != null)
                        {
                            if (appliedPromotion.Amount == null && appliedPromotion.OrderLineId == null)
                            {
                                customerOrder.CustomerOrderPromotions.Remove(appliedPromotion);
                                this.UnitOfWork.GetRepository<CustomerOrderPromotion>().Delete(appliedPromotion);
                            }
                        }
                        continue;
                    }
                }
                orderLine.PromotionResult = promotionResult;
                orderLine.UnitListPrice = productPriceDto.UnitListPrice;
                orderLine.UnitRegularPrice = productPriceDto.UnitRegularPrice;
                orderLine.UnitNetPrice = num3;
                orderLine.UnitNetPrice = orderLine.UnitNetPrice < Decimal.Zero ? Decimal.Zero : orderLine.UnitNetPrice;
                orderLine.TotalRegularPrice = NumberHelper.RoundCurrency(orderLine.UnitListPrice * orderLine.QtyOrdered);
                orderLine.TotalNetPrice = NumberHelper.RoundCurrency(orderLine.UnitNetPrice * orderLine.QtyOrdered);
                this.AddOrUpdateCustomerOrderPromotion(customerOrder, appliedPromotion, orderLine, promotionResult);
            }
        }

        private static decimal GetLowestPriceBasePercentBasedPromotion(decimal actualPrice, decimal retailPrice, decimal? amount)
        {
            decimal lowestPrice;
            Decimal percent = amount.Value / new Decimal(100);
            lowestPrice = actualPrice;
            Decimal discountedRetailPrice = NumberHelper.ApplyDiscount(retailPrice, percent);
            Decimal[] lowestAmount = new[] { lowestPrice, discountedRetailPrice };
            lowestPrice = lowestAmount.Min();
            return lowestPrice;
        }

        private static decimal GetLowestPriceBaseAmountBasedPromotion(decimal actualPrice, decimal retailPrice, decimal? amount)
        {
            decimal lowestPrice;
            Decimal num2 = amount.Value;
            lowestPrice = actualPrice;
            Decimal discountedRetailPrice = retailPrice - num2;
            Decimal[] lowestAmount = new[] { lowestPrice, discountedRetailPrice };
            lowestPrice = lowestAmount.Min();
            return lowestPrice;
        }

        //public Decimal GetPercentOrAmountProductDiscount(PromotionResult promotionResult, CustomerOrderPromotion customerOrderPromotion)
        //{
        //    if (!promotionResult.Amount.HasValue)
        //        throw new ArgumentNullException("Amount");
        //    if (promotionResult.Amount.Value == Decimal.Zero)
        //        throw new ArgumentOutOfRangeException("Amount");
        //    return customerOrderPromotion.CustomerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(o =>
        //    {
        //        PromotionResult promotionResult1 = o.PromotionResult;
        //        Guid? nullable = promotionResult1 != null ? new Guid?(promotionResult1.Id) : new Guid?();
        //        Guid id = promotionResult.Id;
        //        if ((nullable.HasValue ? (nullable.HasValue ? (nullable.GetValueOrDefault() == id ? 1 : 0) : 1) : 0) != 0)
        //            return !o.Product.IsQuoteRequired;               
        //        return false;
        //    })).Sum<OrderLine>((Func<OrderLine, Decimal>)(orderLine =>
        //    {
        //        Decimal actualPrice = this.GetPricingServiceResult(orderLine).ActualPrice;
        //        Decimal retailPrice = orderLine.RegularPrice;
        //        Decimal? amount = promotionResult.Amount;
        //        Decimal lowestPrice;

        //        bool? isPercent = promotionResult.IsPercent;
        //        if ((isPercent.HasValue ? (isPercent.GetValueOrDefault() ? 1 : 0) : 0) == 0)
        //        {
        //            lowestPrice = GetLowestPriceBaseAmountBasedPromotion(actualPrice, retailPrice, amount);
        //            if (lowestPrice == actualPrice)
        //            {
        //                return 0;
        //            }
        //            return NumberHelper.RoundCurrency(orderLine.QtyOrdered * promotionResult.Amount.Value);
        //        }
        //        else
        //        {
        //            Decimal percent = amount.Value / new Decimal(100);
        //            lowestPrice = GetLowestPriceBasePercentBasedPromotion(actualPrice, retailPrice, amount);

        //            if (lowestPrice == actualPrice)
        //            {
        //                return 0;
        //            }
        //            return NumberHelper.RoundCurrency(orderLine.QtyOrdered * NumberHelper.GetDiscount(retailPrice, percent));
        //        }
        //    }));
        //}

        public virtual Decimal GetPercentOrAmountProductDiscount(PromotionResult promotionResult, CustomerOrderPromotion customerOrderPromotion)
        {
            if (!promotionResult.Amount.HasValue)
                throw new ArgumentNullException("Amount");
            if (promotionResult.Amount.Value == Decimal.Zero)
                throw new ArgumentOutOfRangeException("Amount");
            if (customerOrderPromotion?.OrderLine != null) // check if customerOrderPromotion object is not null with ? operator
            {
                Guid? id1 = customerOrderPromotion.OrderLine.PromotionResult?.Id;
                Guid id2 = promotionResult.Id;
                if ((id1.HasValue ? (id1.HasValue ? (id1.GetValueOrDefault() != id2 ? 1 : 0) : 0) : 1) == 0 && !customerOrderPromotion.OrderLine.Product.IsQuoteRequired)
                {
                    ProductPriceDto productPriceDto = this.GetPricingServiceResult((IEnumerable<OrderLine>)new List<OrderLine>()
          {
            customerOrderPromotion.OrderLine
          }).FirstOrDefault<KeyValuePair<Guid, ProductPriceDto>>((Func<KeyValuePair<Guid, ProductPriceDto>, bool>)(o => o.Key == customerOrderPromotion.OrderLine.Id)).Value;
                    //Decimal amount = productPriceDto != null ? productPriceDto.UnitListPrice : Decimal.Zero; // New 

                    Decimal actualPrice = productPriceDto.UnitRegularPrice; /*this.GetPricingServiceResult(orderLine).ActualPrice; */ //unitregularprice
                    Decimal retailPrice = productPriceDto.UnitListPrice;
                    Decimal? promoAmount = promotionResult.Amount;
                    Decimal lowestPrice;
                    bool? isPercent = promotionResult.IsPercent;
                    if ((isPercent.HasValue ? (isPercent.GetValueOrDefault() ? 1 : 0) : 0) == 0)
                    {
                        lowestPrice = GetLowestPriceBaseAmountBasedPromotion(actualPrice, retailPrice, promoAmount);
                        if (lowestPrice == actualPrice)
                        {
                            return 0;
                        }
                        return NumberHelper.RoundCurrency(customerOrderPromotion.OrderLine.QtyOrdered * promotionResult.Amount.Value);
                    }
                    else
                    {
                        Decimal percent = promoAmount.Value / new Decimal(100);
                        lowestPrice = GetLowestPriceBasePercentBasedPromotion(actualPrice, retailPrice, promoAmount);

                        if (lowestPrice == actualPrice)
                        {
                            return 0;
                        }
                        return NumberHelper.RoundCurrency(customerOrderPromotion.OrderLine.QtyOrdered * NumberHelper.GetDiscount(retailPrice, promotionResult.Amount.Value / new Decimal(100)));
                    }
                }
            }
            return Decimal.Zero;
        }

        public virtual void AddOrUpdateCustomerOrderPromotion(CustomerOrder customerOrder, CustomerOrderPromotion appliedPromotion, OrderLine orderLine, PromotionResult promotionResult)
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
                appliedPromotion.Amount = new Decimal?(this.PromotionProvider.GetAppliedAmount(appliedPromotion,string.Empty));

                //BUSA_1242: Prod Category Level Promotion is inserted in customerorderpromotion table with 0 amount
                if (appliedPromotion.Amount <= 0) 
                {
                    if (appliedPromotion.Promotion.PromotionResults.Count == 1 && appliedPromotion.Promotion.PromotionResults.Where(x => x.PromotionResultType == "DiscountProductsInCategory").Any())
                    {
                        orderLine.PromotionResult = (PromotionResult)null;
                        customerOrder.CustomerOrderPromotions.Remove(appliedPromotion);
                        this.UnitOfWork.GetRepository<CustomerOrderPromotion>().Delete(appliedPromotion);
                    }
                }
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

                //BUSA_1242: Prod Category Level Promotion is inserted in customerorderpromotion table with 0 amount
                if (customerOrderPromotion.Amount <= 0 && customerOrderPromotion.Promotion.PromotionResults.Where(x => x.PromotionResultType == "DiscountProductsInCategory").Any())
                {
                    orderLine.PromotionResult = (PromotionResult)null;
                }
                else
                {
                    customerOrder.CustomerOrderPromotions.Add(customerOrderPromotion);
                }

            }
        }
    }
}
