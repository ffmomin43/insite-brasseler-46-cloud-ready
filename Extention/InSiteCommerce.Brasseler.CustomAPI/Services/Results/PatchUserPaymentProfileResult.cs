using Insite.Core.Services;
using Insite.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Results
{
    public class PatchUserPaymentProfileResult : ResultBase
    {
        public UserPaymentProfile UserPaymentProfile { get; set; }
    }
}
