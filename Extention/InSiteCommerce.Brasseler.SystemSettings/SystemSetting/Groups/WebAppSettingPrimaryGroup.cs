using Insite.Core.Interfaces.Dependency;
using Insite.Core.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.SystemSetting.Groups
{
    [DependencyName("CustomWebAppSetting")]
    public class CustomWebAppSettingPrimaryGroup : BasePrimaryGroup
    {
        public override string Name
        {
            get
            {
                return "CustomWebAppSetting";
            }
        }

        public override string Label
        {
            get
            {
                return "Custom WebApp Setting";
            }
        }

        public override string ShortDescription
        {
            get
            {
                return "Add or edit custom website or application settings.";
            }
        }

        public override string Description
        {
            get
            {
                return string.Empty;
            }
        }
    }
}
