using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces;
using Insite.Core.Plugins.Utilities;
using System.Net.Http;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{
    public class PostBrandMapper : IPostBrandMapper
    {
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IGetUserPaymentProfileMapper GetBrandMapper;
        public PostBrandMapper(IObjectToObjectMapper objectToObjectMapper, IGetUserPaymentProfileMapper GetBrandMapper)
        {
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.GetBrandMapper = GetBrandMapper;
        }
        public AddBrandParameter MapParameter(UserPaymentProfileModel UserPaymentProfileModel, HttpRequestMessage request)
        {
            AddBrandParameter destination = new AddBrandParameter();
            this.ObjectToObjectMapper.Map<UserPaymentProfileModel, AddBrandParameter>(UserPaymentProfileModel, destination);
            return destination;
        }

        public UserPaymentProfileModel MapResult(AddBrandResult serviceResult, HttpRequestMessage request)
        {
            return this.GetBrandMapper.MapResult(new GetUserPaymentProfileResult()
            {
                UserPaymentProfile = serviceResult.Brand
            }, request);
        }
    }
}
