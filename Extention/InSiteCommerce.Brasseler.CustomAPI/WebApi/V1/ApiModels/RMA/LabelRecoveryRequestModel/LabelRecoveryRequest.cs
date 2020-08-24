using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel;
using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryRequestModel
{
    public partial class LabelRecoveryRequest
    {
        [JsonProperty("LabelSpecification")]
        public LabelSpecification LabelSpecification { get; set; }

        [JsonProperty("Translate")]
        public Translate Translate { get; set; }

        [JsonProperty("TrackingNumber")]
        public string TrackingNumber { get; set; }
    }
}
