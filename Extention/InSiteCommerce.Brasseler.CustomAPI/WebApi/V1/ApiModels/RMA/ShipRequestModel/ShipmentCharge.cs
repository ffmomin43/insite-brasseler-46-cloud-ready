using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class ShipmentCharge
    {
        [JsonProperty("Type")]
        public string Type { get; set; }

        [JsonProperty("BillShipper")]
        public BillShipper BillShipper { get; set; }
    }
}
