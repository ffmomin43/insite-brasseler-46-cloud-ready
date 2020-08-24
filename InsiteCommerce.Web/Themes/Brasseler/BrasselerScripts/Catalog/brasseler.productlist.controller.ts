module insite.catalog {
    "use strict";

    export class BrasselerProductListController extends ProductListController {
        errorMessage: string;
        session: any;
        getDiscontinuedAttributeTypeFacets: Insite.Core.Plugins.Search.Dtos.AttributeTypeFacetDto[];
        products: Insite.Catalog.WebApi.V1.ApiModels.ProductCollectionModel;
        filterProducts: ProductDto[];
        category: CategoryModel;
        showQuantityPricing: boolean = false;
        showPricing: boolean = false;
        isQtyAdjusted: boolean;
        cartPopupTimeout = 5000;
        localStorage: common.IWindowStorage;

        public static $inject = [
            "$scope",
            "coreService",
            "cartService",
            "productService",
            "compareProductsService",
            "$rootScope",
            "$window",
            "$localStorage",
            "paginationService",
            "$q",
            "searchService",
            "spinnerService",
            "addToWishlistPopupService",
            "settingsService",
            "$stateParams",
            "queryString",
            "$location",
            "sessionService",
            "brasselerCartService",
            "ipCookie"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected compareProductsService: ICompareProductsService,
            protected $rootScope: ng.IRootScopeService,
            protected $window: ng.IWindowService,
            protected $localStorage: common.IWindowStorage,
            protected paginationService: core.IPaginationService,
            protected $q: ng.IQService,
            protected searchService: ISearchService,
            protected spinnerService: core.ISpinnerService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $stateParams: IProductListStateParams,
            protected queryString: common.IQueryStringService,
            protected $location: ng.ILocationService,
            protected sessionService: account.ISessionService,
            protected brasselerCartService: cart.IBrasselerCartService,
            protected ipCookie: any
            ) {
            super($scope, coreService, cartService, productService, compareProductsService, $rootScope, $window,
                $localStorage, paginationService, searchService, spinnerService, addToWishlistPopupService, settingsService,
                $stateParams, queryString, $location, sessionService);
            if (this.spinnerService != undefined) {
                this.spinnerService.showAll();
            }
            this.init();
            this.localStorage = $localStorage;
        }

        init() {

            this.$scope.$on("sessionLoaded", (event: ng.IAngularEvent, session: SessionModel) => {
                this.session = session;
            });

            this.$scope.$on("addToCartList", (event, data) => {
                this.showAddToCartPopup();
            });

            super.$onInit();
            // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
            var path = window.location.pathname;
            var showPopUp = false;
            this.productService.getCatalogPage(path).then(
                (result: CatalogPageModel) => {
                    this.category = result.category;
                    this.breadCrumbs = result.breadCrumbs;
                    this.getProductFilteredData({
                        categoryId: this.category.id
                    });
                });
        }

        // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
        customPricingFilter(product: ProductDto) {
            if (product.pricing.actualBreakPrices.length > 1) {
                return product;
            }
        }
        //BUSA- 463 Subscription : add smartsupply product to cart
        addToSmartSupply(product: ProductDto) {
            if (this.isAuthenticated()) {
                this.brasselerCartService.addSmartSupplyLineFromProduct(product);
            }
            //else {
            //    this.$rootScope.$broadcast("addToCartList");
            //}
        }

        showAddToCartPopup() {
            this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
        }

        addToCart(product: ProductDto) {
            if (this.isAuthenticated()) {
                //this.spinnerService.show();
                //this.cartService.addLineFromProduct(product).then(() => {
                //    this.spinnerService.hide();
                //}).catch(() => {
                //    this.spinnerService.hide();
                //});
                super.addToCart(product);
            }
            else {
                this.$rootScope.$broadcast("addToCartList");
            }
            var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
            dataLayer.push({
                "event": "addToCart",
                'ecommerce': {
                    'currencyCode': 'USD',
                    'add': {                                // 'add' actionFieldObject measures.
                        'products': [{
                            "id": product.sku,                    //  adding a product to a shopping cart.
                            "name": product.shortDescription,
                            "price": product.pricing.actualPriceDisplay,
                            "quantity": product.qtyOrdered,
                            "category": this.category.name,
                            "position": product.sortOrder,
                            "variant": product.unitOfMeasure,
                            "brand": "Brasseler"
                        }]
                    }
                }
            });

        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
            this.errorMessage = error.message;
        }

        isAuthenticated(): boolean {
            //return this.session && this.session.isAuthenticated && this.sessionService.isAuthenticated();
            return this.session && this.session.isAuthenticated;
        }

        storeReturnUrl() {
            window.localStorage.setItem("compareReturnUrl", document.location.href);
        }

        // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
        getProductFilteredData(params: IProductCollectionParameters, expand?: string[]) {
            expand = expand != null ? expand : ["pricing", "attributes", "facets"];
            this.productService.getProducts(params, expand).then(
                (result: ProductCollectionModel) => {
                    this.products = result;
                    if (result.properties != null && result.properties["useVolumeGroupPricing"] != null && result.properties["useVolumeGroupPricing"].toUpperCase() == "TRUE") {
                        this.filterProducts = this.products.products;
                        this.filterProducts.forEach(x => {
                            x.pricing.actualBreakPrices.forEach(y => {
                                if (y.savingsMessage == "") {
                                    this.showQuantityPricing = false;
                                } else {
                                    this.showQuantityPricing = true;
                                }
                            });
                        });
                        this.filterProducts.forEach(x => {
                            if (x.pricing.actualBreakPrices.length > 1)
                                this.showPricing = true;
                        });
                    }
                    //*********Google Tag Manager measuring product impressions *****************
                    var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];

                    if (window.hasOwnProperty("dataLayer")) {
                        var data = {
                            'ecommerce': {
                                'currencyCode': 'USD',
                                'impressions': []
                            }
                        };

                        for (var i = 0; i < this.products.products.length; i++) {

                            data.ecommerce.impressions.push({
                                "id": this.products.products[i].sku,
                                "name": this.products.products[i].shortDescription,
                                "price": this.products.products[i].pricing.actualPrice,
                                "position": this.products.products[i].sortOrder,
                                "category": this.category.name,
                                "variant": this.products.products[i].unitOfMeasure,
                                "brand": "Brasseler"
                            });
                        }
                        window["dataLayer"].push(data);
                    }

                });
        }

        //BUSA-747 : Add product to existing smart supply link should display on PLP and PDP and search result page
        openSmartSupplyPopup(product: ProductDto) {
            var products: ProductDto[] = [];
            products.push(product);
            this.$rootScope.$broadcast("addToExistingSmartSupply", { products: products, popupId: '' });
        }
    }
    angular
        .module("insite")
        .controller("ProductListController", BrasselerProductListController);
}