using System.Net.Http;
using Insite.Core.WebApi.Interfaces;
using Insite.Core.Extensions;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Utilities;
using Insite.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{

    public class GetUserPaymentProfileMapper : IGetUserPaymentProfileMapper, IWebApiMapper<UserPaymentProfileParameter, GetUserPaymentProfileParameter, GetUserPaymentProfileResult, UserPaymentProfileModel>, ISingletonLifetime, IDependency
    {
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IUrlHelper UrlHelper;
        public GetUserPaymentProfileMapper(IObjectToObjectMapper objectToObjectMapper, IUrlHelper UrlHelper)
        {
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.UrlHelper = UrlHelper;
        }
        public GetUserPaymentProfileParameter MapParameter(UserPaymentProfileParameter apiParameter, HttpRequestMessage request)
        {
            return this.ObjectToObjectMapper.Map<UserPaymentProfileParameter, GetUserPaymentProfileParameter>(apiParameter);
        }

        public UserPaymentProfileModel MapResult(GetUserPaymentProfileResult serviceResult, HttpRequestMessage request)
        {
            UserPaymentProfileModel userPaymentProfileModel = new UserPaymentProfileModel();         

            if (serviceResult.UserPaymentProfile == null)
                userPaymentProfileModel = null;
            else
            {
                userPaymentProfileModel = this.ObjectToObjectMapper.Map<UserPaymentProfile, UserPaymentProfileModel>(serviceResult.UserPaymentProfile);
                userPaymentProfileModel.Uri = this.UrlHelper.Link("UserPaymentProfileV1", (object)new { userPaymentProfileModel.Id }
                , request);
                userPaymentProfileModel.Uri = userPaymentProfileModel.Uri.Replace("?Id=", "/");
            }

            return userPaymentProfileModel;
        }
    }
}
