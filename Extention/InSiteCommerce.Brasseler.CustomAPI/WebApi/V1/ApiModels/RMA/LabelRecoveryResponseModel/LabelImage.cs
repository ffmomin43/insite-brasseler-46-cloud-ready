using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class LabelImage
    {
        [JsonProperty("GraphicImage")]
        public string GraphicImage { get; set; }

        [JsonProperty("HTMLImage")]
        public string HtmlImage { get; set; }

        [JsonProperty("PDF417")]
        public string Pdf417 { get; set; }
    }
}
