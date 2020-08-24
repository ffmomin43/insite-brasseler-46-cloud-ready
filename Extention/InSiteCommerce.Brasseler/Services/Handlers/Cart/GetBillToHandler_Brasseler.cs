using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services.Parameters;
using Insite.Customers.Services.Results;
using Insite.Data.Repositories.Interfaces;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    /*
    * Populate new user specific properties
    */
    [DependencyName("GetBillToHandler_Brasseler")]
    public class GetBillToHandler_Brasseler : HandlerBase<GetBillToParameter, GetBillToResult>
    {
        public override int Order
        {
            get
            {
                return 700;
            }
        }

        public override GetBillToResult Execute(IUnitOfWork unitOfWork, GetBillToParameter parameter, GetBillToResult result)
        {
            if (result.GetShipToResults != null && result.GetShipToResults.Count > 0)
            {
                CustomSettings customSettings = new CustomSettings();
                //foreach (var shipto in result.GetShipToResults)
                //{
                //    var newAddressProperty = shipto.ShipTo.CustomProperties.Where(c => c.Name.EqualsIgnoreCase("IsNewShipToAddress")).FirstOrDefault();
                //    if (newAddressProperty != null && newAddressProperty.Value.EqualsIgnoreCase("true")) { 
                //        result.Properties.Add("NewAddress" + shipto.ShipTo.Id.ToString(), "true");
                //    }

                   
                //}
                if (result.BillTo.ErpNumber == "1055357") { 
                    //code for uploading the customer type start BUSA-337
                    var customerTypeProperty = customSettings.CustomerType;
                    if (customerTypeProperty != null)
                    {
                        result.Properties.Add("customerType", customerTypeProperty);
                    }
                    //code for uploading the customer type end BUSA-337

                    //change for mapNewUserInfoToCart start
                    var newWebShopperPostalCodeProperty = customSettings.NewWebShopperPostalCode;
                    if (newWebShopperPostalCodeProperty != null)
                    {
                        result.Properties.Add("newWebShopperPostalCode", newWebShopperPostalCodeProperty);
                    }

                    var newWebShopperAddressProperty = customSettings.NewWebShopperAddress;
                    if (newWebShopperAddressProperty != null)
                    {
                        result.Properties.Add("newWebShopperAddress", newWebShopperAddressProperty);
                    }
                }

            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
