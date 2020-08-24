using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.Pipelines;
using Insite.Core.Plugins.Utilities;
using Insite.Core.SystemSetting.Groups.OrderManagement;
using Insite.Data.Entities;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Pipelines
{
    public sealed class SetQtyOrdered : IPipe<AddCartLineParameter, AddCartLineResult>, IMultiInstanceDependency, IDependency, IExtension
    {
        private readonly IRoundingRulesProvider roundingRulesProvider;
        private readonly IOrderLineUtilities orderLineUtilities;
        private readonly CartSettings cartSettings;

        public int Order
        {
            get
            {
                return 500;
            }
        }

        public SetQtyOrdered(
          IRoundingRulesProvider roundingRulesProvider,
          IOrderLineUtilities orderLineUtilities,
          CartSettings cartSettings)
        {
            this.roundingRulesProvider = roundingRulesProvider;
            this.orderLineUtilities = orderLineUtilities;
            this.cartSettings = cartSettings;
        }

        public AddCartLineResult Execute(
          IUnitOfWork unitOfWork,
          AddCartLineParameter parameter,
          AddCartLineResult result)
        {
            if (!parameter.QtyOrdered.HasValue)
                return result;
            OrderLine cartLine = result.CartLine;
            Decimal qtyOrdered1 = !this.cartSettings.ReplaceOnAdd || !(parameter.Cart.Status != "Requisition") ? parameter.QtyOrdered.Value + cartLine.QtyOrdered : parameter.QtyOrdered.Value;
            if (cartLine.Product.MinimumOrderQty > 0)
            {
                ProductUnitOfMeasure productUnitOfMeasure = cartLine.Product.ProductUnitOfMeasures.FirstOrDefault<ProductUnitOfMeasure>((Func<ProductUnitOfMeasure, bool>)(o =>
               {
                   if (o.UnitOfMeasure == cartLine.UnitOfMeasure)
                       return o.QtyPerBaseUnitOfMeasure > Decimal.Zero;
                   return false;
               }));
                Decimal num = productUnitOfMeasure != null ? productUnitOfMeasure.QtyPerBaseUnitOfMeasure : Decimal.One;
                if (qtyOrdered1 * num < (Decimal)cartLine.Product.MinimumOrderQty)
                {
                    qtyOrdered1 = Decimal.Ceiling((Decimal)cartLine.Product.MinimumOrderQty / num);
                    result.IsQtyAdjusted = true;
                }
            }
            Decimal qtyOrdered2 = this.roundingRulesProvider.ApplyRoundingRules(cartLine.Product, cartLine.UnitOfMeasure, qtyOrdered1);
            if (qtyOrdered2 != qtyOrdered1)
                result.IsQtyAdjusted = true;
            this.orderLineUtilities.SetQtyOrdered(cartLine, qtyOrdered2);

            // BUSA-1319: Limit Qty Per Product on PLP, PDP, QuickOrder, ReOrder, Saved Order
            var maxProductQty = cartLine.Product?.CustomProperties.Where(x => x.Name.EqualsIgnoreCase("maxProductQty")).Select(v => v.Value).FirstOrDefault() ?? "0";

            if (!string.IsNullOrEmpty(maxProductQty) && Convert.ToInt32(maxProductQty) != 0 && cartLine.QtyOrdered > Convert.ToDecimal(maxProductQty))
            {
                cartLine.QtyOrdered = Convert.ToDecimal(maxProductQty);
                result.IsQtyAdjusted = true;
            }
            // BUSA- 1319: END

            return result;
        }
    }
}
