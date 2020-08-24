using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Shipment
    {
        [JsonProperty("Description")]
        public string Description { get; set; }

        [JsonProperty("Shipper")]
        public Shipper Shipper { get; set; }

        [JsonProperty("ShipTo")]
        public Ship ShipTo { get; set; }

        [JsonProperty("ShipFrom")]
        public Ship ShipFrom { get; set; }

        [JsonProperty("PaymentInformation")]
        public PaymentInformation PaymentInformation { get; set; }

        [JsonProperty("Service")]
        public LabelImageFormat Service { get; set; }

        [JsonProperty("ReturnService")]
        public LabelImageFormat ReturnService { get; set; }

        [JsonProperty("Package")]
        public Package Package { get; set; }
    }
}
