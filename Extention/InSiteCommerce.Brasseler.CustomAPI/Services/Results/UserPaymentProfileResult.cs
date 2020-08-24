using Insite.Core.Services;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Results
{
    public class UserPaymentProfileResult : ResultBase
    {
        public string Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string Description { get; set; }
        public string CardType { get; set; }
        public string ExpirationDate { get; set; }
        public string MaskedCardNumber { get; set; }
    }
}
