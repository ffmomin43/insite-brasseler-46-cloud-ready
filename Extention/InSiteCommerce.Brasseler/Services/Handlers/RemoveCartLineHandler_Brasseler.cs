using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("RemoveCartLineHandler_Brasseler")]
    public sealed class RemoveCartLineHandler_Brasseler : HandlerBase<Insite.Cart.Services.Parameters.RemoveCartLineParameter, Insite.Cart.Services.Results.RemoveCartLineResult>
    {
        private readonly ICartPipeline cartPipeline;
        private IPricingPipeline pricingPipeline;
        private IPromotionEngine PromotionEngine;
        private readonly IHandlerFactory HandlerFactory;

        public RemoveCartLineHandler_Brasseler(ICartPipeline cartPipeline, IPricingPipeline PricingPipeline, IHandlerFactory HandlerFactory, IPromotionEngine promotionEngine)
        {
            this.cartPipeline = cartPipeline;
            this.pricingPipeline = PricingPipeline;
            this.HandlerFactory = HandlerFactory;
            this.PromotionEngine = promotionEngine;
        }

        public override int Order
        {
            get
            {
                return 850;
            }
        }

        public override RemoveCartLineResult Execute(IUnitOfWork unitOfWork, RemoveCartLineParameter parameter, RemoveCartLineResult result)
        {
            string QtyBrkCls = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == result.ProductId).PriceBasis;
            CartHelper_Brasseler helper = new CartHelper_Brasseler(this.pricingPipeline);

            CustomerOrder cart = result.GetCartResult.Cart;
            //update cartline with updated volume grp price & promotion
            result.GetCartResult.Cart = helper.UpdateVolumeGrpPricing(cart, QtyBrkCls, unitOfWork);
            result.GetCartResult.Cart.RecalculatePromotions = true;
            this.PromotionEngine.ApplyPromotions(result.GetCartResult.Cart);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
