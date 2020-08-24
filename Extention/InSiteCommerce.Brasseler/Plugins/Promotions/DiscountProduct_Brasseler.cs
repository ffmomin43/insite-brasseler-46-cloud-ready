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
    [DependencyName("DiscountProduct")]
    public class DiscountProduct_Brasseler : DiscountProduct
    {
        IPricingPipeline pricingPipeline;
        protected readonly IPromotionAmountProvider promotionAmountProvider;

        public DiscountProduct_Brasseler(IPricingPipeline PricingPipeline, IPromotionAmountProvider PromotionAmountProvider)
      : base(PricingPipeline,PromotionAmountProvider)
        {
            this.pricingPipeline = PricingPipeline;
            this.promotionAmountProvider = PromotionAmountProvider;
        }

        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.pricingPipeline, this.promotionAmountProvider);
            return helper.GetPercentOrAmountProductDiscount(this.PromotionResult, customerOrderPromotion);
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (this.PromotionResult.Product == null)
                throw new ArgumentNullException("Product");

            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.pricingPipeline, this.promotionAmountProvider);
            helper.ApplyDiscountToOrderLines(this.PromotionResult, customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(ol =>
            {
                if (!ol.IsPromotionItem)
                    return ol.Product.Id == this.PromotionResult.Product.Id;
                return false;
            })), customerOrder);
        }       
    }
}
