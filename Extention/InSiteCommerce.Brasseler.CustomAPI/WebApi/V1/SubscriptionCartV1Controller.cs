using Insite.Core.Plugins.Utilities;
using Insite.Core.WebApi;
using System.Web.Http;
using System.Web.Http.Description;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos;
using InSiteCommerce.Brasseler.CustomAPI.Services.Handlers;
using Insite.Core.Interfaces.Data;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1
{
    [Authorize]
    [RoutePrefix("api/v1/SubscriptionCart")]
    public class SubscriptionCartV1Controller : BaseApiController
    {
        protected readonly IUnitOfWorkFactory unitOfWork;

        public SubscriptionCartV1Controller(ICookieManager cookieManager, IUnitOfWorkFactory unitOfWorkFactory)
      : base(cookieManager)
        {
            this.unitOfWork = unitOfWorkFactory;

        }

        [ResponseType(typeof(CartSubscriptionDto)), Route(Name = "CartSubscriptionDtoV1")]
        public async void Post([FromBody] CartSubscriptionDto cartSubscriptionDto)
        {
            CartSubscriptionDtoHandler handler = new CartSubscriptionDtoHandler(this.unitOfWork);
            handler.PostCartSubscriptionDto(cartSubscriptionDto);
            return;
        }
    }
}
