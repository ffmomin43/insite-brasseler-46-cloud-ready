using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShippingLabel
    {
        [JsonProperty("ImageFormat")]
        public ResponseStatus ImageFormat { get; set; }

        [JsonProperty("GraphicImage")]
        public string GraphicImage { get; set; }

        [JsonProperty("HTMLImage")]
        public string HtmlImage { get; set; }
    }
}
