using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryRequestModel
{
    public partial class Translate
    {
        [JsonProperty("LanguageCode")]
        public string LanguageCode { get; set; }

        [JsonProperty("DialectCode")]
        public string DialectCode { get; set; }

        [JsonProperty("Code")]
        public string Code { get; set; }
    }
}
