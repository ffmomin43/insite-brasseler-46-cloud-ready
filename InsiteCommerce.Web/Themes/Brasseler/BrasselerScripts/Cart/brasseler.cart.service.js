var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var BrasselerCartService = /** @class */ (function () {
            function BrasselerCartService($http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService, coreService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.addressErrorPopupService = addressErrorPopupService;
                this.addToCartPopupService = addToCartPopupService;
                this.apiErrorPopupService = apiErrorPopupService;
                this.httpWrapperService = httpWrapperService;
                this.coreService = coreService;
                this.forceRecalculation = false;
                this.serviceUri = "/api/v1/carts";
                this.cartSettingsUri = "/api/v1/settings/cart";
                //BUSA-463 : Subscription. Add to Smart Supply on first click.
                this.SmartSupplycartLinesUri = "/api/v1/carts/current/cartlines";
                this.cartLinesUri = "";
                this.currentCartLinesUri = "";
                this.currentCart = null;
                this.cartPopupTimeout = 3000;
                this.cartLoadCalled = false;
                this.preventCartLoad = false;
                this.expand = "";
                this.invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
            }
            BrasselerCartService.prototype.getCart = function (cartId, suppressApiErrors) {
                var _this = this;
                if (suppressApiErrors === void 0) { suppressApiErrors = false; }
                if (!cartId) {
                    cartId = "current";
                }
                if (cartId === "current") {
                    this.cartLoadCalled = true;
                }
                var uri = this.serviceUri + "/" + cartId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: uri, params: this.getCartParams(), bypassErrorInterceptor: true }), function (response) { _this.getCartCompleted(response, cartId); }, suppressApiErrors ? this.getCartFailedSuppressErrors : this.getCartFailed);
            };
            BrasselerCartService.prototype.getCartFailedSuppressErrors = function (error) {
            };
            BrasselerCartService.prototype.getCartParams = function () {
                var params = {};
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (this.forceRecalculation) {
                    params.forceRecalculation = this.forceRecalculation;
                }
                return params;
            };
            BrasselerCartService.prototype.getCartCompleted = function (response, cartId) {
                var cart = response.data;
                this.cartLinesUri = cart.cartLinesUri;
                if (cartId === "current") {
                    this.currentCart = cart;
                    this.currentCartLinesUri = cart.cartLinesUri;
                    this.$rootScope.$broadcast("cartLoaded", cart);
                }
            };
            BrasselerCartService.prototype.getCartFailed = function (error) {
                this.showCartError(error.data);
            };
            BrasselerCartService.prototype.showCartError = function (error) {
                if (error.message === this.invalidAddressException) {
                    this.addressErrorPopupService.display(null);
                }
                else {
                    this.apiErrorPopupService.display(error);
                }
            };
            BrasselerCartService.prototype.addSmartSupplyLine = function (cartLine, toCurrentCart, showAddToCartPopup) {
                var _this = this;
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var parsedQty = parseFloat(cartLine.qtyOrdered.toString());
                cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
                var postUrl = toCurrentCart ? this.currentCartLinesUri : this.SmartSupplycartLinesUri; // BUSA-1121 : Add to Smart Supply from PDP, product does not get added to cart in the first click.
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: cartLine, bypassErrorInterceptor: true }), function (response) { _this.addLineCompleted(response, showAddToCartPopup); }, this.addLineFailed);
            };
            BrasselerCartService.prototype.addLineFailed = function (error) {
                this.getCart();
                this.showCartError(error.data);
            };
            BrasselerCartService.prototype.addLineCompleted = function (response, showAddToCartPopup) {
                var cartLine = response.data;
                this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
                //cartLine.availability = cartLine.availability;
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            BrasselerCartService.prototype.addSmartSupplyLineFromProduct = function (product, configuration, productSubscription, toCurrentCart, showAddToCartPopup) {
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
                return this.addSmartSupplyLine(cartLine, toCurrentCart, showAddToCartPopup);
            };
            BrasselerCartService.$inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService", "coreService"];
            return BrasselerCartService;
        }());
        cart_1.BrasselerCartService = BrasselerCartService;
        angular
            .module("insite")
            .service("brasselerCartService", BrasselerCartService);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.cart.service.js.map