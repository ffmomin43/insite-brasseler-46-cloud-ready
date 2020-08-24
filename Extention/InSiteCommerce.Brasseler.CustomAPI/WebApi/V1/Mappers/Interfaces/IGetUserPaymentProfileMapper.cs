using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.WebApi.Interfaces;


namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces
{
    public interface IGetUserPaymentProfileMapper : IWebApiMapper<UserPaymentProfileParameter, GetUserPaymentProfileParameter, GetUserPaymentProfileResult, UserPaymentProfileModel>, ISingletonLifetime, IDependency
    {
    }
}
