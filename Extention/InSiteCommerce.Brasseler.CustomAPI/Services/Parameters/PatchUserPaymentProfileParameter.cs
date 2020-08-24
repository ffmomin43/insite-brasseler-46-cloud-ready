using Insite.Core.Services;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Parameters
{  //BUSA-1122 updating existing payment profile
    public class PatchUserPaymentProfileParameter : ParameterBase
    {
        public Guid Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string Description { get; set; }
        public string CardType { get; set; }
        public string ExpirationDate { get; set; }
        public string MaskedCardNumber { get; set; }
        public string CardIdentifier { get; set; }

        public PatchUserPaymentProfileParameter(UserPaymentProfileModel userPaymentProfileModel)
        {
            this.Id = Guid.Parse( userPaymentProfileModel.Id);
            this.UserProfileId = userPaymentProfileModel.UserProfileId;
            this.Description = userPaymentProfileModel.Description;
            this.CardType = userPaymentProfileModel.CardType;
            this.ExpirationDate = userPaymentProfileModel.ExpirationDate;
            this.MaskedCardNumber = userPaymentProfileModel.MaskedCardNumber;
            this.CardIdentifier = userPaymentProfileModel.CardIdentifier;
        }
    }
}
