using Insite.Core.Plugins.Utilities;
using Insite.Core.WebApi.Interfaces;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{
   public class PatchUserPaymentProfileMapper : IPatchUserPaymentProfileMapper
    {
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IUrlHelper UrlHelper;

        public PatchUserPaymentProfileMapper(IObjectToObjectMapper objectToObjectMapper, IUrlHelper UrlHelper)
        {
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.UrlHelper = UrlHelper;
        }

        public PatchUserPaymentProfileParameter MapParameter(UserPaymentProfileModel userPaymentProfileModel, HttpRequestMessage request)
        {
            return new PatchUserPaymentProfileParameter(userPaymentProfileModel);
        }

        public UserPaymentProfileModel MapResult(PatchUserPaymentProfileResult serviceResult, HttpRequestMessage request)
        {
            return (UserPaymentProfileModel)null;
        }
    }
}
