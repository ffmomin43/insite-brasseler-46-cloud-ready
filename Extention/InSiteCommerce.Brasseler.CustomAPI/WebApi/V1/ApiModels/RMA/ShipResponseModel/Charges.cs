using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class Charges
    {
        [JsonProperty("CurrencyCode")]
        public string CurrencyCode { get; set; }

        [JsonProperty("MonetaryValue")]
        public string MonetaryValue { get; set; }
    }
}
