using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class LabelRecoveryResponseModel
    {
        [JsonProperty("LabelRecoveryResponse")]
        public LabelRecoveryResponse LabelRecoveryResponse { get; set; }
    }
}
