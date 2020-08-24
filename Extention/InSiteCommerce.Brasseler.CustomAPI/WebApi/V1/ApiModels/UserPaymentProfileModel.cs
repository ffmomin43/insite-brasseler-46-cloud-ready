using Insite.Core.WebApi;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels
{
    public class UserPaymentProfileModel : BaseModel
    {
        public string Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string Description { get; set; }
        public string CardType { get; set; }
        public string ExpirationDate { get; set; }
        public string MaskedCardNumber { get; set; }
        public string CardIdentifier { get; set; }
    }
}
