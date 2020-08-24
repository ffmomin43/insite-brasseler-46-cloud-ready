using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class PaymentInformation
    {
        [JsonProperty("ShipmentCharge")]
        public ShipmentCharge ShipmentCharge { get; set; }
    }
}
