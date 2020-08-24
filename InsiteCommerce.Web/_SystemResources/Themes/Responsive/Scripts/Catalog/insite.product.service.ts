import ProductDto = Insite.Catalog.Services.Dtos.ProductDto;
import ProductModel = Insite.Catalog.WebApi.V1.ApiModels.ProductModel;
import ProductCollectionModel = Insite.Catalog.WebApi.V1.ApiModels.ProductCollectionModel;
import CatalogPageModel = Insite.Catalog.WebApi.V1.ApiModels.CatalogPageModel;
import CategoryModel = Insite.Catalog.WebApi.V1.ApiModels.CategoryModel;
import CategoryCollectionModel = Insite.Catalog.WebApi.V1.ApiModels.CategoryCollectionModel;
import ProductAvailabilityModel = Insite.Catalog.WebApi.V1.ApiModels.ProductAvailabilityModel;
import ProductPriceModel = Insite.Catalog.WebApi.V1.ApiModels.ProductPriceModel;
import CrossSellCollectionModel = Insite.Catalog.WebApi.V1.ApiModels.CrossSellCollectionModel;
import ProductSettingsModel = Insite.Catalog.WebApi.V1.ApiModels.ProductSettingsModel;
import RealTimePricingModel = Insite.RealTimePricing.WebApi.V1.ApiModels.RealTimePricingModel;
import RealTimeInventoryModel = Insite.RealTimeInventory.WebApi.V1.ApiModels.RealTimeInventoryModel;
import ProductPriceDto = Insite.Core.Plugins.Pricing.ProductPriceDto;
import ProductInventoryDto = Insite.Core.Plugins.Inventory.ProductInventoryDto;
import ProductUnitOfMeasureDto = Insite.Catalog.Services.Dtos.ProductUnitOfMeasureDto;

module insite.catalog {
    "use strict";

    // parameters accepted by get getProductCollection
    export interface IProductCollectionParameters {
        categoryId?: System.Guid;
        query?: string;
        page?: number;
        pageSize?: number;
        sort?: string;
        attributeValueIds?: string[];
        priceFilters?: string[];
        productIds?: System.Guid[];
        brandIds?: System.Guid[];
        productLineIds?: System.Guid[];
        names?: string[];
        erpNumbers?: string[];
        extendedNames?: string[];
        replaceProducts?: boolean;
        productPriceParameters?: IProductPriceParameter;
        includeSuggestions?: string;
        searchWithin?: string;
        getAllAttributeFacets?: boolean;
        topSellersMaxResults?: number;
        topSellersCategoryIds?: System.Guid[];
        applyPersonalization?: boolean;
        includeAttributes?: string;
        includeAlternateInventory?: boolean;
        makeBrandUrls?: boolean;
        previouslyPurchasedProducts?: boolean;
        stockedItemsOnly?: boolean;
    }

    // parameters accepted by get getProduct
    export interface IProductParameters {
        categoryId?: string;
        productId: string;
        unitOfMeasure?: string;
        addToRecentlyViewed?: boolean;
        alsoPurchasedMaxResults?: number;
        configuration?: string[];
        expand?: string;
        replaceProducts?: boolean;
    }

    export interface IProductPriceParameter {
        productId: string;
        unitOfMeasure?: string;
        qtyOrdered?: number;
        configuration?: string[];
    }

    export interface IProductFilterCollectionParameters {
        categoryId?: System.Guid;
        query?: string;
        attributeValueIds?: string[];
        priceFilters?: string[];
    }

