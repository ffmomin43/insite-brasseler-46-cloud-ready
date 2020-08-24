using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Pipelines.Pricing.Parameters;
using Insite.Core.Plugins.Pipelines.Pricing.Results;
using Insite.Core.Plugins.PromotionEngine;
using System;

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    public sealed class CalculatePromotions : IPipe<GetCartPricingParameter, GetCartPricingResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        private readonly Lazy<IPromotionEngine> promotionEngine;
        public CalculatePromotions(Lazy<IPromotionEngine> promotionEngine)
        {
            this.promotionEngine = promotionEngine;
        }

        public int Order
        {
            get
            {
                return 300;
            }
        }
        public GetCartPricingResult Execute(
          IUnitOfWork unitOfWork,
          GetCartPricingParameter parameter,
          GetCartPricingResult result)
        {
            if (parameter.Cart.Type != "Quote" && parameter.Cart.Type != "Job" && !parameter.Cart.Type.Equals("Return Requested"))
                this.promotionEngine.Value.ApplyPromotions(parameter.Cart);
            result.Cart = parameter.Cart;
            return result;
        }
    }
}
