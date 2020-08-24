using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class ShipmentRequest
    {
        [JsonProperty("Request")]
        public Request Request { get; set; }

        [JsonProperty("Shipment")]
        public Shipment Shipment { get; set; }

        [JsonProperty("LabelSpecification")]
        public LabelSpecification LabelSpecification { get; set; }
    }
}
