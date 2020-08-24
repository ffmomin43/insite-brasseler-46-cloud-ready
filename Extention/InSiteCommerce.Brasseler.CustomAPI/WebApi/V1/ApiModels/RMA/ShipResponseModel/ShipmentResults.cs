using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class ShipmentResults
    {
        [JsonProperty("ShipmentCharges")]
        public ShipmentCharges ShipmentCharges { get; set; }

        [JsonProperty("BillingWeight")]
        public BillingWeight BillingWeight { get; set; }

        [JsonProperty("ShipmentIdentificationNumber")]
        public string ShipmentIdentificationNumber { get; set; }

        [JsonProperty("PackageResults")]
        public PackageResults PackageResults { get; set; }
    }
}
