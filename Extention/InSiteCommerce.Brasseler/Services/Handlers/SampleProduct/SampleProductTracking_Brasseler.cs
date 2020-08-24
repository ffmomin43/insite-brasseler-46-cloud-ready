//BUSA-1170 Inserts records in table when sampleOrder is placed 
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    [DependencyName("SampleProductTracking_Brasseler")]
    public class SampleProductTracking_Brasseler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        public override int Order => 3410;

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            CustomSettings customSettings = new CustomSettings();
            if (!parameter.Status.EqualsIgnoreCase("Submitted"))
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            if (parameter.Properties.ContainsKey("isSampleOrder"))
            {
                var firstSampleByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id).OrderByDescending(t => t.CreatedOn).FirstOrDefault();

                foreach (OrderLine orderLine in result.GetCartResult.Cart.OrderLines)
                {
                    int isSampleProduct = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                    if (isSampleProduct > 0)
                    {
                        SampleProductTracking sampleProductTracking = new SampleProductTracking();
                        sampleProductTracking.CustomerId = result.GetCartResult.GetShipToResult.ShipTo.Id;
                        sampleProductTracking.ParentCustomerId = result.GetCartResult.GetShipToResult.ShipTo.ParentId;
                        sampleProductTracking.CustomerOrderId = result.GetCartResult.Cart.Id;
                        sampleProductTracking.PlacedbyUserId = result.GetCartResult.Cart.PlacedByUserProfileId;
                        sampleProductTracking.OrderNumber = result.GetCartResult.Cart.OrderNumber;
                        sampleProductTracking.ProductId = orderLine.ProductId;
                        sampleProductTracking.ProductNumber = orderLine.Product.ErpNumber;
                        sampleProductTracking.QtyOrdered = orderLine.QtyOrdered;
                        if (firstSampleByCustomer != null && firstSampleByCustomer.TenureEnd >= DateTimeOffset.Now)
                        {
                            sampleProductTracking.TenureStart = firstSampleByCustomer.TenureStart;
                        }
                        else
                        {
                            sampleProductTracking.TenureStart = DateTimeOffset.Now.Date;
                        }

                        sampleProductTracking.TenureEnd = sampleProductTracking.TenureStart.AddDays(customSettings.MaxTimeToLimitUserForSampleOrder);
                        unitOfWork.GetRepository<SampleProductTracking>().Insert(sampleProductTracking);
                    }

                }

            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);

        }
    }

}

