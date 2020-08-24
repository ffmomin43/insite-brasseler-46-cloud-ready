using Insite.Core.Services.Handlers;
using Insite.Core.Interfaces.Dependency;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Data.Entities;
using System.Linq;
using Insite.Core.Context;
using Insite.Core.Providers;
using Insite.Core.Services;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Handlers
{
    [DependencyName("GetUserPaymentProfileCollectionHandler")]
    public class GetUserPaymentProfileCollectionHandler : HandlerBase<GetUserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionResult>
    {
        public GetUserPaymentProfileCollectionHandler()
        {

        }
        public override int Order
        {
            get
            {
                return 500;
            }
        }

        public override GetUserPaymentProfileCollectionResult Execute(IUnitOfWork unitOfWork, GetUserPaymentProfileCollectionParameter parameter, GetUserPaymentProfileCollectionResult result)
        {            
            UserProfile userProfile = SiteContext.Current.UserProfile;
            if (userProfile == null)
                return this.CreateErrorServiceResult<GetUserPaymentProfileCollectionResult>(result, SubCode.NotFound, string.Format(MessageProvider.Current.Not_Found, (object)"UserProfile"));
            var us = userProfile.UserPaymentProfiles.Where(x => x.UserProfileId == userProfile.Id).ToList<UserPaymentProfile>();
            result.UserPaymentProfileCollection = us;
            var defaultCreditCard = unitOfWork.GetRepository<CustomProperty>().GetTable().FirstOrDefault(x => x.ParentId == userProfile.Id && x.Name == "defaultCardId");

            if(defaultCreditCard !=null)
            result.Properties.Add("defaultCardId", defaultCreditCard.Value);
            
            return NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
