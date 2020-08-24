using Insite.Cart.Services.Dtos;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.PromotionEngine;
using Insite.Core.Plugins.Utilities;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.Plugins.Pricing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("UpdateCartLine_Brasseler")]
    public sealed class UpdateCartLine_Brasseler : HandlerBase<UpdateCartLineParameter, UpdateCartLineResult>
    {
        private IPricingPipeline pricingPipeline;
        private readonly IHandlerFactory HandlerFactory;
        private readonly IOrderLineUtilities OrderLineUtilities;

        private IPromotionEngine PromotionEngine;
        private PricingServiceBrasseler pricing;
        private decimal TotalQty = 0;
        private string qtyBrCls = string.Empty;

        public UpdateCartLine_Brasseler(IOrderLineUtilities orderLineUtilities, IRoundingRulesProvider roundingRulesProvider, ICustomerOrderUtilities customerOrderUtilities, IPricingPipeline PricingPipeline,IPromotionEngine promotionEngine)
        {
            this.PromotionEngine = promotionEngine;
            this.pricingPipeline = PricingPipeline;
        }

        public override int Order
        {
            get
            {
                return 950;
            }
        }

        public override UpdateCartLineResult Execute(IUnitOfWork unitOfWork, UpdateCartLineParameter parameter, UpdateCartLineResult result)
        {
            //update piricing for Volume group
            CustomerOrder cart = result.GetCartLineResult.GetCartResult.Cart;
            CartLineDto cartLineDto = parameter.CartLineDto;

            if (cartLineDto == null)
                return result;
            OrderLine orderLine = unitOfWork.GetRepository<OrderLine>().Get(cartLineDto.OrderLineId);
            if (orderLine == null)
                return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.NotFound, MessageProvider.Current.Cart_OrderLineNotFound);

            if (result.GetCartLineResult.BreakPrices.Count > 1)
            {
                string QtyBrkCls = unitOfWork.GetRepository<Product>().GetTable().FirstOrDefault(x => x.Id == orderLine.ProductId).PriceBasis;
                orderLine.ConfigurationViewModel = "true";
                if (!string.IsNullOrEmpty(QtyBrkCls))
                {
                    CartHelper_Brasseler helper = new CartHelper_Brasseler(this.pricingPipeline);
                    //update cartline with updated volume grp price & promotion
                    result.GetCartLineResult.GetCartResult.Cart = helper.UpdateVolumeGrpPricing(cart, QtyBrkCls, unitOfWork);
                }
            }
            //Common promotion recalculate logic - BUSA-683
            result.GetCartLineResult.GetCartResult.Cart.RecalculatePromotions = true;
            result.GetCartLineResult.GetCartResult.Cart.RecalculateTax = true;
            this.PromotionEngine.ApplyPromotions(result.GetCartLineResult.GetCartResult.Cart);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

    }
}