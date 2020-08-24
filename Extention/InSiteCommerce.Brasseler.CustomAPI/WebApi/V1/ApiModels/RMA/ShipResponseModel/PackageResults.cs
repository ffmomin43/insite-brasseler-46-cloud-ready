using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class PackageResults
    {
        [JsonProperty("TrackingNumber")]
        public string TrackingNumber { get; set; }

        [JsonProperty("ServiceOptionsCharges")]
        public Charges ServiceOptionsCharges { get; set; }

        [JsonProperty("ShippingLabel")]
        public ShippingLabel ShippingLabel { get; set; }

        [JsonProperty("ShippingReceipt")]
        public ShippingReceipt ShippingReceipt { get; set; }
    }
}
