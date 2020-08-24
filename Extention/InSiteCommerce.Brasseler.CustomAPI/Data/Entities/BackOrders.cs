using Insite.Data.Entities;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("BackOrders")]
    public class BackOrders :EntityBase
    {
        public string WebOrderNumber { get; set; }

        public string CustomerNumber { get; set; }

        public int CheckedForBO { get; set; }

        public Guid OrderLanguage { get; set; }
        
    }
}
