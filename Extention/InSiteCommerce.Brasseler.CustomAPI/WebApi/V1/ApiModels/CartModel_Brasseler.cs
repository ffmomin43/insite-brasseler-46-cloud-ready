using Insite.Cart.WebApi.V1.ApiModels;
using InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels
{
    public class CartModel_Brasseler : CartModel
    {
        public CartModel_Brasseler() : base()
        {
            this.CartSubscriptionDto = new CartSubscriptionDto();
        }
        public CartSubscriptionDto CartSubscriptionDto { get; set; }
    }
}