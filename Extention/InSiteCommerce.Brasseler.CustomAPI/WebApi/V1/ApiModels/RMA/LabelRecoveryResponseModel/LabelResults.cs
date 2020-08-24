using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.LabelRecoveryResponseModel
{
    public class LabelResults
    {
        [JsonProperty("TrackingNumber")]
        public string TrackingNumber { get; set; }

        [JsonProperty("LabelImage")]
        public LabelImage LabelImage { get; set; }

        [JsonProperty("Receipt")]
        public Receipt Receipt { get; set; }
    }
}