    export interface IProductService {
        changeUnitOfMeasure(product: ProductDto, refreshPrice?: boolean): ng.IPromise<ProductDto>;
        updateAvailability(product: ProductDto): void;
        getProductAvailability(product: ProductDto, configuration?: string[]): ng.IPromise<ProductAvailabilityModel>;
        getProductPrice(product: ProductDto, configuration?: string[]): ng.IPromise<ProductPriceModel>;
        getProductRealTimePrices(products: ProductDto[]): ng.IPromise<RealTimePricingModel>;
        getProductRealTimePrice(product: ProductDto, configuration?: string[]): ng.IPromise<RealTimePricingModel>;
        getProductRealTimeInventory(products: ProductDto[], expand?: string[], configurations?: { [key: string]: string[] }): ng.IPromise<RealTimeInventoryModel>;
        getCatalogPage(path: string): ng.IPromise<CatalogPageModel>;
        getCategoryTree(startCategoryId?: string, maxDepth?: number): ng.IPromise<CategoryCollectionModel>;
        getCategory(categoryId?: string): ng.IPromise<CategoryModel>;
        /*
         * Fetch a group of products
         * @param parameters An IProductCollectionParameters specifying the products
         * @param expand Specifies which optional data to bring back. some valid values are ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing", "facets"]
         */
        getProducts(parameters: IProductCollectionParameters, expand?: string[], filter?: string[]): ng.IPromise<ProductCollectionModel>;
        /*
         * Fetch one product by id
         * @param categoryId Id of the category the product is in
         * @param productId Id of the product
         * @param expand Specifies which optional data to bring back. some valid values are ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing"]
         */
        getProduct(categoryId: string, productId: string, expand?: string[], addToRecentlyViewed?: boolean, applyPersonalization?: boolean, includeAttributes?: string, includeAlternateInventory?: boolean, configuration?: string[], replaceProducts?: boolean): ng.IPromise<ProductModel>;
        getProductByParameters(parameters: IProductParameters): ng.IPromise<ProductModel>;
        getProductSettings(): ng.IPromise<ProductSettingsModel>;
        getCrossSells(productId: string): ng.IPromise<CrossSellCollectionModel>;
        batchGet(extendedNames: string[]): ng.IPromise<ProductDto[]>;
    }

    export class ProductService implements IProductService {
        productServiceUri = "/api/v1/products/";
        categoryServiceUri = "/api/v1/categories";
        catalogPageServiceUri = "/api/v1/catalogpages";
        webCrossSellUri = "/api/v1/websites/current/crosssells";
        productSettingsUri = "/api/v1/settings/products";
        realTimePricingUri = "/api/v1/realtimepricing";
        realTimeInventoryUri = "/api/v1/realtimeinventory";

        productSettings: ProductSettingsModel;

        static $inject = ["$http", "$rootScope", "$q", "coreService", "settingsService", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected httpWrapperService: core.HttpWrapperService) {
            this.init();
        }

