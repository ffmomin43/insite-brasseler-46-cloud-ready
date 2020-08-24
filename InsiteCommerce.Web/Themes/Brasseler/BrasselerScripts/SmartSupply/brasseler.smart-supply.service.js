var CartSubscriptionDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.CartSubscriptionDto;
var CartModelBrasseler = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.CartModel_Brasseler;
var CartModels = insite.cart;
var insite;
(function (insite) {
    var smartsupply;
    (function (smartsupply) {
        "use strict";
        var SmartSupplyService = /** @class */ (function () {
            function SmartSupplyService($http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.addressErrorPopupService = addressErrorPopupService;
                this.addToCartPopupService = addToCartPopupService;
                this.apiErrorPopupService = apiErrorPopupService;
                this.httpWrapperService = httpWrapperService;
                this.serviceUriCart = "/api/v1/carts";
                this.serviceUri = "/api/v1/SubscriptionCart";
                this.invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
                this.expand = "";
                this.cartPopupTimeout = 3000;
                this.cartLoadCalled = false;
                this.preventCartLoad = false;
                this.cartLinesUri = "";
                this.currentCartLinesUri = "";
                this.currentCart = null;
                this.forceRecalculation = false;
            }
            SmartSupplyService.prototype.getSmartSupplyCart = function (cartId, suppressApiErrors) {
                var _this = this;
                if (suppressApiErrors === void 0) { suppressApiErrors = false; }
                if (!cartId) {
                    cartId = "current";
                }
                if (cartId === "current") {
                    this.cartLoadCalled = true;
                }
                var uri = this.serviceUriCart + "/" + cartId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: uri, params: this.getCartParams(), bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } }), function (response) { _this.getCartCompleted(response, cartId); }, suppressApiErrors ? this.getCartFailedSuppressErrors : this.getCartFailed);
            };
            SmartSupplyService.prototype.getCartFailedSuppressErrors = function (error) {
            };
            SmartSupplyService.prototype.getCartFailed = function (error) {
                this.showCartError(error.data);
            };
            SmartSupplyService.prototype.showCartError = function (error) {
                if (error.message === this.invalidAddressException) {
                    this.addressErrorPopupService.display(null);
                }
                else {
                    this.apiErrorPopupService.display(error);
                }
            };
            SmartSupplyService.prototype.getCartCompleted = function (response, cartId) {
                var cart = response.data;
                this.cartLinesUri = cart.cartLinesUri;
                if (cartId === "current") {
                    this.currentCart = cart;
                    this.currentCartLinesUri = cart.cartLinesUri;
                    this.$rootScope.$broadcast("cartLoaded", cart);
                }
            };
            SmartSupplyService.prototype.getCartParams = function () {
                var params = {};
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (this.forceRecalculation) {
                    params.forceRecalculation = this.forceRecalculation;
                }
                return params;
            };
            SmartSupplyService.prototype.postCartSubscriptionDto = function (cartSubscriptionDto) {
                var _this = this;
                var postUrl = this.serviceUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: cartSubscriptionDto, bypassErrorInterceptor: true }), function (response) { _this.PostCartSubscriptionDTOCompleted(response); }, this.PostCartSubscriptionDTOFailed);
            };
            SmartSupplyService.prototype.PostCartSubscriptionDTOCompleted = function (response) {
            };
            SmartSupplyService.prototype.PostCartSubscriptionDTOFailed = function (error) {
            };
            //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts
            SmartSupplyService.prototype.addLineToSmartSupply = function (product, cartId, configuration, productSubscription, toCurrentCart, showAddToCartPopup) {
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var cartLine = {};
                cartLine.productId = product.id;
                cartLine.qtyOrdered = product.qtyOrdered;
                cartLine.unitOfMeasure = product.unitOfMeasure;
                cartLine.properties = {};
                cartLine.properties["IsSubscriptionOpted"] = "true";
                if (configuration) {
                    cartLine.sectionOptions = configuration; // both contain sectionOptionId
                }
                if (productSubscription) {
                    var productSubscriptionCustomPropertyName = "ProductSubscription";
                    cartLine.properties = {};
                    cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
                }
                return this.addLine(cartLine, cartId, toCurrentCart, false);
            };
            SmartSupplyService.prototype.addLine = function (cartLine, cartId, toCurrentCart, showAddToCartPopup) {
                var _this = this;
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var parsedQty = parseFloat(cartLine.qtyOrdered.toString());
                cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
                var deferred = this.$q.defer();
                var uri = cartId + "/cartlines";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: uri, data: cartLine, bypassErrorInterceptor: true }), function (response) { _this.addLineCompleted(response, showAddToCartPopup); }, this.addLineFailed);
            };
            SmartSupplyService.prototype.addLineCompleted = function (response, showAddToCartPopup) {
                var cartLine = response.data;
                this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
                cartLine.availability = cartLine.availability;
                //this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            SmartSupplyService.prototype.addLineFailed = function (error) {
                //this.getCart();
                this.showCartError(error.data);
            };
            SmartSupplyService.prototype.getSmartSupplyCarts = function (filter, pagination) {
                var uri = this.serviceUriCart;
                if (filter) {
                    uri += "?";
                    for (var property in filter) {
                        if (filter[property]) {
                            uri += property + "=" + filter[property] + "&";
                        }
                    }
                }
                if (pagination) {
                    uri += "page=" + pagination.currentPage + "&pageSize=" + pagination.pageSize;
                }
                uri = uri.replace(/&$/, "");
                //return this.$http({ method: "GET", url: uri, bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } });
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: uri, bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } }), this.getCartsCompleted, this.getCartsFailed);
            };
            SmartSupplyService.prototype.getCartsCompleted = function (response) {
            };
            SmartSupplyService.prototype.getCartsFailed = function (error) {
            };
            SmartSupplyService.$inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService"];
            return SmartSupplyService;
        }());
        smartsupply.SmartSupplyService = SmartSupplyService;
        angular
            .module("insite")
            .service("smartSupplyService", SmartSupplyService);
    })(smartsupply = insite.smartsupply || (insite.smartsupply = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.smart-supply.service.js.map