using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Shipper
    {
        [JsonProperty("Name")]
        public string Name { get; set; }

        [JsonProperty("ShipperNumber")]
        public string ShipperNumber { get; set; }

        [JsonProperty("Address")]
        public Address Address { get; set; }
    }
}
