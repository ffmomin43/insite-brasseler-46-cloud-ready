using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.WebApi.V1.Dtos
{
   public class GetOutstandingOrderDto
    {

        public GetOutstandingOrderDto()
        {
                
        }
        public string GetOrderInfo { get; set; }
        public string CompanyNumber { get; set; }
        public string CustomerNumber { get; set; }
        public string LookupType { get; set; }
        public string Source { get; set; }
        public DateTime? FromEntryDate { get; set; }
        public DateTime? ToEntryDate { get; set; }
        public string OrderNumber { get; set; }
        public string OrderGenerationNumber { get; set; }
        public string InvoiceNumber { get; set; }
        public string CustomerPurchaseOrderNumber { get; set; }
        public string ParentOrderNumber { get; set; }
        public string GuestFlag { get; set; }
        public string EmailAddress { get; set; }
        public string HistorySequenceNumber { get; set; }
        public string EntryDateCentury { get; set; }
        public DateTime? EntryDate { get; set; }
        public string IncludeHistory { get; set; }
        public string CreditCardKeySeq { get; set; }
    }
}
