using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("ReturnRequest")]
    public class ReturnRequest : EntityBase
    {
        public string WebOrderNumber { get; set; }
        public string ErpOrderNumber { get; set; }
        public string ProductNumber { get; set; }
        public decimal QtyToReturn { get; set; }
        public string ReturnReason { get; set; }
        public string RmaNotes { get; set; }
        public DateTime ReturnDate { get; set; }
    }
}
