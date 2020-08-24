using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Catalog.Services;
using Insite.Catalog.Services.Dtos;
using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
using Insite.Common.Logging;
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
using System.Collections.Generic;
using System.Linq;

namespace InSiteCommerce.Brasseler.Services.Handlers.SampleProduct
{
    /*BUSA-1170 Validating sample products in order from WishList,
        Order History(Reorder All) and QuickOrder */
    [DependencyName("SampleAddCartLine")]
    public class SampleAddCartLine : HandlerBase<AddCartLineCollectionParameter, AddCartLineCollectionResult>
    {
        private readonly IProductService productService;
        bool canAddToCart;

        public SampleAddCartLine(IProductService productService)
        {
            this.productService = productService;
        }

        public override int Order
        {
            get
            {
                return 750;
            }
        }


        public override AddCartLineCollectionResult Execute(
          IUnitOfWork unitOfWork,
          AddCartLineCollectionParameter parameter,
          AddCartLineCollectionResult result)
        {
            //Sample Product
            CustomSettings customSettings = new CustomSettings();
            int productCount = 0;
            int QuantityOrdered = 0;
            int isSampleCheck = 0;
            if (result.GetCartResult.IsAuthenticated)
            {
                foreach (ProductDto productDto in result.GetProductCollectionResult.ProductDtos)
                {
                    productCount = 0;
                    QuantityOrdered = 0;
                    isSampleCheck = 0;
                    int maxSampleQtyofProduct = 0;
                    decimal? thisProductByCustomer = 0;
                    decimal? thisPrdctincartByCustomer = 0;
                    ProductDto ProductDto = productDto;
                    if (productDto != null)
                    {
                        canAddToCart = !productDto.CanAddToCart;
                    }
                    else
                    {
                        canAddToCart = true;
                    }

                    var isSampleProduct = productDto.Properties.Where(x => x.Key == "isSampleProduct" && x.Value.EqualsIgnoreCase(bool.TrueString)).Count();

                    if (isSampleProduct > 0)
                    {
                        #region/* checks validation on collection of products being added from pages*/
                        foreach (var cartLineParam in parameter.AddCartLineParameterCollection)
                        {
                            string maxSampleQty = result.GetProductCollectionResult.ProductDtos.Where(pdto => pdto.Id == cartLineParam.CartLineDto.ProductId).FirstOrDefault()?.Properties.Where(x => x.Key == "maxSampleQty").Select(v => v.Value).FirstOrDefault() ?? "0";
                            maxSampleQtyofProduct = Convert.ToInt32(maxSampleQty);
                            if (maxSampleQtyofProduct > 0)
                            {
                                if (cartLineParam.CartLineDto.QtyOrdered > maxSampleQtyofProduct)
                                {
                                    return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                                }

                                thisProductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.ProductId == cartLineParam.CartLineDto.ProductId)).Select(s => (decimal?)s.QtyOrdered).Sum() ?? 0;

                                if (Convert.ToInt32(thisProductByCustomer + cartLineParam.CartLineDto.QtyOrdered) > maxSampleQtyofProduct)
                                {
                                    return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                                }

                            }
                            var check = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == cartLineParam.CartLineDto.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                            if (check > 0)
                            {
                                QuantityOrdered = QuantityOrdered + Convert.ToInt32(cartLineParam.CartLineDto.QtyOrdered);
                            }
                        }
                        #endregion
                        if (QuantityOrdered > customSettings.MaxSamplePerOrder)
                        {
                            return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                        }
                        else
                        {
                            #region /* checks validation by iterating over the products in cart*/
                            foreach (var orderLine in result.GetCartResult.Cart.OrderLines)
                            {
                                string maxSampleQty = result.GetProductCollectionResult.ProductDtos.Where(pdto => pdto.Id == orderLine.ProductId).FirstOrDefault()?.Properties.Where(x => x.Key == "maxSampleQty").Select(v => v.Value).FirstOrDefault() ?? "0";
                                maxSampleQtyofProduct = Convert.ToInt32(maxSampleQty);

                                if (maxSampleQtyofProduct > 0)
                                {
                                    thisPrdctincartByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.ProductId == orderLine.ProductId)).Select(s => (decimal?)s.QtyOrdered).Sum() ?? 0;

                                    var thisPrdctincart = Convert.ToInt32(orderLine.QtyOrdered + parameter.AddCartLineParameterCollection.Where(adcl => adcl.CartLineDto.ProductId == orderLine.ProductId).FirstOrDefault().CartLineDto.QtyOrdered) + thisPrdctincartByCustomer;

                                    if (thisPrdctincart > maxSampleQtyofProduct)
                                    {
                                        return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));

                                    }
                                }

                                isSampleCheck = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                                if (isSampleCheck > 0)
                                {
                                    productCount = productCount + Convert.ToInt32(orderLine.QtyOrdered);
                                }
                            }
                            productCount = productCount + QuantityOrdered;
                            #endregion
                        }
                        break;
                    }
                }

                if (productCount > customSettings.MaxSamplePerOrder)
                {
                    return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                }

                if (productCount > 0)
                {
                    decimal? totalSamplesByCustomer = Decimal.Zero;
                    var firstSampleproductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id).OrderByDescending(t => t.CreatedOn).FirstOrDefault();

                    if (firstSampleproductByCustomer != null && DateTimeOffset.Now.Date <= firstSampleproductByCustomer.TenureEnd)
                    {
                        totalSamplesByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.CreatedOn >= firstSampleproductByCustomer.TenureStart && sp.CreatedOn <= firstSampleproductByCustomer.TenureEnd)).Select(s => (decimal?)s.QtyOrdered).Sum();
                    }

                    if ((productCount + Convert.ToInt32(totalSamplesByCustomer) > customSettings.MaxSampleOrderInGivenTimeFrame))
                    {
                        return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_TenureLevelValidation, customSettings.MaxSampleOrderInGivenTimeFrame, customSettings.MaxTimeToLimitUserForSampleOrder, totalSamplesByCustomer));
                    }

                }

                if (canAddToCart)
                {
                    return this.CreateErrorServiceResult<AddCartLineCollectionResult>(result, SubCode.CartServiceProductCantBeAddedToCart, MessageProvider.Current.Cart_ProductCantBeAddedToCart);
                }
            }

            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
