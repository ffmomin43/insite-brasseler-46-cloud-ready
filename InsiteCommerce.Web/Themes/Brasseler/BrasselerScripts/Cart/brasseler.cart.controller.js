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
        var BrasselerCartController = /** @class */ (function (_super) {
            __extends(BrasselerCartController, _super);
            function BrasselerCartController($scope, cartService, promotionService, settingsService, coreService, $localStorage, addToWishlistPopupService, spinnerService, sessionService) {
                var _this = _super.call(this, $scope, cartService, promotionService, settingsService, coreService, $localStorage, addToWishlistPopupService, spinnerService, sessionService) || this;
                _this.$scope = $scope;
                _this.cartService = cartService;
                _this.promotionService = promotionService;
                _this.settingsService = settingsService;
                _this.coreService = coreService;
                _this.$localStorage = $localStorage;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.spinnerService = spinnerService;
                _this.sessionService = sessionService;
                _this.isCartSubscribed = "";
                return _this;
            }
            BrasselerCartController.prototype.displayCart = function (cart) {
                var _this = this;
                this.cart = cart;
                //BUSA-842:"Punch-out" button should be grey out and unclick able when cart consists of out of stock products.
                if (this.cart.hasInsufficientInventory) {
                    $("#btnCartCheckoutPunchout").attr("style", "cursor: not-allowed;pointer-events: none");
                    $("#btnCartCheckoutPunchout").addClass("disabled");
                }
                else {
                    $("#btnCartCheckoutPunchout").removeClass("disabled");
                    $("#btnCartCheckoutPunchout").removeAttr("style");
                }
                this.canAddAllToList = this.cart.cartLines.every(function (l) { return l.canAddToWishlist; });
                this.promotionService.getCartPromotions(this.cart.id).then(function (promotionCollection) { _this.getCartPromotionsCompleted(promotionCollection); }, function (error) { _this.getCartPromotionsFailed(error); });
            };
            BrasselerCartController.prototype.continueCheckout = function (url) {
                window.location.href = url;
                //Google Tag Manager measuring cart checkout *****************
                var dataLayer = window.dataLayer = window.dataLayer || [];
                dataLayer.push({
                    'event': 'checkout',
                    'ecommerce': {
                        'checkout': {
                            'actionField': { 'step': 1, 'option': 'cart Checkout' },
                            'cart': [{
                                    'price': this.cart.totalCountDisplay,
                                    'quantity': this.cart.totalQtyOrdered,
                                    'brand': 'Brasseler',
                                }]
                        }
                    },
                    'eventCallback': function () {
                        document.location = url;
                    }
                });
            };
            BrasselerCartController.$inject = [
                "$scope",
                "cartService",
                "promotionService",
                "settingsService",
                "coreService",
                "$localStorage",
                "addToWishlistPopupService",
                "spinnerService",
                "sessionService"
            ];
            return BrasselerCartController;
        }(cart_1.CartController));
        cart_1.BrasselerCartController = BrasselerCartController;
        angular
            .module("insite")
            .controller("CartController", BrasselerCartController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.cart.controller.js.map