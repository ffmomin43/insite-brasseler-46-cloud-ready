using Insite.Catalog.Services.Parameters;
using Insite.Catalog.Services.Results;
using Insite.Catalog.SystemSettings;
using Insite.Core.Interfaces.Data;
using Insite.Core.Interfaces.Dependency;
using Insite.Core.Plugins.Catalog;
using Insite.Core.Plugins.Search;
using Insite.Core.Plugins.Search.Dtos;
using Insite.Core.Providers;
using Insite.Core.Services;
using Insite.Core.Services.Handlers;
using Insite.Core.SystemSetting.Groups.Catalog;
using Insite.Data.Entities;
using Insite.Data.Repositories.Interfaces;
using System;
using System.Linq;

/*To display UNSPSC tag for product search(added from line 79-86)*/
namespace Insite.Catalog.Services.Handlers.GetAutocompleteHandler
{
    [DependencyName("GetAutocompleteProductResults")]
    public class GetAutocompleteProductResults_Brasseler : HandlerBase<GetAutocompleteParameter, GetAutocompleteResult>
    {
        private readonly AutocompleteSettings autocompleteSettings;
        private readonly CatalogGeneralSettings catalogGeneralSettings;
        private readonly ICatalogPathBuilder catalogPathBuilder;
        private readonly IProductSearchProvider productSearchProvider;
        private readonly IProductService productService;

        public GetAutocompleteProductResults_Brasseler(AutocompleteSettings autocompleteSettings, CatalogGeneralSettings catalogGeneralSettings, ICatalogPathBuilder catalogPathBuilder, IProductSearchProvider productSearchProvider, IProductService productService)
        {
            this.autocompleteSettings = autocompleteSettings;
            this.catalogGeneralSettings = catalogGeneralSettings;
            this.catalogPathBuilder = catalogPathBuilder;
            this.productSearchProvider = productSearchProvider;
            this.productService = productService;
        }

        public override int Order
        {
            get
            {
                return 500;
            }
        }

        private int MinimumAutocompleteResults { get; set; } = 1;

        private int MaximumAutocompleteResults { get; set; } = 10;

        public override GetAutocompleteResult Execute(IUnitOfWork unitOfWork, GetAutocompleteParameter parameter, GetAutocompleteResult result)
        {
            if (!this.autocompleteSettings.ProductEnabled || !parameter.ProductEnabled || parameter.Query.IsBlank())
                return this.NextHandler.Execute(unitOfWork, parameter, result);
            GetProductSettingsResult settings = this.productService.GetSettings(new GetSettingsParameter());
            if (settings.ResultCode != ResultCode.Success)
                return this.CreateErrorServiceResult<GetAutocompleteResult>(result, settings.SubCode, settings.Message);
            if (!settings.CanSeeProducts)
                return this.CreateErrorServiceResult<GetAutocompleteResult>(result, SubCode.Forbidden, MessageProvider.Current.Forbidden);
            int maximumNumber = Math.Max(Math.Min(this.autocompleteSettings.ProductLimit, this.MaximumAutocompleteResults), this.MinimumAutocompleteResults);
            IProductSearchResult autocompleteSearchResults = this.productSearchProvider.GetAutocompleteSearchResults(parameter.Query, maximumNumber);
            result.Products = autocompleteSearchResults.Products.Select<ProductSearchResultDto, GetProductAutocompleteItemResult>((Func<ProductSearchResultDto, GetProductAutocompleteItemResult>)(o =>
            {
                GetProductAutocompleteItemResult autocompleteItemResult = new GetProductAutocompleteItemResult();
                autocompleteItemResult.Id = new Guid?(o.Id);
                autocompleteItemResult.Image = o.MediumImagePath ?? this.catalogGeneralSettings.NotFoundMediumImagePath;
                autocompleteItemResult.IsNameCustomerOverride = o.IsNameCustomerOverride;
                autocompleteItemResult.ManufacturerItemNumber = o.ManufacturerItemNumber;
                autocompleteItemResult.Name = o.Name;
                autocompleteItemResult.ErpNumber = o.ERPNumber;
                autocompleteItemResult.Title = o.ShortDescription;
                ICatalogPathBuilder catalogPathBuilder = this.catalogPathBuilder;
                Product product = new Product();
                product.Id = o.Id;
                product.UrlSegment = o.UrlSegment;
                // ISSUE: variable of the null type
                dynamic local = null;
                autocompleteItemResult.Url = catalogPathBuilder.MakeCanonicalProductUrlPath(product, (Language)local);
                if (unitOfWork.GetTypedRepository<IProductRepository>().Get((Guid)o.Id).Unspsc != null)
                {
                    autocompleteItemResult.Properties["Unspsc"] = unitOfWork.GetTypedRepository<IProductRepository>().Get((Guid)o.Id).Unspsc;
                }
                else
                {
                    autocompleteItemResult.Properties["Unspsc"] = string.Empty;
                }

                return autocompleteItemResult;
            })).ToList<GetProductAutocompleteItemResult>();
            return this.NextHandler.Execute(unitOfWork, parameter, result);
        }

    }
}
