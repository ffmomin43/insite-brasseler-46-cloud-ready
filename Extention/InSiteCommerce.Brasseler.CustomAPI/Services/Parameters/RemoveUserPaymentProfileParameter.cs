using Insite.Core.Services;
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Parameters
{
    public class RemoveUserPaymentProfileParameter : ParameterBase
    {
        public string UserPaymentProfileId { get; set; }

        public RemoveUserPaymentProfileParameter(string userPaymentProfileId)
        {
            this.UserPaymentProfileId = userPaymentProfileId;
        }

    }
}
