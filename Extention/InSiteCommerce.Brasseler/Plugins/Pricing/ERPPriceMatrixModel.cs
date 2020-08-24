using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Pricing
{
    public class ERPPriceMatrixModel
    {
        public string CompanyNo { get; set; }
        public string PriceDiscountCode { get; set; }
        public string Discount { get; set; }
        public string MarkupCode { get; set; }
        public string CustomerPriceList { get; set; }
    }
}
