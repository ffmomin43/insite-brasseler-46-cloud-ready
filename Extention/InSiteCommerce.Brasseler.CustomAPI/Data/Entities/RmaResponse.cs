using Insite.Data.Entities;
using Insite.Data.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Data.Entities
{
    [Table("RmaResponse")]
    public class RmaResponse : EntityBase
    {
        public string WebOrderNumber { get; set; }
        public string ErpOrderNumber { get; set; }
        public string TrackingNumber { get; set; }
        public string GraphicImage { get; set; }
        public string HtmlImage { get; set; }
        public string JsonValue { get; set; }
    }
}
