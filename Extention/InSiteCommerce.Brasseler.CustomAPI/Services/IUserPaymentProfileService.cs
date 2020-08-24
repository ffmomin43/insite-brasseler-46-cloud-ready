using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using Insite.Core.Interfaces.Dependency;

namespace InSiteCommerce.Brasseler.CustomAPI.Services
{
    public interface IUserPaymentProfileService : IInterceptable, IDependency
    {
        GetUserPaymentProfileCollectionResult GetUserPaymentProfileCollection(GetUserPaymentProfileCollectionParameter parameter);
        RemoveUserPaymentProfileResult RemoveUserPaymentProfile(RemoveUserPaymentProfileParameter parameter);
        //BUSA-1122 updating existing payment profile
        PatchUserPaymentProfileResult PatchUserPaymentProfile(PatchUserPaymentProfileParameter parameter); 

    }
}
