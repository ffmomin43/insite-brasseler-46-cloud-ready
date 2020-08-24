using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines.Pricing;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers
{
    [DependencyName("CalculateShipping")]
    class CalculateShipping_Brasseler : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly IOrderLineUtilities orderLineUtilities;
        private readonly IPricingPipeline pricingPipeline;

        public CalculateShipping_Brasseler(IOrderLineUtilities orderLineUtilities, IPricingPipeline pricingPipeline)
        {
            this.orderLineUtilities = orderLineUtilities;
            this.pricingPipeline = pricingPipeline;
        }

        public override int Order
        {
            get
            {
                return 1700;
            }
        }

        public override GetCartResult Execute(IUnitOfWork unitOfWork, GetCartParameter parameter, GetCartResult result)
        {
            if (result.Cart.Status == "Saved")
            {
                GetCartPricingResult cartPricing1 = this.pricingPipeline.GetCartPricing(new GetCartPricingParameter(result.Cart)
                {
                    CalculateShipping = true,
                    CalculateOrderLines = false
                });
            }
            if (!parameter.CalculateShipping || !result.Cart.OrderLines.Any<OrderLine>((Func<OrderLine, bool>)(o => this.orderLineUtilities.GetIsActive(o))))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            GetCartPricingResult cartPricing = this.pricingPipeline.GetCartPricing(new GetCartPricingParameter(result.Cart)
            {
                CalculateShipping = true,
                CalculateOrderLines = false
            });
            if (cartPricing.ResultCode != ResultCode.Success)
            {
                result.CanCheckOut = cartPricing.SubCode == SubCode.PricingShippingNotCalculated && result.CanCheckOut;
                this.CopyMessages((ResultBase)cartPricing, (ResultBase)result);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
