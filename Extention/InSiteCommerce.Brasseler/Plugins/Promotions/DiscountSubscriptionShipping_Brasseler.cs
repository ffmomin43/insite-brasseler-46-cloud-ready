using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Insite.Plugins.PromotionEngines.PromotionResultServices
{
    [DependencyName("DiscountSubscriptionShipping")]
    public class DiscountSubscriptionShipping_Brasseler : PromotionResultServiceBase
    {
        protected readonly ICustomerOrderUtilities CustomerOrderUtilities;
        protected readonly IPromotionAmountProvider PromotionAmountProvider;


        public DiscountSubscriptionShipping_Brasseler(IPricingPipeline pricingPipeline, ICustomerOrderUtilities customerOrderUtilities, IPromotionAmountProvider promotionAmountProvider)
          : base(pricingPipeline, promotionAmountProvider)
        {
            this.CustomerOrderUtilities = customerOrderUtilities;
            this.PromotionAmountProvider = promotionAmountProvider;
        }

        public override string DisplayName
        {
            get
            {
                return "Discount Shipping for Subscription";
            }
        }
        public virtual bool RequiresCriteriaValue
        {
            get
            {
                return true;
            }
        }

        public override Dictionary<string, PromotionResultParameter> ParameterDescriptions
        {
            get
            {
                Dictionary<string, PromotionResultParameter> dictionary = new Dictionary<string, PromotionResultParameter>();
                //BUSA-763 SS - shipping charges issue when cart qualifies smart supply functionality
                string key1 = "Amount";
                dictionary.Add(key1, new PromotionResultParameter()
                {
                    Label = "Maximum Shipping Discount",
                    ValueType = "number"
                });
                return dictionary;
            }
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            CustomerOrderPromotion customerOrderPromotion = customerOrder.CustomerOrderPromotions.FirstOrDefault<CustomerOrderPromotion>((Func<CustomerOrderPromotion, bool>)(p => p.PromotionId == this.PromotionResult.PromotionId));
            if (customerOrderPromotion == null)
                return;
            customerOrderPromotion.Amount = new Decimal?(this.PromotionProvider.GetAppliedAmount(customerOrderPromotion, string.Empty));
        }

        public override decimal AmountOffShipping(CustomerOrder customerOrder)
        { //BUSA-879 SS- Shipping discount is applied twice with Order Total off in combination with free shipping & SS shipping promotion           
            foreach (var promo in customerOrder.CustomerOrderPromotions) 
            {  
                if (promo.Promotion.PromotionResults.Where(p => p.PromotionResultType == "AmountOffShipping" || p.PromotionResultType == "PercentOffShipping").Count() > 0)
                {
                    decimal discountedShippingPercent = PromotionAmountProvider.PercentOffShipping(promo.Promotion,customerOrder);
                    decimal discountedShipping = customerOrder.ShippingCharges * (discountedShippingPercent / new Decimal(100));
                    decimal discountedShippingAmount = PromotionAmountProvider.AmountOffShipping(promo.Promotion, customerOrder);
                    if ((discountedShipping > 1) || (discountedShippingAmount > 1))
                    {
                        return base.AmountOffOrder(customerOrder);
                    }
                }
            }
            //BUSA-879 end
            //BUSA-763 SS - shipping charges issue when cart qualifies smart supply functionality
            if (customerOrder.ShippingCharges >= (this.PromotionResult.Amount.Value) && (this.PromotionResult.Amount.Value != 0))
            {
                var discount = this.PromotionResult.Amount.Value;
                return (discount);
            }
            return base.AmountOffOrder(customerOrder);
        }

        public override decimal PercentOffShipping(CustomerOrder customerOrder)
        {
            //BUSA-763 SS - shipping charges issue when cart qualifies smart supply functionality
            if (customerOrder.ShippingCharges < (this.PromotionResult.Amount.Value) || (this.PromotionResult.Amount.Value == 0))
            {
                return new decimal(100);
            }
            return base.PercentOffShipping(customerOrder);
        }

        public override void ClearPromotionResult(CustomerOrder customerOrder)
        {
        }
    }
}