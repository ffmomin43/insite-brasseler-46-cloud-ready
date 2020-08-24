using Newtonsoft.Json;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShippingReceipt
    {
        [JsonProperty("ImageFormat")]
        public ResponseStatus ImageFormat { get; set; }

        [JsonProperty("GraphicImage")]
        public string GraphicImage { get; set; }
    }
}
