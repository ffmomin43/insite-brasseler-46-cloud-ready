using Insite.Cart.Services;
using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Catalog.Services.Dtos;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.Plugins.Helper;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.Cart
{
    /*BUSA-1170 Validating sample products in order on cart page */
    [DependencyName("UpdateSampleProduct")]
    public class UpdateSampleProduct : HandlerBase<UpdateCartLineParameter, UpdateCartLineResult>
    {
        private readonly ICartService cartService;

        public UpdateSampleProduct(ICartService cartService)
        {
            this.cartService = cartService;
        }

        public override int Order
        {
            get
            {
                return 550;
            }
        }

        public override UpdateCartLineResult Execute(
          IUnitOfWork unitOfWork,
          UpdateCartLineParameter parameter,
          UpdateCartLineResult result)
        {
            ProductDto productDto = result.GetCartLineResult.ProductDto;
            CustomSettings customSettings = new CustomSettings();
            int productCount = 0;
            int maxSampleQtyofProduct = 0;
            decimal? thisProductByCustomer = 0;
            string maxSampleQty;

            // BUSA-1319: Limit Qty Per Product on Cart Page
            var maxProductQty = productDto?.Properties.Where(x => x.Key == "maxProductQty").Select(v => v.Value).FirstOrDefault() ?? "0";

            if (!string.IsNullOrEmpty(maxProductQty) && Convert.ToInt32(maxProductQty) != 0 && parameter.CartLineDto.QtyOrdered > Convert.ToDecimal(maxProductQty))
            {
                parameter.CartLineDto.QtyOrdered = Convert.ToDecimal(maxProductQty);
                if (result.Properties.ContainsKey("isQtyAdjusted"))
                {
                    result.Properties["isQtyAdjusted"] = bool.TrueString;
                }
                else
                {
                    result.Properties.Add("isQtyAdjusted", bool.TrueString);
                }
            }
            // BUSA- 1319: END

            var isSampleProduct = productDto.Properties.Where(x => x.Key == "isSampleProduct" && x.Value.EqualsIgnoreCase(bool.TrueString)).Count();
            if (result.GetCartLineResult.GetCartResult.IsAuthenticated)
            {
                if (isSampleProduct > 0)
                {
                    productDto.Properties.TryGetValue("maxSampleQty", out maxSampleQty);
                    maxSampleQtyofProduct = Convert.ToInt32(maxSampleQty);
                    if (maxSampleQtyofProduct > 0)
                    {
                        if (parameter.CartLineDto.QtyOrdered > maxSampleQtyofProduct)
                        {
                            return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                        }

                        thisProductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartLineResult.GetCartResult.GetShipToResult.ShipTo.Id && (sp.ProductId == parameter.CartLineDto.ProductId)).Select(s => (decimal?)s.QtyOrdered).Sum() ?? 0;

                        if (Convert.ToInt32(thisProductByCustomer + parameter.CartLineDto.QtyOrdered) > maxSampleQtyofProduct)
                        {
                            return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                        }
                    }
                    if (parameter.CartLineDto.QtyOrdered > customSettings.MaxSamplePerOrder)
                    {
                        return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                    }
                    else
                    {
                        foreach (var orderLine in result.GetCartLineResult.GetCartResult.Cart.OrderLines)
                        {
                            int IsSampleCheck = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                            if (IsSampleCheck > 0 && (orderLine.ProductId == productDto.Id))
                            {
                                productCount = productCount + Convert.ToInt32(parameter.CartLineDto.QtyOrdered);
                            }
                            else if (IsSampleCheck > 0)
                            {
                                productCount = productCount + Convert.ToInt32(orderLine.QtyOrdered);
                            }
                        }
                    }


                    if (productCount > customSettings.MaxSamplePerOrder)
                    {
                        return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart,
                            string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                    }

                    if (productCount > 0)
                    {
                        decimal? totalSamplesByCustomer = Decimal.Zero;
                        var firstSampleproductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartLineResult.GetCartResult.GetShipToResult.ShipTo.Id).OrderByDescending(t => t.CreatedOn).FirstOrDefault();

                        if (firstSampleproductByCustomer != null && DateTimeOffset.Now.Date <= firstSampleproductByCustomer.TenureEnd)
                        {
                            totalSamplesByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartLineResult.GetCartResult.GetShipToResult.ShipTo.Id && (sp.CreatedOn >= firstSampleproductByCustomer.TenureStart && sp.CreatedOn <= firstSampleproductByCustomer.TenureEnd)).Select(s => (decimal?)s.QtyOrdered).Sum();
                        }

                        if ((productCount + Convert.ToInt32(totalSamplesByCustomer) > customSettings.MaxSampleOrderInGivenTimeFrame))
                        {
                            return this.CreateErrorServiceResult<UpdateCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_TenureLevelValidation, customSettings.MaxSampleOrderInGivenTimeFrame, (customSettings.MaxTimeToLimitUserForSampleOrder / 30), totalSamplesByCustomer));
                        }

                    }
                }
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
