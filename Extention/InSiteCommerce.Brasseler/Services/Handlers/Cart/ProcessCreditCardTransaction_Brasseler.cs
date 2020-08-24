using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Plugins.PaymentGateway.Dtos;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{

    /*
    *   Handler Overrided to display with CC(Argument)under order history page
    */
    [DependencyName("ProcessCreditCardTransaction_Brasseler")]
    public class ProcessCreditCardTransaction_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {        
        public ProcessCreditCardTransaction_Brasseler(ICustomerOrderUtilities customerOrderUtilities)
        {
            //this.customerOrderUtilities = customerOrderUtilities;
        }

        public override int Order
        {
            get
            {
                return 2750;
            }
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (parameter.PaymentProfileId != null)
            {
                UserPaymentProfile userPaymentProfile = unitOfWork.GetRepository<UserPaymentProfile>().GetTable().FirstOrDefault(p => p.CardIdentifier == parameter.PaymentProfileId);
                if (userPaymentProfile != null)
                {
                    CreditCardDto cc = new CreditCardDto();
                    cc.CardNumber = userPaymentProfile.MaskedCardNumber;
                    cc.CardType = userPaymentProfile.CardType;
                    if (!string.IsNullOrEmpty(userPaymentProfile.ExpirationDate))
                    {
                        cc.ExpirationMonth = Convert.ToInt32(userPaymentProfile.ExpirationDate.Substring(0, 2));
                        cc.ExpirationYear = Convert.ToInt32(userPaymentProfile.ExpirationDate.Substring(2, 2));
                    }
                    parameter.CreditCard = cc;
                }
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
