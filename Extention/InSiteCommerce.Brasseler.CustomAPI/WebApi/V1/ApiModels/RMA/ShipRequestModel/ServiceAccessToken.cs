using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class ServiceAccessToken
    {
        [JsonProperty("AccessLicenseNumber")]
        public string AccessLicenseNumber { get; set; }
    }
}
