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
using System.Collections.Generic;
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers
{

    public class GetUserPaymentProfileCollectionMapper : IGetUserPaymentProfileCollectionMapper, IWebApiMapper<string, GetUserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionResult, UserPaymentProfileCollectionModel>, ISingletonLifetime, IDependency
    {

        protected readonly IGetUserPaymentProfileMapper GetUserPaymentProfileMapper;
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        protected readonly IUrlHelper UrlHelper;
        public GetUserPaymentProfileCollectionMapper(IGetUserPaymentProfileMapper getUserPaymentProfileMapper, IObjectToObjectMapper objectToObjectMapper, IUrlHelper UrlHelper)
        {
            this.GetUserPaymentProfileMapper = getUserPaymentProfileMapper;
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.UrlHelper = UrlHelper;
        }
        public GetUserPaymentProfileCollectionParameter MapParameter(string apiParameter, HttpRequestMessage request)
        {
            GetUserPaymentProfileCollectionParameter destination = new GetUserPaymentProfileCollectionParameter();
            //if (apiParameter != null)
            //    this.ObjectToObjectMapper.Map<string, GetUserPaymentProfileCollectionParameter>(apiParameter, destination);
            return destination;
        }

        public UserPaymentProfileCollectionModel MapResult(GetUserPaymentProfileCollectionResult serviceResult, HttpRequestMessage request)
        {
            UserPaymentProfileCollectionModel usr = new UserPaymentProfileCollectionModel();

            


                foreach (UserPaymentProfile us in (IEnumerable<UserPaymentProfile>)serviceResult.UserPaymentProfileCollection)
            {
                usr.listUserPaymentProfileModel.Add(this.GetUserPaymentProfileMapper.MapResult(new GetUserPaymentProfileResult
                {
                    UserPaymentProfile = us
                }, request));
            }
            usr.Uri =  this.UrlHelper.Link("UserPaymentProfileV1", null, request);
            return usr;
        }


    }
}
