using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.EntityUtilities;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using System;
using Insite.Core.Services;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.Plugins.Helper;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.SampleProduct
{
    [DependencyName("SampleUpdateCartHandler")]
    public sealed class SampleUpdateCartHandler : HandlerBase<UpdateCartParameter, UpdateCartResult>
    {
        private readonly ICustomerOrderUtilities customerOrderUtilities;

        public override int Order
        {
            get
            {
                return 580;
            }
        }

        public SampleUpdateCartHandler(ICustomerOrderUtilities customerOrderUtilities)
        {
            this.customerOrderUtilities = customerOrderUtilities;
        }

        public override UpdateCartResult Execute(IUnitOfWork unitOfWork, UpdateCartParameter parameter, UpdateCartResult result)
        {
            if (result.GetCartResult.IsAuthenticated)
            {
                int productCount = 0;
                int maxSampleQtyofProduct = 0;
                decimal? thisProductByCustomer = 0;

                CustomSettings customSettings = new CustomSettings();
                foreach (var orderLine in result.GetCartResult.Cart.OrderLines)
                {
                    var isSampleProduct = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                    if (isSampleProduct > 0)
                    {
                        string maxSampleQty = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "maxSampleQty").Select(x => x.Value).FirstOrDefault()?? "0";
                        maxSampleQtyofProduct = Convert.ToInt32(maxSampleQty);

                        if (maxSampleQtyofProduct > 0)
                        {
                            if (orderLine.QtyOrdered > maxSampleQtyofProduct)
                            {
                                return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.ProductShipTo_LevelValidation, maxSampleQtyofProduct, orderLine.Product.ErpNumber));
                            }
                            thisProductByCustomer = Convert.ToInt32(unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.ProductId == orderLine.ProductId)).Select(s => (decimal?)s.QtyOrdered).Sum() ?? 0);

                            if (Convert.ToInt32(thisProductByCustomer + orderLine.QtyOrdered) > maxSampleQtyofProduct)
                            {
                                return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.ProductShipTo_LevelValidation, maxSampleQtyofProduct, orderLine.Product.ErpNumber));
                            }


                        }
                        productCount = productCount + Convert.ToInt32(orderLine.QtyOrdered);


                        if (productCount > customSettings.MaxSamplePerOrder)
                        {
                            return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                        }
                        else
                        {
                            decimal? totalSamplesByCustomer = Decimal.Zero;
                            var firstSampleproductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id).OrderByDescending(t => t.CreatedOn).FirstOrDefault();

                            if (firstSampleproductByCustomer != null && DateTimeOffset.Now.Date <= firstSampleproductByCustomer.TenureEnd)
                            {
                                totalSamplesByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.CreatedOn >= firstSampleproductByCustomer.TenureStart && sp.CreatedOn <= firstSampleproductByCustomer.TenureEnd)).Select(s => (decimal?)s.QtyOrdered).Sum();
                            }

                            if (totalSamplesByCustomer != null)
                            {
                                if ((productCount + Convert.ToInt32(totalSamplesByCustomer) > customSettings.MaxSampleOrderInGivenTimeFrame))
                                {
                                    return this.CreateErrorServiceResult<UpdateCartResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_TenureLevelValidation, customSettings.MaxSampleOrderInGivenTimeFrame, customSettings.MaxTimeToLimitUserForSampleOrder, totalSamplesByCustomer));
                                }
                            }
                        }
                    }
                }
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}