        init(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); }
            );
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        changeUnitOfMeasure(product: ProductDto, refreshPrice = true): ng.IPromise<ProductDto> {
            product.unitOfMeasure = product.selectedUnitOfMeasure;
            const selectedUnitOfMeasure = this.coreService.getObjectByPropertyValue(product.productUnitOfMeasures, { unitOfMeasure: product.selectedUnitOfMeasure });
            const deferred = this.$q.defer();

            if (!product.quoteRequired && refreshPrice) {
                if (this.productSettings.realTimePricing) {
                    product.pricing.requiresRealTimePrice = true;
                    this.getProductRealTimePrices([product]).then((realTimePrice: RealTimePricingModel) => {
                        this.changeUnitOfMeasureGetProductRealTimePriceCompleted(product, selectedUnitOfMeasure, realTimePrice, deferred as any);
                    });
                } else {
                    this.getProductPrice(product).finally(() => {
                        this.changeUnitOfMeasureGetProductPriceCompleted(product, selectedUnitOfMeasure, null, deferred as any);
                    });
                }
            } else {
                product.unitOfMeasureDisplay = selectedUnitOfMeasure.unitOfMeasureDisplay;
                product.unitOfMeasureDescription = selectedUnitOfMeasure.description;
                deferred.resolve(product);
            }

            return deferred.promise as any;
        }

        protected changeUnitOfMeasureGetProductRealTimePriceCompleted(product: ProductDto, unitOfMeasure: ProductUnitOfMeasureDto, realTimePrice: RealTimePricingModel, deferred: ng.IDeferred<ProductDto>): void {
            product.unitOfMeasureDisplay = unitOfMeasure.unitOfMeasureDisplay;
            product.unitOfMeasureDescription = unitOfMeasure.description;
            deferred.resolve(product);
        }

        protected changeUnitOfMeasureGetProductPriceCompleted(product: ProductDto, unitOfMeasure: ProductUnitOfMeasureDto, productPrice: ProductPriceModel, deferred: ng.IDeferred<ProductDto>): void {
            if (!unitOfMeasure) {
                deferred.reject();
            }

            product.unitOfMeasureDisplay = unitOfMeasure.unitOfMeasureDisplay;
            product.unitOfMeasureDescription = unitOfMeasure.description;
            deferred.resolve(product);
        }

        updateAvailability(product: ProductDto): void {
            if (product && !product.isStyleProductParent && product.productUnitOfMeasures && product.selectedUnitOfMeasure) {
                const productUnitOfMeasure = product.productUnitOfMeasures.find((uom) => uom.unitOfMeasure === product.selectedUnitOfMeasure);
                if (productUnitOfMeasure && (productUnitOfMeasure as any).availability) {
                    product.availability = (productUnitOfMeasure as any).availability;
                }
            }
        }

        // updates the pricing on a product object based on the qtyOrdered, selectedUnitOfMeasure and array of configuration guids
        getProductPrice(product: ProductDto, configuration?: string[]): ng.IPromise<ProductPriceModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.productServiceUri}${product.id}/price`, params: this.getProductPriceParams(product, configuration), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<ProductPriceModel>) => { this.getProductPriceCompleted(response, product); },
                this.getProductPriceFailed
            );
        }

        protected getProductPriceParams(product: ProductDto, configuration?: string[]): any {
            return {
                unitOfMeasure: product.selectedUnitOfMeasure,
                qtyOrdered: product.qtyOrdered,
                configuration: configuration
            };
        }

        protected getProductPriceCompleted(response: ng.IHttpPromiseCallbackArg<ProductPriceModel>, product: ProductDto): void {
            product.pricing = response.data;
        }

        protected getProductPriceFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getProductAvailability(product: ProductDto, configuration?: string[]): ng.IPromise<ProductAvailabilityModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.productServiceUri}${product.id}/availability`, params: this.getProductAvailabilityParams(product, configuration), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<ProductAvailabilityModel>) => { this.getProductAvailabilityCompleted(response, product); },
                this.getProductAvailabilityFailed
            );
        }

        protected getProductAvailabilityParams(product: ProductDto, configuration?: string[]): any {
            return {
                configuration: configuration
            };
        }

        protected getProductAvailabilityCompleted(response: ng.IHttpPromiseCallbackArg<ProductAvailabilityModel>, product: ProductDto): void {
            product.availability = response.data.availability;
        }

        protected getProductAvailabilityFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        // updates the pricing with real time (external) prices. only id, selectedUnitOfMeasure, and qtyOrdered are used
        getProductRealTimePrices(products: ProductDto[]): ng.IPromise<RealTimePricingModel> {
            if (!this.productSettings.canSeePrices) {
                const deferred = this.$q.defer();
                deferred.resolve(null);
                return deferred.promise as any;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: this.realTimePricingUri, data: this.getProductRealTimePricesParams(products), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<RealTimePricingModel>) => { this.getProductRealTimePricesCompleted(response, products); },
                this.getProductRealTimePricesFailed
            );
        }

        protected getProductRealTimePricesParams(products: ProductDto[]): any {
            return {
                productPriceParameters: products.map((product) => {
                    return {
                        productId: product.id,
                        unitOfMeasure: product.selectedUnitOfMeasure,
                        qtyOrdered: product.qtyOrdered
                    };
                })
            };
        }

        protected getProductRealTimePricesCompleted(response: ng.IHttpPromiseCallbackArg<RealTimePricingModel>, products: ProductDto[]): void {
            response.data.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const product = products.find((p: ProductDto) => p.id === productPrice.productId);
                if (product) {
                    product.pricing = productPrice;
                }
            });
        }

        protected getProductRealTimePricesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getProductRealTimePrice(product: ProductDto, configuration?: string[]): ng.IPromise<RealTimePricingModel> {
            if (!this.productSettings.canSeePrices) {
                const deferred = this.$q.defer();
                deferred.resolve(null);
                return deferred.promise as any;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: this.realTimePricingUri, data: this.getProductRealTimePriceParams(product, configuration), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<RealTimePricingModel>) => { this.getProductRealTimePriceCompleted(response, product); },
                this.getProductRealTimePriceFailed
            );
        }

        protected getProductRealTimePriceParams(product: ProductDto, configuration?: string[]): any {
            return {
                productPriceParameters: [
                    {
                        productId: product.id,
                        unitOfMeasure: product.selectedUnitOfMeasure,
                        qtyOrdered: product.qtyOrdered,
                        configuration: configuration
                    }
                ]
            };
        }

        protected getProductRealTimePriceCompleted(response: ng.IHttpPromiseCallbackArg<RealTimePricingModel>, product: ProductDto): void {
            response.data.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                if (product.id === productPrice.productId) {
                    product.pricing = productPrice;
                }
            });
        }

        protected getProductRealTimePriceFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getProductRealTimeInventory(products: ProductDto[], expand?: string[], configuration?: { [key: string]: string[] }): ng.IPromise<RealTimeInventoryModel> {
            if (!this.productSettings.showInventoryAvailability) {
                const deferred = this.$q.defer();
                deferred.resolve(null);
                return deferred.promise as any;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: this.realTimeInventoryUri + (expand ? `?expand=${expand.join()}` : ""), data: this.getProductRealTimeInventoryParams(products, configuration), bypassErrorInterceptor: true  }),
                (response: ng.IHttpPromiseCallbackArg<RealTimeInventoryModel>) => { this.getProductRealTimeInventoryCompleted(response, products); },
                this.getProductRealTimeInventoryFailed
            );
        }

        protected getProductRealTimeInventoryParams(products: ProductDto[], configurations?: { [key: string]: string[] }): {} {
            var productIds = new Array<System.Guid>();
            products.forEach((product) => {
                if (productIds.indexOf(product.id) === -1) {
                    productIds.push(product.id);
                }
            });
            return {
                productIds: productIds,
                configurations: configurations
            };
        }

        protected getProductRealTimeInventoryCompleted(response: ng.IHttpPromiseCallbackArg<RealTimeInventoryModel>, products: ProductDto[]): void {
            response.data.realTimeInventoryResults.forEach((productInventory: ProductInventoryDto) => {
                products.forEach((product: ProductDto) => {
                    if (!product || product.id !== productInventory.productId) {
                        return;
                    }

                    product.qtyOnHand = productInventory.qtyOnHand;

                    var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(o => o.unitOfMeasure === product.unitOfMeasure);
                    if (inventoryAvailability) {
                        product.availability = inventoryAvailability.availability;
                    } else {
                        product.availability = { messageType: 0 };
                    }

                    product.productUnitOfMeasures.forEach((productUnitOfMeasure: ProductUnitOfMeasureDto) => {
                        var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(o => o.unitOfMeasure === productUnitOfMeasure.unitOfMeasure);
                        if (inventoryAvailability) {
                            productUnitOfMeasure.availability = inventoryAvailability.availability;
                        } else {
                            productUnitOfMeasure.availability = { messageType: 0 };
                        }
                    });

                    this.updateAvailability(product);
                    if (product.canAddToCart && !product.canBackOrder && product.trackInventory && product.qtyOnHand <= 0) {
                        product.canAddToCart = false;
                        product.canEnterQuantity = product.canAddToCart;
                        product.canViewDetails = !product.canAddToCart;
                    }
                });
            });
        }

        protected getProductRealTimeInventoryFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getCatalogPage(path: string): ng.IPromise<CatalogPageModel> {
            // check for server side data
            if ((catalog as any).catalogPageGlobal) {
                const deferred = this.$q.defer();
                deferred.resolve((catalog as any).catalogPageGlobal);
                return deferred.promise as any;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.catalogPageServiceUri, params: this.getCatalogPageParams(path) }),
                this.getCatalogPageCompleted,
                this.getCatalogPageFailed);
        }

        protected getCatalogPageParams(path: string): any {
            return { path: path };
        }

        protected getCatalogPageCompleted(response: ng.IHttpPromiseCallbackArg<CatalogPageModel>): void {
        }

        protected getCatalogPageFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getCategoryTree(startCategoryId?: string, maxDepth?: number): ng.IPromise<CategoryCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.categoryServiceUri, params: this.getCategoryTreeParams(startCategoryId, maxDepth) }),
                this.getCategoryTreeCompleted,
                this.getCategoryTreeFailed);
        }

        protected getCategoryTreeParams(startCategoryId?: string, maxDepth?: number): any {
            const params = {} as any;

            if (startCategoryId) {
                params.startCategoryId = startCategoryId;
            }
            if (maxDepth) {
                params.maxDepth = maxDepth;
            }

            return params;
        }

        protected getCategoryTreeCompleted(response: ng.IHttpPromiseCallbackArg<CategoryCollectionModel>): void {
        }

        protected getCategoryTreeFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getCategory(categoryId?: string): ng.IPromise<CategoryModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.categoryServiceUri}/${categoryId}`, params: this.getCategoryParams() }),
                this.getCategoryCompleted,
                this.getCategoryFailed);
        }

        protected getCategoryParams(): any {
            return {};
        }

        protected getCategoryCompleted(response: ng.IHttpPromiseCallbackArg<CategoryModel>): void {
        }

        protected getCategoryFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getProducts(parameters: IProductCollectionParameters, expand?: string[], filter?: string[]): ng.IPromise<ProductCollectionModel> {
            const deferred = this.$q.defer();

            this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.productServiceUri, params: this.getProductsParams(parameters, expand, filter), timeout: deferred.promise }),
                (response: ng.IHttpPromiseCallbackArg<ProductCollectionModel>) => { this.getProductsCompleted(response, deferred as any); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getProductsFailed(error, deferred as any); });

            (deferred.promise as any).cancel = () => {
                deferred.resolve("cancelled");
            };

            return deferred.promise as any;
        }

        protected getProductsParams(parameters: IProductCollectionParameters, expand?: string[], filter?: string[]): any {
            const params = parameters as any;

            if (expand) {
                params.expand = expand.join();
            }

            if (filter) {
                params.filter = filter.join();
            }

            return params;
        }

        protected getProductsCompleted(response: ng.IHttpPromiseCallbackArg<ProductCollectionModel>, deferred: ng.IDeferred<ProductCollectionModel>): void {
            deferred.resolve(response.data);
        }

        protected getProductsFailed(error: ng.IHttpPromiseCallbackArg<any>, deferred: ng.IDeferred<ProductCollectionModel>): void {
            deferred.reject(error);
        }

        getProduct(categoryId: string, productId: string, expand?: string[], addToRecentlyViewed?: boolean, applyPersonalization?: boolean, includeAttributes?: string, includeAlternateInventory?: boolean, configuration?: string[], replaceProducts?: boolean): ng.IPromise<ProductModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.productServiceUri}${productId}`, params: this.getProductParams(categoryId, expand, addToRecentlyViewed, applyPersonalization, includeAttributes, includeAlternateInventory, configuration, replaceProducts) }),
                this.getProductCompleted,
                this.getProductFailed);
        }

        protected getProductParams(categoryId: string, expand?: string[], addToRecentlyViewed?: boolean, applyPersonalization?: boolean, includeAttributes?: string, includeAlternateInventory?: boolean, configuration?: string[], replaceProducts?: boolean): any {
            const params = {} as any;

            if (expand) {
                params.expand = expand.join();
            }
            if (categoryId) {
                params.categoryId = categoryId;
            }
            if (addToRecentlyViewed) {
                params.addToRecentlyViewed = true;
            }
            if (applyPersonalization) {
                params.applyPersonalization = applyPersonalization;
            }
            if (includeAttributes) {
                params.includeAttributes = includeAttributes;
            }
            if (typeof (includeAlternateInventory) !== "undefined") {
                params.includeAlternateInventory = includeAlternateInventory;
            }
            if (typeof (configuration) !== "undefined") {
                params.configuration = configuration;
            }
            if (typeof (replaceProducts) !== "undefined") {
                params.replaceProducts = replaceProducts;
            }

            return params;
        }

        getProductByParameters(parameters: IProductParameters): ng.IPromise<ProductModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.productServiceUri}${parameters.productId}`, params: parameters }),
                this.getProductCompleted,
                this.getProductFailed);
        }

        protected getProductCompleted(response: ng.IHttpPromiseCallbackArg<ProductModel>): void {
            this.$rootScope.$broadcast("productLoaded", response.data.product);
        }

        protected getProductFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getProductSettings(): ng.IPromise<ProductSettingsModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(this.productSettingsUri),
                this.getProductSettingsCompleted,
                this.getProductSettingsFailed);
        }

        protected getProductSettingsCompleted(response: ng.IHttpPromiseCallbackArg<ProductSettingsModel>): void {
        }

        protected getProductSettingsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        // get cross sells for a product or pass no parameter to get web cross sells
        getCrossSells(productId: string): ng.IPromise<CrossSellCollectionModel> {
            let uri = this.webCrossSellUri;

            if (productId) {
                uri = `${this.productServiceUri}${productId}/crosssells`;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(uri),
                this.getCrossSellsCompleted,
                this.getCrossSellsFailed);
        }

        protected getCrossSellsCompleted(response: ng.IHttpPromiseCallbackArg<CrossSellCollectionModel>): void {
        }

        protected getCrossSellsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        batchGet(extendedNames: string[]): ng.IPromise<ProductDto[]> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(`${this.productServiceUri}/batchget`, { extendedNames }),
                this.bulkSearchCompleted,
                this.bulkSearchFailed);
        }

        protected bulkSearchCompleted(response: ng.IHttpPromiseCallbackArg<ProductDto[]>): void {
        }

        protected bulkSearchFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("productService", ProductService);
}