using InSiteCommerce.Brasseler.CustomAPI.Services;
using InSiteCommerce.Brasseler.CustomAPI.Services.Parameters;
using InSiteCommerce.Brasseler.CustomAPI.Services.Results;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Mappers.Interfaces;
using Insite.Core.Plugins.Utilities;
using Insite.Core.WebApi;
using System;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using Insite.Data.Entities;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1
{
    [Authorize]
    [RoutePrefix("api/v1/UserPaymentProfile")]
    public class UserPaymentProfileV1Controller : BaseApiController
    {
        private readonly IGetUserPaymentProfileCollectionMapper getUserPaymentProfileCollectionMapper;
        private readonly IUserPaymentProfileService UserPaymentProfileService;
        private readonly IGetUserPaymentProfileMapper getUserPaymentProfileToMapper;
        private readonly IDeleteUserPaymentProfileMapper deleteUserPaymentProfileMapper;
        private readonly IPatchUserPaymentProfileMapper patchUserPaymentProfileMapper;

        public UserPaymentProfileV1Controller(ICookieManager cookieManager, IUserPaymentProfileService UserPaymentProfileService, IGetUserPaymentProfileCollectionMapper getUserPaymentProfileCollectionMapper, IGetUserPaymentProfileMapper getUserPaymentProfileToMapper, IDeleteUserPaymentProfileMapper deleteUserPaymentProfileMapper,IPatchUserPaymentProfileMapper patchUserPaymentProfileMapper)
      : base(cookieManager)
        {
            this.UserPaymentProfileService = UserPaymentProfileService;
            this.getUserPaymentProfileToMapper = getUserPaymentProfileToMapper;
            this.getUserPaymentProfileCollectionMapper = getUserPaymentProfileCollectionMapper;
            this.deleteUserPaymentProfileMapper = deleteUserPaymentProfileMapper;
            this.patchUserPaymentProfileMapper = patchUserPaymentProfileMapper;
        }

        [ResponseType(typeof(UserPaymentProfileCollectionModel))]
        [Route(Name = "UserPaymentProfileV1")]
        public async Task<IHttpActionResult> Get()
        {
            return await this.ExecuteAsync<IGetUserPaymentProfileCollectionMapper, string, GetUserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionResult, UserPaymentProfileCollectionModel>(this.getUserPaymentProfileCollectionMapper, new Func<GetUserPaymentProfileCollectionParameter, GetUserPaymentProfileCollectionResult>(this.UserPaymentProfileService.GetUserPaymentProfileCollection), string.Empty);

        }


        [Route("{userPaymentProfileId}")]
        [ResponseType(typeof(UserPaymentProfileModel))]
        public async Task<IHttpActionResult> Delete(string userPaymentProfileId)
        {
            return await this.ExecuteAsync<IDeleteUserPaymentProfileMapper, string, RemoveUserPaymentProfileParameter, RemoveUserPaymentProfileResult, UserPaymentProfileModel>(this.deleteUserPaymentProfileMapper, new Func<RemoveUserPaymentProfileParameter, RemoveUserPaymentProfileResult>(this.UserPaymentProfileService.RemoveUserPaymentProfile), userPaymentProfileId);
        }

        [Route("{userPaymentProfileId}")]   //BUSA-1122 updating existing payment profile
        [ResponseType(typeof(UserPaymentProfileModel))]
        public async Task<IHttpActionResult>  Patch([FromBody] UserPaymentProfileModel model)
        {
            return await this.ExecuteAsync<IPatchUserPaymentProfileMapper, UserPaymentProfileModel, PatchUserPaymentProfileParameter, PatchUserPaymentProfileResult, UserPaymentProfileModel>(this.patchUserPaymentProfileMapper, new Func<PatchUserPaymentProfileParameter, PatchUserPaymentProfileResult>(this.UserPaymentProfileService.PatchUserPaymentProfile), model);
        }

    }
}
