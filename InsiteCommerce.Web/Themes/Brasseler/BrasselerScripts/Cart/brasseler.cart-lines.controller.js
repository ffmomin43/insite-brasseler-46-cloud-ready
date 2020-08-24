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
    var cart;
    (function (cart_1) {
        "use strict";
        var BrasselerCartLinesController = /** @class */ (function (_super) {
            __extends(BrasselerCartLinesController, _super);
            function BrasselerCartLinesController($scope, cartService, productSubscriptionPopupService, addToWishlistPopupService, spinnerService, sessionService, coreService, addressErrorPopupService, apiErrorPopupService, addToCartPopupService, $rootScope, settingsService) {
                var _this = _super.call(this, $scope, cartService, productSubscriptionPopupService, addToWishlistPopupService, spinnerService, settingsService) || this;
                _this.$scope = $scope;
                _this.cartService = cartService;
                _this.productSubscriptionPopupService = productSubscriptionPopupService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.spinnerService = spinnerService;
                _this.sessionService = sessionService;
                _this.coreService = coreService;
                _this.addressErrorPopupService = addressErrorPopupService;
                _this.apiErrorPopupService = apiErrorPopupService;
                _this.addToCartPopupService = addToCartPopupService;
                _this.$rootScope = $rootScope;
                _this.settingsService = settingsService;
                _this.openLineNoteId = "";
                _this.isUpdateInProgress = false;
                _this.testbool = true;
                _this.isNewUser = false;
                _this.newWebShopperCustomerNumber = "1055357";
                _this.invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
                _this.$onInit();
                return _this;
            }
            BrasselerCartLinesController.prototype.init = function () {
                var _this = this;
                _super.prototype.$onInit.call(this);
                if (this.sessionService != undefined) {
                    this.sessionService.getSession().then(function (session) {
                        if (session != null && session != undefined && session.billTo) {
                            if (String(session.billTo.customerNumber).includes(_this.newWebShopperCustomerNumber)) {
                                _this.isNewUser = true;
                            }
                        }
                    });
                }
            };
            BrasselerCartLinesController.prototype.updateLine = function (cartLine, refresh, oldQtyOrdered) {
                var _this = this;
                if (oldQtyOrdered === void 0) { oldQtyOrdered = 1; }
                if (cartLine.qtyOrdered || cartLine.qtyOrdered === 0) {
                    if (refresh) {
                        this.isUpdateInProgress = true;
                    }
                    if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                        this.removeLine(cartLine);
                    }
                    else {
                        this.spinnerService.show();
                        this.cartService.updateLine(cartLine, refresh).then(function (cartLineModel) { _this.updateLineCompleted(cartLineModel); }, function (error) { _this.updateLineFailed(error); });
                    }
                }
                else {
                    cartLine.qtyOrdered = oldQtyOrdered;
                }
                $('.accord-check').prop("checked", false);
            };
            //BUSA-1170 Method to show error popup on Sample validation on cartline update start
            BrasselerCartLinesController.prototype.updateLineFailed = function (error) {
                this.cartService.getCart().then(function (cart) { }, function (error) { });
                this.showCartError(error);
            };
            BrasselerCartLinesController.prototype.showCartError = function (error) {
                var sampleMessage = null;
                if (error.message != null || error.message == "") {
                    sampleMessage = error.message.substring(0, 45);
                }
                if (sampleMessage.includes("Limit Notification") || sampleMessage.includes("Notification de limite")) {
                    this.errorMessage = error.message;
                    var $popup = angular.element("#sampleproduct");
                    this.coreService.displayModal($popup);
                }
            };
            //BUSA-1170 Method to show error popup on Sample validation on cartline update end
            BrasselerCartLinesController.prototype.updateLineSubscription = function (cartLine, refresh, isSubscriptionOpted, oldQtyOrdered) {
                var _this = this;
                if (oldQtyOrdered === void 0) { oldQtyOrdered = 1; }
                if (cartLine.qtyOrdered || cartLine.qtyOrdered === 0) {
                    if (refresh) {
                        this.isUpdateInProgress = true;
                    }
                    if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                        this.removeLine(cartLine);
                    }
                    else {
                        this.spinnerService.show();
                        cartLine.properties["IsSubscriptionOpted"] = isSubscriptionOpted.toString();
                        this.cartService.updateLine(cartLine, refresh).then(function (cartLineModel) { _this.updateLineCompleted(cartLineModel); }, function (error) { _this.updateLineFailed(error); });
                    }
                }
                else {
                    cartLine.qtyOrdered = oldQtyOrdered;
                }
                $('.accord-check').prop("checked", false);
            };
            BrasselerCartLinesController.prototype.updateLineCompleted = function (cartLine) {
                //BUSA-1319: Limit Qty Per Product Popup
                if (cartLine.properties['isQtyAdjusted'] != undefined) {
                    this.addToCartPopupService.display({ isQtyAdjusted: cartLine.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                    this.$rootScope.$broadcast("cartChanged");
                }
            };
            //protected updateLineFailed(error: any): void {
            //}
            BrasselerCartLinesController.prototype.removeLine = function (cartLine) {
                var _this = this;
                this.spinnerService.show();
                this.cartService.removeLine(cartLine).then(function () { _this.removeLineCompleted(cartLine); }, // the cartLine returned from the call will be null if successful, instead, send in the cartLine that was removed
                function (error) { _this.removeLineFailed(error); });
                $('.accord-check').prop("checked", false);
                //********* BUSA-573 
                //Google Tag Manager measuring removeFromCart impressions *****************
                var dataLayer = window.dataLayer = window.dataLayer || [];
                dataLayer.push({
                    'event': 'removeFromCart',
                    'ecommerce': {
                        'remove': {
                            'product': [{
                                    "id": cartLine.productName,
                                    "name": cartLine.shortDescription,
                                    "price": cartLine.pricing.actualPriceDisplay,
                                    "quantity": cartLine.qtyOrdered,
                                    "variant": cartLine.unitOfMeasure,
                                    "brand": "Brasseler"
                                }]
                        }
                    }
                });
            };
            BrasselerCartLinesController.prototype.ShowRelatedProducts = function (cart, cartLine) {
                var _this = this;
                console.log("from showrelatedProd");
                // BUSA-665 : Volume discount group grid is displayed blank on cart page for fraction of seconds.
                this.spinnerService.show();
                var totalGrpQty = this.calculateTotalGrpQty(cart, cartLine);
                cart.properties['getRelatedProducts'] = 'getRelatedProducts';
                cart.properties['grpDescription'] = cartLine.properties['grpDescription'];
                this.cartService.updateCart(cart).then(function (result) {
                    if (result.properties["grpRelatedProduct"] != null) {
                        _this.grpRelatedProducts = JSON.parse(result.properties['grpRelatedProduct']);
                    }
                    _this.calculateRemainingQty(cart, cartLine, totalGrpQty);
                });
            };
            BrasselerCartLinesController.prototype.calculateRemainingQty = function (cart, cartLine, totalGrpQty) {
                this.brkPrices = null;
                this.brkPrices = angular.copy(cartLine.breakPrices);
                this.brkPrices.forEach(function (x) {
                    x.breakQty = x.breakQty - totalGrpQty;
                });
                var count = 0;
                this.brkPrices.forEach(function (x) {
                    if (x.breakQty > 0) {
                        count = count + 1;
                    }
                });
            };
            BrasselerCartLinesController.prototype.calculateTotalGrpQty = function (cart, cartLine) {
                var totalGrpQty = 0.0;
                cart.cartLines.forEach(function (x) {
                    if (x.properties['grpDescription'] != null && x.properties['altCnv'] != null && x.properties['grpDescription'] == cartLine.properties['grpDescription']) {
                        totalGrpQty = totalGrpQty + (Number(x.qtyOrdered) * (+(x.properties['altCnv']))); // BUSA-804 Changes to Volume Discount
                    }
                });
                return totalGrpQty;
            };
            // BUSA-463 : Subscription. Sorting frequency
            BrasselerCartLinesController.prototype.sortFilter = function (input) {
                return parseInt(input.value);
            };
            BrasselerCartLinesController.$inject = [
                "$scope",
                "cartService",
                "productSubscriptionPopupService",
                "addToWishlistPopupService",
                "spinnerService",
                "sessionService",
                "coreService",
                "addressErrorPopupService",
                "apiErrorPopupService",
                "addToCartPopupService",
                "$rootScope",
                "settingsService"
            ];
            return BrasselerCartLinesController;
        }(cart_1.CartLinesController));
        cart_1.BrasselerCartLinesController = BrasselerCartLinesController;
        angular
            .module("insite")
            .controller("CartLinesController", BrasselerCartLinesController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.cart-lines.controller.js.map