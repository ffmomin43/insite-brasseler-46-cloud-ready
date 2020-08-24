using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel;
using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryRequestModel
{
    public class LabelRecoveryRequestModel
    {
        [JsonProperty("UPSSecurity")]
        public UPSSecurity UPSSecurity { get; set; }

        [JsonProperty("LabelRecoveryRequest")]
        public LabelRecoveryRequest LabelRecoveryRequest { get; set; }
    }
}
