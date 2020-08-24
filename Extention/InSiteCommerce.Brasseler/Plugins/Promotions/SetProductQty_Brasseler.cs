using Insite.Common.Helpers;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
//BUSA-1319 Promotion Result type to set quantity of a product
namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    /// <summary>The set product price.</summary>
    [DependencyName("SetProductQty")]
    public class SetProductQty_Brasseler : PromotionResultServiceBase
    {
        /// <summary>Initializes a new instance of the <see cref="T:Insite.Plugins.PromotionEngines.PromotionResultServices.SetProductPrice" /> class.</summary>
        /// <param name="pricingPipeline">The pricing pipeline.</param>
        /// <param name="promotionProvider">The promotion provider.</param>
        public SetProductQty_Brasseler(
          IPricingPipeline pricingPipeline,
          IPromotionAmountProvider promotionProvider)
          : base(pricingPipeline, promotionProvider)
        {
        }

        /// <summary>The display name.</summary>
        public override string DisplayName
        {
            get
            {
                return "Set Product Quantity";
            }
        }

        /// <summary>The parameter descriptions.</summary>
        public override Dictionary<string, PromotionResultParameter> ParameterDescriptions
        {
            get
            {
                return new Dictionary<string, PromotionResultParameter>()
        {
          {
            "Amount",
            new PromotionResultParameter()
            {
              Label = "Set Qty",
              ValueType = "number"
            }
          },
          {
            "ProductId",
            new PromotionResultParameter()
            {
              Label = "Product",
              LookupObject = "Product"
            }
          }
        };
            }
        }

        /// <summary>The product discount.</summary>
        /// <param name="customerOrderPromotion">The customer order promotion.</param>
        /// <returns>The <see cref="T:System.Decimal" />.</returns>
        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            if (customerOrderPromotion.OrderLine != null)
            {
                Guid? id1 = customerOrderPromotion.OrderLine.PromotionResult?.Id;
                Guid id2 = this.PromotionResult.Id;
                if ((id1.HasValue ? (id1.HasValue ? (id1.GetValueOrDefault() == id2 ? 1 : 0) : 1) : 0) != 0 && !customerOrderPromotion.OrderLine.Product.IsQuoteRequired)
                {
                    Decimal? unitRegularPrice = this.GetPricingServiceResult((IEnumerable<OrderLine>)new List<OrderLine>()
          {
            customerOrderPromotion.OrderLine
          }).FirstOrDefault<KeyValuePair<Guid, ProductPriceDto>>((Func<KeyValuePair<Guid, ProductPriceDto>, bool>)(o => o.Key == customerOrderPromotion.OrderLine.Id)).Value?.UnitRegularPrice;
                    Decimal qtyOrdered = customerOrderPromotion.OrderLine.QtyOrdered;
                    Decimal? nullable = unitRegularPrice;
                    Decimal? amount = this.PromotionResult.Amount;
                    Decimal num = Decimal.Zero;
                    return NumberHelper.RoundCurrency(qtyOrdered * num);
                }
            }
            return Decimal.Zero;
        }

        /// <summary>The apply promotion result.</summary>
        /// <param name="customerOrder">The customer order.</param>
        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (!this.PromotionResult.Amount.HasValue)
                throw new ArgumentNullException("Amount");
            if (this.PromotionResult.Amount.Value < Decimal.Zero)
                throw new ArgumentOutOfRangeException("Amount");
            if (this.PromotionResult.Product == null)
                throw new ArgumentNullException("Product");
            CustomerOrderPromotion appliedPromotion = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p => p.PromotionId == this.PromotionResult.PromotionId));
            foreach (OrderLine orderLine1 in customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(ol =>
            {
                if (!ol.IsPromotionItem)
                    return ol.Product.Id == this.PromotionResult.Product.Id;
                return false;
            })))
            {
                OrderLine orderLine = orderLine1;
                if (!(this.PromotionResult.Amount.Value > orderLine.QtyOrdered))
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
                    orderLine.PromotionResult = this.PromotionResult;
                    orderLine.QtyOrdered = this.PromotionResult.Amount.Value;
                    this.AddOrUpdateCustomerOrderPromotion(customerOrder, appliedPromotion, orderLine, this.PromotionResult);
                }
            }
        }

        /// <summary>The clear promotion result.</summary>
        /// <param name="customerOrder">The customer order.</param>
        public override void ClearPromotionResult(CustomerOrder customerOrder)
        {
            this.ClearDiscountFromOrderLines(this.PromotionResult, customerOrder);
        }
    }
}

