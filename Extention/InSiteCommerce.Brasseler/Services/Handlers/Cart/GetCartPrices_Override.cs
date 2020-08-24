using Insite.Cart.Services.Dtos;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
//GetCartCollectionHandler_Brasseler : Execute
namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("GetCartPrices")]
    public class GetCartPrices_Override : HandlerBase<GetCartCollectionParameter, GetCartCollectionResult>
    {
        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public GetCartPrices_Override(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public override int Order
        {
            get
            {
                return 999;
            }
        }
        //BUSA-859: Add to Existing SS
        public override GetCartCollectionResult Execute(IUnitOfWork unitOfWork, GetCartCollectionParameter parameter, GetCartCollectionResult result)
        {
            Dictionary<Guid, string> subscriptionNames = new Dictionary<Guid, string>();
            foreach (CustomerOrder cart in result.Carts)
            { 
                result.CartPrices[cart.Id] = new CartPriceDto()
                {
                    OrderSubTotal = customerOrderUtilities.GetOrderSubTotal(cart),
                    OrderGrandTotal = customerOrderUtilities.GetOrderTotal(cart),
                    ShippingAndHandling = customerOrderUtilities.GetShippingAndHandling(cart),
                    TotalTax = customerOrderUtilities.GetTotalTax(cart)
                };

                var subscriptionName = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.Name.ToUpper() == "SUBSCRIPTIONNAME" && x.ParentId == cart.Id);
                if (subscriptionName != null)
                {
                    subscriptionNames.Add(cart.Id, subscriptionName.Value);
                }
                else
                {
                    subscriptionNames.Add(cart.Id, cart.OrderNumber);
                }
            }

            AddObjectToResultProperties(result, "subscriptionNames", subscriptionNames);
            return NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
