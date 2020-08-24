using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class UPSSecurity
    {
        [JsonProperty("UsernameToken")]
        public UsernameToken UsernameToken { get; set; }

        [JsonProperty("ServiceAccessToken")]
        public ServiceAccessToken ServiceAccessToken { get; set; }
    }
}
