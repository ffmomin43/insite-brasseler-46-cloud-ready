using Newtonsoft.Json;
using System.Collections.Generic;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel
{
    public class Package
    {
        [JsonProperty("ReferenceNumber")]
        public List<ReferenceNumber> ReferenceNumber { get; set; }

        [JsonProperty("Description")]
        public string Description { get; set; }

        [JsonProperty("Packaging")]
        public LabelImageFormat Packaging { get; set; }

        [JsonProperty("PackageWeight")]
        public PackageWeight PackageWeight { get; set; }
    }
}
