using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShipmentCharges
    {
        [JsonProperty("TransportationCharges")]
        public Charges TransportationCharges { get; set; }

        [JsonProperty("ServiceOptionsCharges")]
        public Charges ServiceOptionsCharges { get; set; }

        [JsonProperty("TotalCharges")]
        public Charges TotalCharges { get; set; }
    }
}
