using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Phone
    {
        [JsonProperty("Number")]
        public string Number { get; set; }
    }
}
