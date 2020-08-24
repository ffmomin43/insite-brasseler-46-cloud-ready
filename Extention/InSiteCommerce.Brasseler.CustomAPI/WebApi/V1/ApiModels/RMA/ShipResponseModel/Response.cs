using InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipRequestModel;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels.RMA.ShipResponseModel
{
    public class Response
    {
        [JsonProperty("ResponseStatus")]
        public ResponseStatus ResponseStatus { get; set; }

        [JsonProperty("TransactionReference")]
        public TransactionReference TransactionReference { get; set; }
    }
}
