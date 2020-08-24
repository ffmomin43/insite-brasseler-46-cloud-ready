using Insite.Core.Services;
using Insite.Data.Entities;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Results
{
    public class GetUserPaymentProfileCollectionResult : ResultBase
    {
        public GetUserPaymentProfileCollectionResult()
        {
            this.UserPaymentProfileCollection = (ICollection<UserPaymentProfile>)new Collection<UserPaymentProfile>();
        }

        public ICollection<UserPaymentProfile> UserPaymentProfileCollection
        {
            get;
            set;
        }
    }
}
