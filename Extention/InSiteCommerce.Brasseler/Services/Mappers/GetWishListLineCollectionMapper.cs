using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Utilities;
using Insite.Core.Services;
using Insite.Core.WebApi;
using Insite.Core.WebApi.Interfaces;
using Insite.WishLists.Services.Parameters;
using Insite.WishLists.Services.Results;
using Insite.WishLists.WebApi.V1.ApiModels;
using Insite.WishLists.WebApi.V1.Mappers.Interfaces;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace Insite.WishLists.WebApi.V1.Mappers
{
    /// <summary>The get wish list line collection mapper.</summary>
    public class GetWishListLineCollectionMapper : IGetWishListLineCollectionMapper, IWebApiMapper<WishListLineCollectionParameter, GetWishListLineCollectionParameter, GetWishListLineCollectionResult, WishListLineCollectionModel>, IDependency, IExtension
    {
        /// <summary>The object to object mapper.</summary>
        protected readonly IObjectToObjectMapper ObjectToObjectMapper;
        /// <summary>The url helper.</summary>
        protected readonly IUrlHelper UrlHelper;
        protected readonly IGetWishListLineMapper GetWishListLineMapper;

        public GetWishListLineCollectionMapper(
          IUrlHelper urlHelper,
          IObjectToObjectMapper objectToObjectMapper,
          IGetWishListLineMapper wishListLineMapper)
        {
            this.UrlHelper = urlHelper;
            this.ObjectToObjectMapper = objectToObjectMapper;
            this.GetWishListLineMapper = wishListLineMapper;
        }

        public GetWishListLineCollectionParameter MapParameter(
          WishListLineCollectionParameter parameter,
          HttpRequestMessage request)
        {
            GetWishListLineCollectionParameter collectionParameter = new GetWishListLineCollectionParameter();
            collectionParameter.WishListId = parameter.WishListId;
            collectionParameter.Page = parameter.Page;
            collectionParameter.PageSize = parameter.PageSize;
            collectionParameter.DefaultPageSize = parameter.DefaultPageSize;
            collectionParameter.Sort = parameter.Sort ?? "SortOrder";
            collectionParameter.Query = parameter.Query;
            return collectionParameter;
        }

        public WishListLineCollectionModel MapResult(
          GetWishListLineCollectionResult serviceResult,
          HttpRequestMessage request)
        {
            Collection<WishListLineModel> collection = new Collection<WishListLineModel>();
            foreach (GetWishListLineResult serviceResult1 in serviceResult.GetWishListLineResults.Where(o => o.ProductDto != null))
                collection.Add(this.GetWishListLineMapper.MapResult(serviceResult1, request));
            PaginationModel paginationModel = new PaginationModel((PagingResultBase)serviceResult)
            {
                SortOptions = new List<SortOptionModel>()
        {
          new SortOptionModel()
          {
            DisplayName = "Custom Sort",
            SortType = "SortOrder"
          },
          new SortOptionModel()
          {
            DisplayName = "Date Added",
            SortType = "CreatedOn DESC"
          },
          new SortOptionModel()
          {
            DisplayName = "Product: A-Z",
            SortType = "Product.ShortDescription"
          },
          new SortOptionModel()
          {
            DisplayName = "Product: Z-A",
            SortType = "Product.ShortDescription DESC"
          }
        },
                SortType = serviceResult.Sort
            };
            paginationModel.PrevPageUri = paginationModel.Page > 1 ? this.GetLink(paginationModel.Page - 1, paginationModel.PageSize, request) : (string)null;
            paginationModel.NextPageUri = paginationModel.Page < paginationModel.NumberOfPages ? GetLink(paginationModel.Page + 1, paginationModel.PageSize, request) : null;
            WishListLineCollectionModel lineCollectionModel = new WishListLineCollectionModel();
            lineCollectionModel.Uri = request != null ? this.GetLink(paginationModel.Page, paginationModel.PageSize, request) : string.Empty; //BUSA-1073 Added null check when request is null.
            lineCollectionModel.WishListLines = collection;
            lineCollectionModel.Pagination = paginationModel;
            return lineCollectionModel;
        }

        private string GetLink(int page, int pageSize, HttpRequestMessage request)
        {
            UriBuilder uriBuilder = new UriBuilder(request.RequestUri);
            NameValueCollection queryString = HttpUtility.ParseQueryString(uriBuilder.Query.ToLower());
            if (page != 1 || ((IEnumerable<string>)queryString.AllKeys).Contains<string>(nameof(page)))
                queryString[nameof(page)] = page.ToString();
            if (((IEnumerable<string>)queryString.AllKeys).Contains<string>("pagesize"))
                queryString["pagesize"] = pageSize.ToString();
            uriBuilder.Query = queryString.ToString().TrimStart('?');
            return uriBuilder.Uri.ToString().ToLower();
        }
    }
}
