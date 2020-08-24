using Insite.Core.Services;
using Insite.Core.WebApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
   public class GetOutstandingInvoiceParameter : PagingParameterBase
    {
        public string OutputType { get; set; }
        public string InputType { get; set; }
        public string TransactionName { get; set; }
    }
}
