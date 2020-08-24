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
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{

    public class DeleteUserPaymentProfileMapper : IDeleteUserPaymentProfileMapper, IWebApiMapper<string, RemoveUserPaymentProfileParameter, RemoveUserPaymentProfileResult, UserPaymentProfileModel>, ISingletonLifetime, IDependency
    {
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IUrlHelper UrlHelper;
        public DeleteUserPaymentProfileMapper(IObjectToObjectMapper objectToObjectMapper, IUrlHelper UrlHelper)
        {
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.UrlHelper = UrlHelper;
        }
        public RemoveUserPaymentProfileParameter MapParameter(string userPaymentProfileId, HttpRequestMessage request)
        {
            return new RemoveUserPaymentProfileParameter(userPaymentProfileId);
        }

        public UserPaymentProfileModel MapResult(RemoveUserPaymentProfileResult serviceResult, HttpRequestMessage request)
        {
            return (UserPaymentProfileModel)null;
        }
    }
}
