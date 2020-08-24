using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class TransactionReference
    {
        [JsonProperty("CustomerContext")]
        public string CustomerContext { get; set; }
    }
}
