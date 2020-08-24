using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class PackageWeight
    {
        [JsonProperty("UnitOfMeasurement")]
        public LabelImageFormat UnitOfMeasurement { get; set; }

        [JsonProperty("Weight")]
        public string Weight { get; set; }
    }
}
