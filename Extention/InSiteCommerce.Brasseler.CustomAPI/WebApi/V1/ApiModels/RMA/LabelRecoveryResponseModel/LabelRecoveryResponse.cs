using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class LabelRecoveryResponse
    {
        [JsonProperty("Response")]
        public StatusResponse Response { get; set; }

        [JsonProperty("ShipmentIdentificationNumber")]
        public string ShipmentIdentificationNumber { get; set; }

        [JsonProperty("LabelResults")]
        public LabelResults LabelResults { get; set; }
    }
}
