var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var BrasselerProductListController = /** @class */ (function (_super) {
            __extends(BrasselerProductListController, _super);
            function BrasselerProductListController($scope, coreService, cartService, productService, compareProductsService, $rootScope, $window, $localStorage, paginationService, $q, searchService, spinnerService, addToWishlistPopupService, settingsService, $stateParams, queryString, $location, sessionService, brasselerCartService, ipCookie) {
                var _this = _super.call(this, $scope, coreService, cartService, productService, compareProductsService, $rootScope, $window, $localStorage, paginationService, searchService, spinnerService, addToWishlistPopupService, settingsService, $stateParams, queryString, $location, sessionService) || this;
                _this.$scope = $scope;
                _this.coreService = coreService;
                _this.cartService = cartService;
                _this.productService = productService;
                _this.compareProductsService = compareProductsService;
                _this.$rootScope = $rootScope;
                _this.$window = $window;
                _this.$localStorage = $localStorage;
                _this.paginationService = paginationService;
                _this.$q = $q;
                _this.searchService = searchService;
                _this.spinnerService = spinnerService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.settingsService = settingsService;
                _this.$stateParams = $stateParams;
                _this.queryString = queryString;
                _this.$location = $location;
                _this.sessionService = sessionService;
                _this.brasselerCartService = brasselerCartService;
                _this.ipCookie = ipCookie;
                _this.showQuantityPricing = false;
                _this.showPricing = false;
                _this.cartPopupTimeout = 5000;
                if (_this.spinnerService != undefined) {
                    _this.spinnerService.showAll();
                }
                _this.init();
                _this.localStorage = $localStorage;
                return _this;
            }
            BrasselerProductListController.prototype.init = function () {
                var _this = this;
                this.$scope.$on("sessionLoaded", function (event, session) {
                    _this.session = session;
                });
                this.$scope.$on("addToCartList", function (event, data) {
                    _this.showAddToCartPopup();
                });
                _super.prototype.$onInit.call(this);
                // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
                var path = window.location.pathname;
                var showPopUp = false;
                this.productService.getCatalogPage(path).then(function (result) {
                    _this.category = result.category;
                    _this.breadCrumbs = result.breadCrumbs;
                    _this.getProductFilteredData({
                        categoryId: _this.category.id
                    });
                });
            };
            // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
            BrasselerProductListController.prototype.customPricingFilter = function (product) {
                if (product.pricing.actualBreakPrices.length > 1) {
                    return product;
                }
            };
            //BUSA- 463 Subscription : add smartsupply product to cart
            BrasselerProductListController.prototype.addToSmartSupply = function (product) {
                if (this.isAuthenticated()) {
                    this.brasselerCartService.addSmartSupplyLineFromProduct(product);
                }
                //else {
                //    this.$rootScope.$broadcast("addToCartList");
                //}
            };
            BrasselerProductListController.prototype.showAddToCartPopup = function () {
                this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
            };
            BrasselerProductListController.prototype.addToCart = function (product) {
                if (this.isAuthenticated()) {
                    //this.spinnerService.show();
                    //this.cartService.addLineFromProduct(product).then(() => {
                    //    this.spinnerService.hide();
                    //}).catch(() => {
                    //    this.spinnerService.hide();
                    //});
                    _super.prototype.addToCart.call(this, product);
                }
                else {
                    this.$rootScope.$broadcast("addToCartList");
                }
                var dataLayer = window.dataLayer = window.dataLayer || [];
                dataLayer.push({
                    "event": "addToCart",
                    'ecommerce': {
                        'currencyCode': 'USD',
                        'add': {
                            'products': [{
                                    "id": product.sku,
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
            };
            BrasselerProductListController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
                this.errorMessage = error.message;
            };
            BrasselerProductListController.prototype.isAuthenticated = function () {
                //return this.session && this.session.isAuthenticated && this.sessionService.isAuthenticated();
                return this.session && this.session.isAuthenticated;
            };
            BrasselerProductListController.prototype.storeReturnUrl = function () {
                window.localStorage.setItem("compareReturnUrl", document.location.href);
            };
            // BUSA-636 : Pricing2018 Changes. Added new function to group message on PLP
            BrasselerProductListController.prototype.getProductFilteredData = function (params, expand) {
                var _this = this;
                expand = expand != null ? expand : ["pricing", "attributes", "facets"];
                this.productService.getProducts(params, expand).then(function (result) {
                    _this.products = result;
                    if (result.properties != null && result.properties["useVolumeGroupPricing"] != null && result.properties["useVolumeGroupPricing"].toUpperCase() == "TRUE") {
                        _this.filterProducts = _this.products.products;
                        _this.filterProducts.forEach(function (x) {
                            x.pricing.actualBreakPrices.forEach(function (y) {
                                if (y.savingsMessage == "") {
                                    _this.showQuantityPricing = false;
                                }
                                else {
                                    _this.showQuantityPricing = true;
                                }
                            });
                        });
                        _this.filterProducts.forEach(function (x) {
                            if (x.pricing.actualBreakPrices.length > 1)
                                _this.showPricing = true;
                        });
                    }
                    //*********Google Tag Manager measuring product impressions *****************
                    var dataLayer = window.dataLayer = window.dataLayer || [];
                    if (window.hasOwnProperty("dataLayer")) {
                        var data = {
                            'ecommerce': {
                                'currencyCode': 'USD',
                                'impressions': []
                            }
                        };
                        for (var i = 0; i < _this.products.products.length; i++) {
                            data.ecommerce.impressions.push({
                                "id": _this.products.products[i].sku,
                                "name": _this.products.products[i].shortDescription,
                                "price": _this.products.products[i].pricing.actualPrice,
                                "position": _this.products.products[i].sortOrder,
                                "category": _this.category.name,
                                "variant": _this.products.products[i].unitOfMeasure,
                                "brand": "Brasseler"
                            });
                        }
                        window["dataLayer"].push(data);
                    }
                });
            };
            //BUSA-747 : Add product to existing smart supply link should display on PLP and PDP and search result page
            BrasselerProductListController.prototype.openSmartSupplyPopup = function (product) {
                var products = [];
                products.push(product);
                this.$rootScope.$broadcast("addToExistingSmartSupply", { products: products, popupId: '' });
            };
            BrasselerProductListController.$inject = [
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
            return BrasselerProductListController;
        }(catalog.ProductListController));
        catalog.BrasselerProductListController = BrasselerProductListController;
        angular
            .module("insite")
            .controller("ProductListController", BrasselerProductListController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.productlist.controller.js.map