using Insite.Core.Services;
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Parameters
{
    public class GetUserPaymentProfileParameter : ParameterBase
    {
        public Guid? UserProfileId { get; set; }
    }
}
