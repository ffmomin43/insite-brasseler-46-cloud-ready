using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Results;
using Insite.Catalog.Services;
using Insite.Catalog.Services.Dtos;
using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
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

namespace Insite.Cart.Services.Handlers.AddCartLineHandler
{
    /*BUSA-1170 Overridden handler to handle validation of sample product 
            from AddTocart button on PDP,PLP and OrderHistory(Reorder)*/
    [DependencyName("GetProduct")]
    public sealed class GetProduct_Override : HandlerBase<AddCartLineParameter, AddCartLineResult>
    {
        private readonly Lazy<IProductService> productService;

        public override int Order
        {
            get
            {
                return 600;
            }
        }

        public GetProduct_Override(Lazy<IProductService> productService)
        {
            this.productService = productService;
        }

        public override AddCartLineResult Execute(IUnitOfWork unitOfWork, AddCartLineParameter parameter, AddCartLineResult result)
        {
            bool canAddToCart;
            CustomSettings customSettings = new CustomSettings();
            if (parameter.ProductDto != null)
            {
                result.ProductDto = parameter.ProductDto;
            }
            else if (parameter.CartLineDto.ProductId.HasValue)
            {
                GetProductAvailabilityParameter getProductAvailabilityParameter = new GetProductAvailabilityParameter();
                Guid? productId = parameter.CartLineDto.ProductId;
                getProductAvailabilityParameter.ProductId = productId.Value;
                getProductAvailabilityParameter.Configuration = parameter.CartLineDto.SectionOptionIds.ToList<Guid>();
                GetProductAvailabilityParameter getProductAvailabilityParameter1 = getProductAvailabilityParameter;
                IProductService value = this.productService.Value;
                GetProductCollectionParameter getProductCollectionParameter = new GetProductCollectionParameter()
                {
                    IgnoreIsConfigured = true
                };
                List<Guid> guids = new List<Guid>();
                productId = parameter.CartLineDto.ProductId;
                guids.Add(productId.Value);
                getProductCollectionParameter.ProductIds = guids;
                getProductCollectionParameter.GetProductAvailabilityParameters = new List<GetProductAvailabilityParameter>()
                {
                    getProductAvailabilityParameter1
                };
                GetProductCollectionResult productCollection = value.GetProductCollection(getProductCollectionParameter);
                if (productCollection.ResultCode != ResultCode.Success)
                {
                    return this.CreateErrorServiceResult<AddCartLineResult>(result, productCollection.SubCode, productCollection.Message);
                }
                result.ProductDto = productCollection.ProductDtos.First<ProductDto>();
            }

            //Sample Product
            ProductDto productDto = result.ProductDto;
            if (productDto != null)
            {
                canAddToCart = !productDto.CanAddToCart;
            }
            else
            {
                canAddToCart = true;
            }
            int productCount = 0;
            int isSampleCheck = 0;
            int maxSampleQtyofProduct = 0;
            decimal? thisProductByCustomer = 0;
            var isSampleProduct = productDto.Properties.Where(x => x.Key == "isSampleProduct" && x.Value.EqualsIgnoreCase(bool.TrueString)).Count();
            if (result.GetCartResult.IsAuthenticated)
            {
                if (isSampleProduct > 0)
                {
                    string maxSampleQty;
                    productDto.Properties.TryGetValue("maxSampleQty", out maxSampleQty);
                    maxSampleQtyofProduct = Convert.ToInt32(maxSampleQty);

                    if (maxSampleQtyofProduct > 0)
                    {
                        if (parameter.CartLineDto.QtyOrdered > maxSampleQtyofProduct)
                        {
                            return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                        }

                        thisProductByCustomer = unitOfWork.GetRepository<SampleProductTracking>().GetTable().Where(sp => sp.CustomerId == result.GetCartResult.GetShipToResult.ShipTo.Id && (sp.ProductId == parameter.CartLineDto.ProductId)).Select(s => (decimal?)s.QtyOrdered).Sum() ?? 0;

                        if (Convert.ToInt32(thisProductByCustomer + parameter.CartLineDto.QtyOrdered) > maxSampleQtyofProduct)
                        {
                            return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                        }

                    }

                

                if (parameter.CartLineDto.QtyOrdered > customSettings.MaxSamplePerOrder)
                {
                    return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                }
                else
                {
                    int thisProductcount = 0;
                    foreach (var orderLine in result.GetCartResult.Cart.OrderLines)
                    {

                        if (parameter.CartLineDto.ProductId == orderLine.ProductId && (thisProductcount == 0))
                        {
                            thisProductcount++;
                                if (maxSampleQtyofProduct > 0)
                                {
                                    if (Convert.ToInt32(orderLine.QtyOrdered + parameter.CartLineDto.QtyOrdered + thisProductByCustomer) > maxSampleQtyofProduct)
                                    {
                                        return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Product_LevelValidation, maxSampleQtyofProduct, productDto.ERPNumber));
                                    }
                                }
                        }

                        isSampleCheck = unitOfWork.GetRepository<CustomProperty>().GetTable().Where(x => x.ParentId == orderLine.ProductId && x.Name == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                        if (isSampleCheck > 0)
                        {
                            productCount = productCount + Convert.ToInt32(orderLine.QtyOrdered);
                        }
                    }
                    productCount = Convert.ToInt32(productCount + parameter.CartLineDto.QtyOrdered);
                }

            }
                if (productCount > customSettings.MaxSamplePerOrder)
                {

                    return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_OrderLevelValidation, customSettings.MaxSamplePerOrder.ToString()));
                }

                if (productCount > 0)
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
                            return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, string.Format(MessageProvider_Brasseler.CurrentBrasseler.Sample_TenureLevelValidation, customSettings.MaxSampleOrderInGivenTimeFrame, customSettings.MaxTimeToLimitUserForSampleOrder, totalSamplesByCustomer));
                        }
                    }

                }
            }

            //Sample Product

            if (canAddToCart)
            {
                return this.CreateErrorServiceResult<AddCartLineResult>(result, SubCode.CartServiceProductCantBeAddedToCart, MessageProvider.Current.Cart_ProductCantBeAddedToCart);
            }
            return base.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}