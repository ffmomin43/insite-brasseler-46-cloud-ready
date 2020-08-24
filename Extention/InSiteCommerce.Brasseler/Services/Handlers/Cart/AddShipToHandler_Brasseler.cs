using Insite.Core.Context;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Customers.Services.Parameters;
using Insite.Customers.Services.Results;
using Insite.Data.Entities;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("AddShipToHandler_Brasseler")]
    public class AddShipToHandler_Brasseler : HandlerBase<AddShipToParameter, AddShipToResult>
    {
        public override int Order
        {
            get
            {
                return 1100;
            }
        }

        public override AddShipToResult Execute(IUnitOfWork unitOfWork, AddShipToParameter parameter, AddShipToResult result)
        {
            if (result.ShipTo != null)
            {
                var customer = unitOfWork.GetRepository<Customer>().Get(result.ShipTo.Id);

                // BUSA-472, 548, 508 : Duplicate Customers on Production Starts
                var siteContextShipTo = SiteContext.Current.ShipTo;

                if (SiteContext.Current.ShipTo != null)
                {
                    foreach (var shipTo in siteContextShipTo.CustomProperties)
                    {
                        customer.SetProperty(shipTo.Name, shipTo.Value);
                    }

                    customer.CustomerType = siteContextShipTo.CustomerType;
                    customer.Territory = siteContextShipTo.Territory;
                    customer.PrimarySalespersonId = siteContextShipTo.PrimarySalespersonId;
                    customer.IsSoldTo = siteContextShipTo.IsSoldTo;
                    customer.ErpSequence = siteContextShipTo.ErpSequence;
                    customer.Fax = siteContextShipTo.Fax;
                    customer.ErpNumber = siteContextShipTo.ErpNumber;
                    customer.SetProperty("prevShipToId", siteContextShipTo.Id.ToString());
                }
                // BUSA-472, 548, 508 : Duplicate Customers on Production Ends

                customer.SetProperty("IsNewShipToAddress", "true");
                unitOfWork.Save();
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

    }
}
