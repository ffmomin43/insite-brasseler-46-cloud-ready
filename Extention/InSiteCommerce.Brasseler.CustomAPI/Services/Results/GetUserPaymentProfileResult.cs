using Insite.Core.Services;
using Insite.Data.Entities;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Results
{
    public class GetUserPaymentProfileResult : ResultBase
    {
        public UserPaymentProfile UserPaymentProfile { get; set; }
    }
}
