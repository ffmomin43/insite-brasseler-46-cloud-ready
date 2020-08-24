using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class BillingWeight
    {
        [JsonProperty("UnitOfMeasurement")]
        public ResponseStatus UnitOfMeasurement { get; set; }

        [JsonProperty("Weight")]
        public string Weight { get; set; }
    }
}
