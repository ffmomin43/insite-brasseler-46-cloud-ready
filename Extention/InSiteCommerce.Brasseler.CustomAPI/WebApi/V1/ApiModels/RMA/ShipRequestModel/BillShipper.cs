using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class BillShipper
    {
        [JsonProperty("AccountNumber")]
        public string AccountNumber { get; set; }
    }
}
