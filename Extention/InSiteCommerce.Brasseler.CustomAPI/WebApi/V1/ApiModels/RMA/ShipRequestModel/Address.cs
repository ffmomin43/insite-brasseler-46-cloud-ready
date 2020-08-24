using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Address
    {
        [JsonProperty("AddressLine")]
        public string AddressLine { get; set; }

        [JsonProperty("City")]
        public string City { get; set; }

        [JsonProperty("StateProvinceCode")]
        public string StateProvinceCode { get; set; }

        [JsonProperty("PostalCode")]
        public string PostalCode { get; set; }

        [JsonProperty("CountryCode")]
        public string CountryCode { get; set; }
    }
}
