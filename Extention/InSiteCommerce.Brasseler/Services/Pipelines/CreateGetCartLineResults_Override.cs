using Insite.Cart.Services.Parameters;
using Insite.Cart.Services.Pipelines;
using Insite.Cart.Services.Pipelines.Parameters;
using Insite.Cart.Services.Pipelines.Results;
using Insite.Cart.Services.Results;
using Insite.Catalog.Services.Dtos;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Data.Entities;
using InSiteCommerce.Brasseler.CustomAPI.Data.Entities;
using InSiteCommerce.Brasseler.SystemSetting.Groups;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Insite.Cart.Services.Handlers.GetCartLineCollectionHandler
{
    [DependencyName("CreateGetCartLineResults")]
    public sealed class CreateGetCartLineResults_Override : HandlerBase<GetCartLineCollectionParameter, GetCartLineCollectionResult>
    {
        private readonly ICartPipeline cartPipeline;

        public CreateGetCartLineResults_Override(ICartPipeline cartPipeline)
        {
            this.cartPipeline = cartPipeline;
        }

        public override int Order
        {
            get
            {
                return 1100;
            }
        }

        public override GetCartLineCollectionResult Execute(
          IUnitOfWork unitOfWork,
          GetCartLineCollectionParameter parameter,
          GetCartLineCollectionResult result)
        {
            foreach (OrderLine cartLine1 in (IEnumerable<OrderLine>)result.CartLines)
            {
                OrderLine cartLine = cartLine1;
                ProductDto productDto = result.GetProductCollectionResult.ProductDtos.First<ProductDto>((Func<ProductDto, bool>)(p =>
                {
                    Guid? orderLineId = p.OrderLineId;
                    Guid id = cartLine.Id;
                    if (!orderLineId.HasValue)
                        return false;
                    if (!orderLineId.HasValue)
                        return true;
                    return orderLineId.GetValueOrDefault() == id;
                }));
                CreateGetCartLineResultResult getCartLineResult = this.cartPipeline.CreateGetCartLineResult(new CreateGetCartLineResultParameter()
                {
                    GetCartResult = result.GetCartResult,
                    CartLine = cartLine,
                    ProductDto = productDto
                });

                var isSampleProduct = productDto.Properties.Where(x => x.Key == "isSampleProduct" && x.Value.ToUpper() == "TRUE").Count();
                if (isSampleProduct > 0)
                {
                    if (!getCartLineResult.GetCartLineResult.Properties.ContainsKey("isSampleCartLine"))
                        getCartLineResult.GetCartLineResult.Properties.Add("isSampleCartLine", "true");
                }
                if (getCartLineResult.ResultCode != ResultCode.Success)
                    return this.CreateErrorServiceResult<GetCartLineCollectionResult>(result, getCartLineResult.SubCode, getCartLineResult.Message);
                result.GetCartLineResults.Add(getCartLineResult.GetCartLineResult);
            }
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }
    }
}
