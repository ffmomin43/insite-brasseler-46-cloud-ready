using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class ShipRequestModel
    {
        [JsonProperty("UPSSecurity")]
        public UPSSecurity UPSSecurity { get; set; }

        [JsonProperty("ShipmentRequest")]
        public ShipmentRequest ShipmentRequest { get; set; }
    }
}
