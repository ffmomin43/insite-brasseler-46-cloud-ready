using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using System.Linq;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Cart.Services.Pipelines;
using Insite.Data.Entities;
using Insite.Core.Services;
using Insite.Core.Providers;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Pipelines.Pricing;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("AddCartLine_Brasseler")]
    public sealed class AddCartLine_Brasseler : HandlerBase<AddCartLineParameter, AddCartLineResult>
    {
        private readonly ICartPipeline cartPipeline;
        private IPricingPipeline pricingPipeline;
        private IPromotionEngine PromotionEngine;

        public AddCartLine_Brasseler(ICartPipeline cartPipeline, IPricingPipeline PricingPipeline, IPromotionEngine promotionEngine)
        {
            this.cartPipeline = cartPipeline;
            this.pricingPipeline = PricingPipeline;
            this.PromotionEngine = promotionEngine;
        }

        public override int Order
        {
            get
            {
                return 1050;
            }
        }



        public override AddCartLineResult Execute(IUnitOfWork unitOfWork, AddCartLineParameter parameter, AddCartLineResult result)
        {
            // Calculate Volume Group discount
            CustomerOrder cart = result.GetCartResult.Cart;
            OrderLine orderLine = result.GetCartLineResult.CartLine;
            if (orderLine == null)
                return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.NotFound, MessageProvider.Current.Cart_OrderLineNotFound);

            // BUSA-636 : pricing 2018 Starts. Differentiate between legacy and volume group contract.
            if (result.GetCartLineResult.BreakPrices.Count > 1)
            {
                orderLine.ConfigurationViewModel = "true";

                string QtyBrkCls = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == orderLine.ProductId).PriceBasis;
                if (!string.IsNullOrEmpty(QtyBrkCls))
                {
                    CartHelper_Brasseler helper = new CartHelper_Brasseler(this.pricingPipeline);
                    result.GetCartResult.Cart = helper.UpdateVolumeGrpPricing(cart, QtyBrkCls, unitOfWork);
                    // BUSA-683 : Volume Discount Promotion -Issue when user cart qualifies add free product promotion & volume discount group.
                    this.PromotionEngine.ClearPromotions(result.GetCartResult.Cart);
                    result.GetCartResult.Cart.RecalculatePromotions = true;
                    this.PromotionEngine.ApplyPromotions(result.GetCartResult.Cart);
                    unitOfWork.Save();
                }
            }
            // BUSA-636 : pricing 2018 Ends. Differentiate between legacy and volume group contract.
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
