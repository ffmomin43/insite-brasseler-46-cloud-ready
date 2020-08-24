using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShipResponseModel
    {
        [JsonProperty("ShipmentResponse")]
        public ShipmentResponse ShipmentResponse { get; set; }
    }
}
