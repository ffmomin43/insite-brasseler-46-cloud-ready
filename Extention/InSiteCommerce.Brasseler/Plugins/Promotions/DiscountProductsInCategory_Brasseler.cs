using Insite.Common.Helpers;
using Insite.Core.Interfaces.Data;
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
    [DependencyName("DiscountProductsInCategory")]
    public class DiscountProductsInCategory_Brasseler : DiscountProductsInCategory
    {
        IPricingPipeline pricingPipeline;
        protected readonly IPromotionAmountProvider promotionAmountProvider;

        public DiscountProductsInCategory_Brasseler(IPricingPipeline PricingPipeline, IPromotionAmountProvider promotionAmountProvider)
      : base(PricingPipeline, promotionAmountProvider)
        {
            this.pricingPipeline = PricingPipeline;
            this.promotionAmountProvider = promotionAmountProvider;
        }

        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, promotionAmountProvider);
            return helper.GetPercentOrAmountProductDiscount(this.PromotionResult, customerOrderPromotion);
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (this.PromotionResult.Category == null)
                throw new ArgumentNullException("Category");

            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, promotionAmountProvider);
            helper.ApplyDiscountToOrderLines(this.PromotionResult, customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(ol =>
            {
                if (!ol.IsPromotionItem)
                    return this.ProductRepository.IsInCategory(ol.Product, this.PromotionResult.Category.Id);
                return false;
            })), customerOrder);
        }
    }
}
