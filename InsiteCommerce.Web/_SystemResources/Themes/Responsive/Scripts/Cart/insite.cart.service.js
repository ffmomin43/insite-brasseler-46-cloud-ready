var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var CartService = /** @class */ (function () {
            function CartService($http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.addressErrorPopupService = addressErrorPopupService;
                this.addToCartPopupService = addToCartPopupService;
                this.apiErrorPopupService = apiErrorPopupService;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/carts";
                this.cartSettingsUri = "/api/v1/settings/cart";
                this.realTimeInventoryUri = "/api/v1/realtimeinventory";
                this.cartLinesUri = "";
                this.currentCartLinesUri = "";
                this.cartLoadCalled = false;
                this.expand = "";
                this.alsoPurchasedMaxResults = 0;
                this.forceRecalculation = false;
                this.allowInvalidAddress = false;
                this.currentCart = null;
                this.invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
            }
            // returns the current cart if it is already loaded
            CartService.prototype.getLoadedCurrentCart = function () {
                return this.currentCart;
            };
            CartService.prototype.getCarts = function (filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getCartsParams(filter, pagination) }), this.getCartsCompleted, this.getCartsFailed);
            };
            CartService.prototype.getCartsParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            CartService.prototype.getCartsCompleted = function (response) {
            };
            CartService.prototype.getCartsFailed = function (error) {
            };
            CartService.prototype.getCart = function (cartId, suppressApiErrors) {
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
            CartService.prototype.getCartParams = function () {
                var params = {};
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (this.alsoPurchasedMaxResults) {
                    params.alsoPurchasedMaxResults = this.alsoPurchasedMaxResults;
                }
                if (this.forceRecalculation) {
                    params.forceRecalculation = this.forceRecalculation;
                }
                if (this.allowInvalidAddress) {
                    params.allowInvalidAddress = this.allowInvalidAddress;
                }
                return params;
            };
            CartService.prototype.getCartCompleted = function (response, cartId) {
                var cart = response.data;
                this.cartLinesUri = cart.cartLinesUri;
                if (cartId === "current") {
                    this.currentCart = cart;
                    this.currentCartLinesUri = cart.cartLinesUri;
                    this.$rootScope.$broadcast("cartLoaded", cart);
                }
            };
            CartService.prototype.getCartFailedSuppressErrors = function (error) {
            };
            CartService.prototype.getCartFailed = function (error) {
                this.showCartError(error.data);
            };
            CartService.prototype.showCartError = function (error) {
                if (error.message === this.invalidAddressException) {
                    this.addressErrorPopupService.display(null);
                }
                else {
                    this.apiErrorPopupService.display(error);
                }
            };
            CartService.prototype.updateCart = function (cart, suppressApiErrors) {
                if (suppressApiErrors === void 0) { suppressApiErrors = false; }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: cart.uri, data: cart }), this.updateCartCompleted, suppressApiErrors ? this.updateCartFailedSuppressErrors : this.updateCartFailed);
            };
            CartService.prototype.updateCartCompleted = function (response) {
            };
            CartService.prototype.updateCartFailedSuppressErrors = function (error) {
            };
            CartService.prototype.updateCartFailed = function (error) {
                this.showCartError(error.data);
            };
            CartService.prototype.saveCart = function (cart) {
                cart.status = "Saved";
                return this.updateCart(cart);
            };
            CartService.prototype.submitRequisition = function (cart) {
                cart.status = "RequisitionSubmitted";
                return this.updateCart(cart);
            };
            CartService.prototype.removeCart = function (cart) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(cart.uri), this.removeCartCompleted, this.removeCartFailed);
            };
            CartService.prototype.removeCartCompleted = function (response) {
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.removeCartFailed = function (error) {
            };
            CartService.prototype.addLine = function (cartLine, toCurrentCart, showAddToCartPopup) {
                var _this = this;
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var parsedQty = parseFloat(cartLine.qtyOrdered.toString());
                cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
                var postUrl = toCurrentCart ? this.currentCartLinesUri : this.cartLinesUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: cartLine, bypassErrorInterceptor: true }), function (response) { _this.addLineCompleted(response, showAddToCartPopup); }, this.addLineFailed);
            };
            CartService.prototype.addLineCompleted = function (response, showAddToCartPopup) {
                var cartLine = response.data;
                this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
                cartLine.availability = cartLine.availability;
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.addLineFailed = function (error) {
                this.getCart();
                this.showCartError(error.data);
            };
            CartService.prototype.addLineFromProduct = function (product, configuration, productSubscription, toCurrentCart, showAddToCartPopup) {
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var cartLine = {};
                cartLine.productId = product.id;
                cartLine.qtyOrdered = product.qtyOrdered;
                cartLine.unitOfMeasure = product.unitOfMeasure;
                if (configuration) {
                    cartLine.sectionOptions = configuration; // both contain sectionOptionId
                }
                if (productSubscription) {
                    var productSubscriptionCustomPropertyName = "ProductSubscription";
                    cartLine.properties = {};
                    cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
                }
                return this.addLine(cartLine, toCurrentCart, showAddToCartPopup);
            };
            CartService.prototype.addLineCollection = function (cartLines, toCurrentCart, showAddToCartPopup) {
                var _this = this;
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var cartLineCollection = { cartLines: cartLines };
                cartLineCollection.cartLines.forEach(function (line) {
                    var parsedQty = parseFloat(line.qtyOrdered.toString());
                    line.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
                });
                var postUrl = toCurrentCart ? this.currentCartLinesUri : this.cartLinesUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl + "/batch", data: cartLineCollection, bypassErrorInterceptor: true }), function (response) { _this.addLineCollectionCompleted(response, showAddToCartPopup); }, this.addLineCollectionFailed);
            };
            CartService.prototype.addLineCollectionCompleted = function (response, showAddToCartPopup) {
                var cartLineCollection = response.data;
                var isQtyAdjusted = cartLineCollection.cartLines.some(function (line) {
                    return line.isQtyAdjusted;
                });
                this.addToCartPopupService.display({ isAddAll: true, isQtyAdjusted: isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.addLineCollectionFailed = function (error) {
                this.showCartError(error.data);
            };
            CartService.prototype.addLineCollectionFromProducts = function (products, toCurrentCart, showAddToCartPopup) {
                if (toCurrentCart === void 0) { toCurrentCart = false; }
                var cartLineCollection = [];
                angular.forEach(products, function (product) {
                    cartLineCollection.push({
                        productId: product.id,
                        qtyOrdered: product.qtyOrdered,
                        unitOfMeasure: product.selectedUnitOfMeasure
                    });
                });
                return this.addLineCollection(cartLineCollection, toCurrentCart, showAddToCartPopup);
            };
            CartService.prototype.addWishListToCart = function (wishListId, showAddToCartPopup, data) {
                var _this = this;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.currentCartLinesUri + "/wishlist/" + wishListId, data: data, bypassErrorInterceptor: true }), function (response) { _this.addWishListToCartCompleted(response, showAddToCartPopup); }, this.addWishListToCartFailed);
            };
            CartService.prototype.addWishListToCartCompleted = function (response, showAddToCartPopup) {
                var cartLineCollection = response.data;
                var isQtyAdjusted = cartLineCollection.cartLines.some(function (line) {
                    return line.isQtyAdjusted;
                });
                this.addToCartPopupService.display({ isAddAll: true, notAllAdded: cartLineCollection.notAllAddedToCart, isQtyAdjusted: isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.addWishListToCartFailed = function (error) {
                this.showCartError(error.data);
            };
            CartService.prototype.updateLine = function (cartLine, refresh) {
                var _this = this;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: cartLine.uri, data: cartLine }), function (response) { _this.updateLineCompleted(response, refresh); }, this.updateLineFailed);
            };
            CartService.prototype.updateLineCompleted = function (response, refresh) {
                if (refresh) {
                    this.getCart();
                    this.$rootScope.$broadcast("cartChanged");
                }
            };
            CartService.prototype.updateLineFailed = function (error) {
            };
            CartService.prototype.removeLine = function (cartLine) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(cartLine.uri), this.removeLineCompleted, this.removeLineFailed);
            };
            CartService.prototype.removeLineCompleted = function (response) {
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.removeLineFailed = function (error) {
            };
            CartService.prototype.removeLineCollection = function (cart) {
                var uri = cart.uri + "/cartlines";
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(uri), this.removeLineCollectionCompleted, this.removeLineCollectionFailed);
            };
            CartService.prototype.removeLineCollectionCompleted = function (response) {
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            };
            CartService.prototype.removeLineCollectionFailed = function (error) {
            };
            CartService.prototype.getRealTimeInventory = function (cart) {
                var _this = this;
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.realTimeInventoryUri, this.getRealTimeInventoryParams(cart.cartLines)), function (response) { _this.getRealTimeInventoryCompleted(response, cart); }, this.getProductRealTimeInventoryFailed);
            };
            CartService.prototype.getRealTimeInventoryParams = function (cartLines) {
                var productIds = new Array();
                cartLines.forEach(function (cartLine) {
                    if (productIds.indexOf(cartLine.productId) === -1) {
                        productIds.push(cartLine.productId);
                    }
                });
                return {
                    productIds: productIds
                };
            };
            CartService.prototype.getRealTimeInventoryCompleted = function (response, cart) {
                cart.cartLines.forEach(function (cartLine) {
                    var productInventory = response.data.realTimeInventoryResults.find(function (productInventory) { return productInventory.productId === cartLine.productId; });
                    if (productInventory) {
                        cartLine.qtyOnHand = productInventory.qtyOnHand;
                        var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(function (o) { return o.unitOfMeasure === cartLine.unitOfMeasure; });
                        if (inventoryAvailability) {
                            cartLine.availability = inventoryAvailability.availability;
                            if (!cart.hasInsufficientInventory && !cartLine.canBackOrder && !cartLine.quoteRequired && inventoryAvailability.availability.messageType == 2) {
                                cart.hasInsufficientInventory = true;
                            }
                        }
                        else {
                            cartLine.availability = { messageType: 0 };
                        }
                    }
                    else {
                        cartLine.availability = { messageType: 0 };
                    }
                });
            };
            CartService.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            CartService.$inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService"];
            return CartService;
        }());
        cart_1.CartService = CartService;
        angular
            .module("insite")
            .service("cartService", CartService);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cart.service.js.map