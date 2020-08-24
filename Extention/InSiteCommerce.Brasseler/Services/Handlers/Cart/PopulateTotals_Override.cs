using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services.Handlers;
using InSiteCommerce.Brasseler.Plugins.EntityUtilities;
using System;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("PopulateTotals")]
    public class PopulateTotals_Override : HandlerBase<GetCartParameter, GetCartResult>
    {
        private readonly Lazy<CustomerOrderUtilities_Brasseler> customerOrderUtilities;

        public PopulateTotals_Override(
          Lazy<CustomerOrderUtilities_Brasseler> customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public override int Order
        {
            get
            {
                return 1899;
            }
        }

        public override GetCartResult Execute(
          IUnitOfWork unitOfWork,
          GetCartParameter parameter,
          GetCartResult result)
        {
            result.OrderSubTotal = this.customerOrderUtilities.Value.GetOrderSubTotal(result.Cart);
            result.OrderSubTotalWithOutProductDiscounts = this.customerOrderUtilities.Value.GetOrderSubTotalWithOutProductDiscounts(result.Cart);
            GetCartResult getCartResult1 = result;
            getCartResult1.OrderGrandTotal = getCartResult1.Cart.OrderTotal;
            result.ShippingAndHandling = this.customerOrderUtilities.Value.GetShippingAndHandling(result.Cart);
            result.TotalTax = this.customerOrderUtilities.Value.GetTotalTax(result.Cart);
            GetCartResult getCartResult2 = result;
            getCartResult2.CurrencySymbol = getCartResult2.Cart.Currency != null ? result.Cart.Currency.CurrencySymbol : SiteContext.Current.CurrencyDto.CurrencySymbol;
            GetCartResult getCartResult3 = result;
            getCartResult3.RequestedDeliveryDate = getCartResult3.Cart.RequestedDeliveryDate;
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
