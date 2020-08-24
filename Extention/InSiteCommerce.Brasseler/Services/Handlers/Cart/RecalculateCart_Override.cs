using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Common.Providers;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("RecalculateCart")]
    public sealed class RecalculateCart_Override : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly CartSettings cartSettings;
        private readonly IPricingPipeline pricingPipeline;

        public RecalculateCart_Override(IPricingPipeline pricingPipeline, CartSettings cartSettings)
        {
            this.pricingPipeline = pricingPipeline;
            this.cartSettings = cartSettings;
        }

        public override int Order
        {
            get
            {
                return 899;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            if (!result.Cart.OrderLines.Any<OrderLine>())
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (result.Cart.Status != "Cart" && result.Cart.Status != "Saved" && result.Cart.Status != "AwaitingApproval" && result.Cart.Status != "SubscriptionOrder")
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (!parameter.ForceRecalculation)
            {
                DateTimeOffset? lastPricingOn = result.Cart.LastPricingOn;
                if (lastPricingOn.HasValue)
                {
                    lastPricingOn = result.Cart.LastPricingOn;
                    if ((DateTimeOffset)lastPricingOn.Value.DateTime.AddMinutes((double)this.cartSettings.MinutesBeforeRecalculation) > DateTimeProvider.Current.Now)
                        return this.NextHandler.Execute(unitOfWork, parameter, result);
                }
            }
            result.Cart.ShippingCalculationNeededAsOf = DateTimeProvider.Current.Now;
            result.Cart.RecalculateTax = true;
            if (result.Cart.Type != "Quote" && result.Cart.Type != "Job")
                result.Cart.RecalculatePromotions = true;
            GetCartPricingResult cartPricing = this.pricingPipeline.GetCartPricing(new GetCartPricingParameter(result.Cart));
            if (cartPricing.ResultCode == ResultCode.Success)
            {
                result.Cart = cartPricing.Cart;
                result.CartNotPriced = false;
            }
            else
            {
                result.CanCheckOut = false;
                result.CartNotPriced = true;
                this.CopyMessages((ResultBase)cartPricing, (ResultBase)result);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}