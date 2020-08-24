using Insite.Core.WebApi;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels
{
    public class UserPaymentProfileCollectionParameter : BaseParameter
    {
        public Guid UserProfileId { get; set; }
    }
}
