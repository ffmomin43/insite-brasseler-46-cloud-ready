using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShipmentResponse
    {
        [JsonProperty("Response")]
        public Response Response { get; set; }

        [JsonProperty("ShipmentResults")]
        public ShipmentResults ShipmentResults { get; set; }
    }
}
