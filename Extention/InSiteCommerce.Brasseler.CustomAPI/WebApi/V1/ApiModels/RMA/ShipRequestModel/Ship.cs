using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Ship
    {
        [JsonProperty("Name")]
        public string Name { get; set; }

        [JsonProperty("AttentionName", NullValueHandling = NullValueHandling.Ignore)]
        public string AttentionName { get; set; }

        [JsonProperty("Phone")]
        public Phone Phone { get; set; }

        [JsonProperty("Address")]
        public Address Address { get; set; }

    }
}
