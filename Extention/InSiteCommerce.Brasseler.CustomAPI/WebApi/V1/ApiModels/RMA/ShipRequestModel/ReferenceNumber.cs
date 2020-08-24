using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class ReferenceNumber
    {
        [JsonProperty("Code")]
        public string Code { get; set; }

        [JsonProperty("Value")]
        public string Value { get; set; }
    }
}
