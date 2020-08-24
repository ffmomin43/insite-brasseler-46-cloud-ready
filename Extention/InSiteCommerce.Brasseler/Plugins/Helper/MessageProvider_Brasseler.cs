using Insite.Core.Providers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InSiteCommerce.Brasseler.Plugins.Helper
{
  public  class MessageProvider_Brasseler : MessageProvider
    {
        public static MessageProvider_Brasseler CurrentBrasseler
        {
            get;
            private set;
        }

        static MessageProvider_Brasseler()
        {
            MessageProvider_Brasseler.CurrentBrasseler = new MessageProvider_Brasseler();
        }


        public string Sample_OrderLevelValidation
        {
            get
            {
                return this.GetMessage("Sample_OrderLevelValidation", "A maximum of {0} product samples are allowed per order", "");
            }
        }

        public string Sample_TenureLevelValidation
        {
            get
            {
                return this.GetMessage("Sample_TenureLevelValidation", "A maximum of {0} product samples may be ordered in {1}. You have already ordered {2} within this period.", "");
            }
        }

        public string Product_LevelValidation
        {
            get
            {
                return this.GetMessage("Product_LevelValidation", "You can only order {0} products of  {1}.", "");
            }
        }

        public string ProductShipTo_LevelValidation
        {
            get
            {
                return this.GetMessage("ProductShipTo_LevelValidation", "You can only order {0} products of  {1}.Please change the quantity ", "");
            }
        }
    }
}
