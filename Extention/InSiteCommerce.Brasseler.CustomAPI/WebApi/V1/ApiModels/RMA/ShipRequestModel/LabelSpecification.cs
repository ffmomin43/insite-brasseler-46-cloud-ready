using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class LabelSpecification
    {
        [JsonProperty("LabelImageFormat")]
        public LabelImageFormat LabelImageFormat { get; set; }

        [JsonProperty("HTTPUserAgent")]
        public string HttpUserAgent { get; set; }
    }
}
