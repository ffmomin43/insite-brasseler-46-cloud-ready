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
    var savedorders;
    (function (savedorders) {
        "use strict";
        var BrasselerSavedOrderDetailController = /** @class */ (function (_super) {
            __extends(BrasselerSavedOrderDetailController, _super);
            function BrasselerSavedOrderDetailController(cartService, coreService, spinnerService, settingsService, queryString, addToWishlistPopupService, $scope, $window, addToCartPopupService, $rootScope) {
                var _this = _super.call(this, cartService, coreService, spinnerService, settingsService, queryString, addToWishlistPopupService) || this;
                _this.cartService = cartService;
                _this.coreService = coreService;
                _this.spinnerService = spinnerService;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.addToCartPopupService = addToCartPopupService;
                _this.$rootScope = $rootScope;
                _this.cart = null;
                _this.canAddToCart = false;
                _this.canAddAllToCart = false;
                _this.showInventoryAvailability = false;
                _this.isUpdateInProgress = false;
                _this.init();
                return _this;
            }
            BrasselerSavedOrderDetailController.prototype.init = function () {
                var _this = this;
                //Start : BUSA-695 : Saved orders page should display with updated price if admin updates price list.
                //this.$scope.$on("settingsLoaded", (event, data) => {
                var cartId = this.queryString.get("cartid");
                //BUSA-1130: Saved Order Error, added a boolean parameter "true" after the cartId 
                this.cartService.getCart(cartId, true).then(function (cart) {
                    _this.cart = cart;
                    _this.cart.showTaxAndShipping = true;
                });
                //});
                //End : BUSA-695 : Saved orders page should display with updated price if admin updates price list.
                _super.prototype.$onInit.call(this);
            };
            //BUSA-524 : Saved Orders and Wishlist Pricing update start.
            //updatePrice() {
            //    var cartId = this.coreService.getQueryStringParameter("cartid", true);
            //    this.cartService.getCart(cartId).then(cart => {
            //        this.cart = cart;
            //        this.cart.cartLines.forEach(x=> { this.updateLine(x, true); }
            //            )
            //    });
            //}
            //BUSA-524 : Saved Orders and Wishlist Pricing update end.
            BrasselerSavedOrderDetailController.prototype.addLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerSavedOrderDetailController.prototype.updateLine = function (cartLine, refresh, redirectURI) {
                var _this = this;
                if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                    this.spinnerService.show();
                    if (this.cart.lineCount == 1) {
                        this.cartService.removeCart(this.cart).then(function () {
                            _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                        });
                    }
                    else {
                        // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                        this.cartService.removeLine(cartLine).then(function (result) {
                            _this.init();
                        });
                    }
                }
                else {
                    // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                    this.cartService.updateLine(cartLine, refresh).then(function (result) {
                        // BUSA-1319: Limit Qty Per Product Popup
                        if (result.properties['isQtyAdjusted'] != undefined) {
                            _this.addToCartPopupService.display({ isQtyAdjusted: result.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                            _this.$rootScope.$broadcast("cartChanged");
                        }
                        _super.prototype.$onInit.call(_this);
                    });
                    this.spinnerService.show();
                }
            };
            BrasselerSavedOrderDetailController.prototype.removeLine = function (cartLine, redirectURI) {
                var _this = this;
                if (this.cart.lineCount == 1) {
                    this.cartService.removeCart(this.cart).then(function () {
                        _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                    });
                }
                else {
                    // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                    this.cartService.removeLine(cartLine).then(function (result) {
                        _this.init();
                    });
                    this.spinnerService.show();
                }
            };
            BrasselerSavedOrderDetailController.prototype.quantityKeyPress = function (keyEvent, cartLine) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                    this.spinnerService.show();
                }
            };
            BrasselerSavedOrderDetailController.$inject = [
                "cartService",
                "coreService",
                "spinnerService",
                "settingsService",
                "queryString",
                "addToWishlistPopupService",
                "$scope",
                "$window",
                "addToCartPopupService",
                "$rootScope"
            ];
            return BrasselerSavedOrderDetailController;
        }(savedorders.SavedOrderDetailController));
        savedorders.BrasselerSavedOrderDetailController = BrasselerSavedOrderDetailController;
        angular
            .module("insite")
            .controller("SavedOrderDetailController", BrasselerSavedOrderDetailController);
    })(savedorders = insite.savedorders || (insite.savedorders = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.savedorderdetail.controller.js.map