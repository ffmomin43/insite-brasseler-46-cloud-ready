using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class Receipt
    {
        [JsonProperty("HTMLImage")]
        public string HtmlImage { get; set; }
    }
}
