using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Services.Handlers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Data.Entities;
using Insite.Core.Plugins.EntityUtilities;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{

    /*
    *   Handler Overrided to display with CC(Argument)under order history page
    */
    [DependencyName("UpdateCart")]
    class UpdateCart_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public UpdateCart_Brasseler(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public override int Order
        {
            get
            {
                return 900;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            CustomerOrder cart = result.GetCartResult.Cart;
            CustomerOrder customerOrder1 = cart;
            DateTimeOffset? nullable1 = parameter.OrderDate;
            DateTimeOffset dateTimeOffset = nullable1 ?? cart.OrderDate;
            customerOrder1.OrderDate = dateTimeOffset;
            cart.Notes = parameter.Notes ?? cart.Notes;
            cart.CustomerPO = parameter.PoNumber ?? cart.CustomerPO;

            if (!string.IsNullOrEmpty(parameter.PaymentProfileId))
            {
                cart.TermsCode = "CC";
            }
            else
            {
                if (parameter.CreditCard != null)
                {
                    if (!string.IsNullOrEmpty(parameter.CreditCard.CardHolderName))
                    {
                        cart.TermsCode = "CC";
                    }
                    else
                    {
                        cart.TermsCode = cart.TermsCode;
                    }
                }
            }

            CustomerOrder customerOrder2 = cart;
            DateTimeOffset? nullable2;
            if (!(parameter.RequestedDeliveryDate == string.Empty))
            {
                nullable2 = parameter.RequestedDeliveryDate == null ? cart.RequestedDeliveryDate : new DateTimeOffset?(DateTimeOffset.Parse(parameter.RequestedDeliveryDate));
            }
            else
            {
                nullable1 = new DateTimeOffset?();
                nullable2 = nullable1;
            }
            customerOrder2.RequestedDeliveryDate = nullable2;
            this.customerOrderUtilities.SetImpersonatedBy(cart);
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
