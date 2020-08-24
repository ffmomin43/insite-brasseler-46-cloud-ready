using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.ApiModels
{
   public class InvoiceList
    {
        public string InvoiceNo { get; set; }
        public string PaymentAmount { get; set; }
        public string DiscountTakenAmount { get; set; }
        public string InvoiceNote { get; set; }
    }
}
