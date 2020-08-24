using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel;
using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class StatusResponse
    {
        [JsonProperty("ResponseStatus")]
        public ResponseStatus ResponseStatus { get; set; }

        [JsonProperty("TransactionReference")]
        public string TransactionReference { get; set; }
    }
}
