using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Request
    {
        [JsonProperty("RequestOption")]
        public string RequestOption { get; set; }

        [JsonProperty("TransactionReference")]
        public TransactionReference TransactionReference { get; set; }
    }
}
