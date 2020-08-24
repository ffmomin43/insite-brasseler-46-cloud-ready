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
        var BrasselerProductDetailController = /** @class */ (function (_super) {
            __extends(BrasselerProductDetailController, _super);
            function BrasselerProductDetailController($scope, coreService, cartService, productService, addToWishlistPopupService, productSubscriptionPopupService, settingsService, $stateParams, sessionService, $rootScope, brasslerProductService, brasselerCartService, $localStorage, ipCookie, addToExistingSmartSupplyService, spinnerService, queryString, tellAFriendPopupService) {
                var _this = _super.call(this, $scope, coreService, cartService, productService, addToWishlistPopupService, productSubscriptionPopupService, settingsService, $stateParams, sessionService, spinnerService, queryString, tellAFriendPopupService) || this;
                _this.$scope = $scope;
                _this.coreService = coreService;
                _this.cartService = cartService;
                _this.productService = productService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.productSubscriptionPopupService = productSubscriptionPopupService;
                _this.settingsService = settingsService;
                _this.$stateParams = $stateParams;
                _this.sessionService = sessionService;
                _this.$rootScope = $rootScope;
                _this.brasslerProductService = brasslerProductService;
                _this.brasselerCartService = brasselerCartService;
                _this.$localStorage = $localStorage;
                _this.ipCookie = ipCookie;
                _this.addToExistingSmartSupplyService = addToExistingSmartSupplyService;
                _this.spinnerService = spinnerService;
                _this.queryString = queryString;
                _this.tellAFriendPopupService = tellAFriendPopupService;
                _this.cartPopupTimeout = 5000;
                _this.newWebShopperCustomerNumber = "1055357";
                _this.spinnerService.show();
                _super.prototype.$onInit.call(_this);
                _this.init();
                _this.spinnerService.hide();
                _this.localStorage = $localStorage;
                return _this;
            }
            BrasselerProductDetailController.prototype.init = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) {
                    _this.session = session;
                });
                this.$scope.$on("addToCartList", function (event, data) {
                    _this.showAddToCartPopup();
                });
            };
            BrasselerProductDetailController.prototype.getProductData = function (productId) {
                var _this = this;
                var expandParameter = ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing"];
                var showPopUp = false;
                this.spinnerService.show();
                this.productService.getProduct(this.category != null ? this.category.id.toString() : null, productId, expandParameter).then(function (result) {
                    _this.product = result.product;
                    if (_this.session != null && _this.session != undefined && _this.session.billTo) {
                        if (String(_this.session.billTo.customerNumber).includes(_this.newWebShopperCustomerNumber)) {
                            _this.product.properties['isNewUser'] = "true";
                        }
                    }
                    if (result.properties["vdgRelatedProducts"] != null && result.product.modelNumber != null) {
                        _this.VDGRelatedProducts = JSON.parse(result.properties["vdgRelatedProducts"]);
                        _this.volumeGrpDescription = result.product.modelNumber;
                    }
                    if (result.product.replacementProductId != null) {
                        _this.getReplacementProductData(result.product.replacementProductId.toString().toUpperCase());
                    }
                    _this.product.qtyOrdered = 1;
                    if (_this.product.isConfigured && _this.product.configurationDto && _this.product.configurationDto.sections)
                        _this.initConfigurationSelection(_this.product.configurationDto.sections);
                    if (_this.product.styleTraits.length > 0) {
                        _this.initialStyledProducts = _this.product.styledProducts.slice();
                        _this.styleTraitFiltered = _this.product.styleTraits.slice();
                        _this.initialStyleTraits = _this.product.styleTraits.slice();
                        if (_this.product.isStyleProductParent) {
                            _this.parentProduct = angular.copy(_this.product);
                        }
                        _this.initStyleSelection(_this.product.styleTraits);
                    }
                    ;
                    setTimeout(function () {
                        $(".easy-resp-tabs").easyResponsiveTabs();
                    }, 10);
                    _this.cartService.cartLoadCalled = false;
                    _this.cartService.getCart();
                    // BUSA-573
                    //*********Google Tag Manager measuring product detail view *****************
                    var dataLayer = window.dataLayer = window.dataLayer || [];
                    dataLayer.push({
                        'ecommerce': {
                            'detail': {
                                'actionField': { 'list': 'Product List' },
                                'products': [{
                                        "id": _this.product.sku,
                                        "name": _this.product.shortDescription,
                                        "price": _this.product.pricing.actualPriceDisplay,
                                        "category": _this.category ? _this.category.name : _this.product.modelNumber,
                                        "variant": _this.product.unitOfMeasure,
                                        "brand": "Brasseler"
                                    }]
                            }
                        }
                    });
                    //*********Google Tag Manager measuring product clicks *****************
                    dataLayer.push({
                        'event': 'productClick',
                        'ecommerce': {
                            'click': {
                                'actionField': { 'list': 'Product List' },
                                'products': [{
                                        "id": _this.product.sku,
                                        "name": _this.product.shortDescription,
                                        "price": _this.product.pricing.actualPriceDisplay,
                                        "category": _this.category ? _this.category.name : _this.product.modelNumber,
                                        "position": _this.product.sortOrder,
                                        "variant": _this.product.unitOfMeasure,
                                        "brand": "Brasseler"
                                    }]
                            }
                        },
                    });
                }, function (error) {
                }).then(function () {
                    _this.spinnerService.hide();
                });
            };
            BrasselerProductDetailController.prototype.getReplacementProductData = function (productId) {
                var _this = this;
                this.brasslerProductService.getReplacementProductData(productId).then(function (results) {
                    _this.replacementProduct = results.product;
                }, function (error) {
                });
            };
            //BUSA- 463 Subscription : add smartsupply product to cart
            BrasselerProductDetailController.prototype.addToSmartSupply = function (product) {
                var _this = this;
                if (this.isAuthenticated()) {
                    var sectionOptions = null;
                    if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                        sectionOptions = this.configurationSelection;
                    }
                    this.brasselerCartService.addSmartSupplyLineFromProduct(product, sectionOptions).then(function (cartLine) { _this.addingToCart = false; }, function (error) { _this.addingToCart = false; });
                }
                else {
                    this.$rootScope.$broadcast("addToCartList");
                }
            };
            BrasselerProductDetailController.prototype.addToCart = function (product) {
                var _this = this;
                if (this.isAuthenticated()) {
                    this.addingToCart = true;
                    var sectionOptions = null;
                    if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                        sectionOptions = this.configurationSelection;
                    }
                    this.cartService.addLineFromProduct(product, sectionOptions, this.productSubscription, true).then(function (cartLine) { _this.addingToCart = false; }, function (error) {
                        _this.addingToCart = false;
                        _this.errorMessage = error.message;
                    });
                }
                else {
                    this.$rootScope.$broadcast("addToCartList");
                }
                // BUSA-573
                //*********Google Tag Manager measuring product add to cart *****************
                var dataLayer = window.dataLayer = window.dataLayer || [];
                dataLayer.push({
                    'event': 'addToCart',
                    'ecommerce': {
                        'currencyCode': 'USD',
                        'add': {
                            'actionField': { 'list': product.shortDescription },
                            'product': [{
                                    "id": product.sku,
                                    "name": product.shortDescription,
                                    "price": product.pricing.actualPriceDisplay,
                                    "quantity": product.qtyOrdered,
                                    "category": this.category ? this.category.name : this.product.modelNumber,
                                    "variant": this.product.unitOfMeasure,
                                    "brand": 'Brasseler'
                                }]
                        }
                    }
                });
            };
            BrasselerProductDetailController.prototype.isAuthenticated = function () {
                return this.session && this.session.isAuthenticated;
            };
            //BUSA-747 : Add product to existing smart supply link should display on PLP and PDP and search result page
            BrasselerProductDetailController.prototype.openSmartSupplyPopup = function (product) {
                this.addToExistingSmartSupplyService.display([product]);
            };
            BrasselerProductDetailController.prototype.showAddToCartPopup = function () {
                this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
            };
            BrasselerProductDetailController.$inject = [
                "$scope",
                "coreService",
                "cartService",
                "productService",
                "addToWishlistPopupService",
                "productSubscriptionPopupService",
                "settingsService",
                "$stateParams",
                "sessionService",
                "$rootScope",
                "brasslerProductService",
                "brasselerCartService",
                "$localStorage",
                "ipCookie",
                "AddToExistingSmartSupplyService",
                "spinnerService",
                "queryString",
                "tellAFriendPopupService"
            ];
            return BrasselerProductDetailController;
        }(catalog.ProductDetailController));
        catalog.BrasselerProductDetailController = BrasselerProductDetailController;
        angular
            .module("insite")
            .controller("ProductDetailController", BrasselerProductDetailController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.productdetail.controller.js.map