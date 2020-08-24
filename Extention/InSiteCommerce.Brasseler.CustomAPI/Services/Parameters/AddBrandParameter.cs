using Insite.Core.Services;
using System;

namespace InSiteCommerce.Brasseler.CustomAPI.Services.Parameters
{
    public class AddBrandParameter : ParameterBase
    {
        public virtual string Name { get; set; }
        public virtual string Description { get; set; }
        public virtual string Website { get; set; }
        public virtual string ImagePath { get; set; }
    }
}
