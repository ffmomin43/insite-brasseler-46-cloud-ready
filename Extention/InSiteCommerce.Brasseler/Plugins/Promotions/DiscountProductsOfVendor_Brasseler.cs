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
    [DependencyName("DiscountProductsOfVendor")]
    public class DiscountProductsOfVendor_Brasseler : DiscountProductsOfVendor
    {
        IPricingPipeline pricingPipeline;
        protected readonly IPromotionAmountProvider promotionAmountProvider;

        public DiscountProductsOfVendor_Brasseler(IPricingPipeline PricingPipeline, IPromotionAmountProvider PromotionAmountProvider)
      : base(PricingPipeline, PromotionAmountProvider)
        {
            this.pricingPipeline = PricingPipeline;
            this.promotionAmountProvider = PromotionAmountProvider;
        }

        public override Decimal ProductDiscount(CustomerOrderPromotion customerOrderPromotion)
        {
            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, this.promotionAmountProvider);
            return helper.GetPercentOrAmountProductDiscount(this.PromotionResult, customerOrderPromotion);
        }

        public override void ApplyPromotionResult(CustomerOrder customerOrder)
        {
            if (!this.PromotionResult.VendorId.HasValue)
                throw new ArgumentNullException("VendorId");

            ProductPromotionHelper_Brasseler helper = new ProductPromotionHelper_Brasseler(this.PricingPipeline, this.promotionAmountProvider);
            helper.ApplyDiscountToOrderLines(this.PromotionResult, customerOrder.OrderLines.Where<OrderLine>((Func<OrderLine, bool>)(ol =>
            {
                if (ol.IsPromotionItem)
                    return false;
                Guid? vendorId1 = ol.Product.VendorId;
                Guid? vendorId2 = this.PromotionResult.VendorId;
                if (vendorId1.HasValue != vendorId2.HasValue)
                    return false;
                if (!vendorId1.HasValue)
                    return true;
                return vendorId1.GetValueOrDefault() == vendorId2.GetValueOrDefault();
            })), customerOrder);
        }
    }
}
