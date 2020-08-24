using Insite.Common.Helpers;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Interfaces.Plugins.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;
using Insite.Plugins.PromotionEngines.PromotionResultServices;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Promotions
{
    [DependencyName("DiscountProductsWithPriceCode")]
    public class DiscountProductsWithPriceCode_Brasseler : DiscountProductsWithPriceCode
    {
        IPricingPipeline pricingPipeline;
        protected readonly IPromotionAmountProvider promotionAmountProvider;

        public DiscountProductsWithPriceCode_Brasseler(IPricingPipeline PricingPipeline, IPromotionAmountProvider PromotionAmountProvider)
      : base(PricingPipeline, PromotionAmountProvider)
        {
            this.pricingPipeline = PricingPipeline;
            this.promotionAmountProvider = PromotionAmountProvider;
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (this.PromotionResult.Code.IsBlank())
                throw new ArgumentNullException("Code");

            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, this.promotionAmountProvider);
            helper.ApplyDiscountToOrderLines(this.PromotionResult, customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(ol =>
            {
                if (!ol.IsPromotionItem)
                    return ol.Product.PriceCode.EqualsIgnoreCase(this.PromotionResult.Code);
                return false;
            })), customerOrder);
        }

        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, this.promotionAmountProvider);
            return helper.GetPercentOrAmountProductDiscount(this.PromotionResult, customerOrderPromotion);
        }
    }
}
