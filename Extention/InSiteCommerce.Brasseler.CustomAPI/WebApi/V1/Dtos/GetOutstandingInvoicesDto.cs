using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Dtos
{
    public class GetOutstandingInvoicesDto
    {
        public GetOutstandingInvoicesDto()
        {
            
    }
        public string CompanyNumber { get; set; }
        public string CustomerNumber { get; set; }
        public string InvoiceNumberInq { get; set; }
        public string ToInvoiceNumber { get; set; }
        public string MaxInvoices { get; set; }
        public string InvoiceType { get; set; }
        public string Flag { get; set; }
        public DateTime? FromInvDate { get; set; }
        public DateTime? ToInvDate { get; set; }
        public DateTime? FromAgeDate { get; set; }
        public DateTime? ToAgeDate { get; set; }
        public string FromInvAmount { get; set; }
        public string ToInvAmount { get; set; }

    }
}
