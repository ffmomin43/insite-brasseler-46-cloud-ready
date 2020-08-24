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
    var orderapproval;
    (function (orderapproval) {
        "use strict";
        var BrasselerOrderApprovalDetailController = /** @class */ (function (_super) {
            __extends(BrasselerOrderApprovalDetailController, _super);
            function BrasselerOrderApprovalDetailController(orderApprovalService, cartService, accountService, coreService, queryString, spinnerService, $window, promotionService, addToCartPopupService, $rootScope) {
                var _this = _super.call(this, orderApprovalService, cartService, accountService, coreService, queryString) || this;
                _this.orderApprovalService = orderApprovalService;
                _this.cartService = cartService;
                _this.accountService = accountService;
                _this.coreService = coreService;
                _this.queryString = queryString;
                _this.spinnerService = spinnerService;
                _this.$window = $window;
                _this.promotionService = promotionService;
                _this.addToCartPopupService = addToCartPopupService;
                _this.$rootScope = $rootScope;
                return _this;
            }
            //BUSA-1038 Removed init() and added SS params for DBConcurrency
            BrasselerOrderApprovalDetailController.prototype.orderApprovalServiceGetCartCompleted = function (cart) {
                this.cart = cart;
                this.canApproveOrders();
                if (this.cart.properties["subscriptionFrequency"] != null) {
                    this.frequencyMap = JSON.parse(this.cart.properties["subscriptionFrequency"]);
                    this.optedFrequency = this.cart.properties['subscriptionFrequencyOpted'];
                }
                if (this.promotionService != undefined) {
                    this.getPromotions(this.cart.id);
                }
            };
            BrasselerOrderApprovalDetailController.prototype.getCartPromotionsCompleted = function (promotionCollection) {
                this.promotions = promotionCollection.promotions;
            };
            BrasselerOrderApprovalDetailController.prototype.getCartPromotionsFailed = function (error) {
            };
            BrasselerOrderApprovalDetailController.prototype.updateCartFailed = function (error) {
                this.approveOrderErrorMessage = error.message;
                this.$window.scrollTo(0, 0);
            };
            BrasselerOrderApprovalDetailController.prototype.getPromotions = function (cartId) {
                var _this = this;
                this.promotionService.getCartPromotions(cartId).then(function (promotionCollection) { _this.getCartPromotionsCompleted(promotionCollection); }, function (error) { _this.getCartPromotionsFailed(error); });
            };
            BrasselerOrderApprovalDetailController.prototype.update = function () {
                var _this = this;
                var cartId = this.queryString.get("cartid");
                this.orderApprovalService.getCart(cartId).then(function (cart) {
                    _this.cart = cart;
                    _this.getPromotions(cartId);
                    _this.canApproveOrders();
                });
                this.initEvents();
            };
            BrasselerOrderApprovalDetailController.prototype.updateLine = function (cartLine, refresh, redirectURI) {
                var _this = this;
                if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                    if (this.cart.lineCount == 1) {
                        this.cartService.removeCart(this.cart).then(function () {
                            _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                        });
                    }
                    else {
                        this.cartService.removeLine(cartLine).then(function (result) {
                            _this.spinnerService.show();
                            _this.update();
                        });
                        this.spinnerService.show();
                    }
                }
                else {
                    this.cartService.updateLine(cartLine, refresh).then(function (result) {
                        // BUSA-1319: Limit Qty Per Product Popup
                        if (result.properties['isQtyAdjusted'] != undefined) {
                            _this.addToCartPopupService.display({ isQtyAdjusted: result.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                            _this.$rootScope.$broadcast("cartChanged");
                        }
                        _this.spinnerService.show();
                        _this.approveOrderErrorMessage = null;
                        _this.update();
                    }, function (error) { _this.updateLineFailed(error); });
                    this.spinnerService.show();
                }
            };
            BrasselerOrderApprovalDetailController.prototype.updateLineFailed = function (error) {
                this.approveOrderErrorMessage = error.message;
            };
            BrasselerOrderApprovalDetailController.prototype.removeLine = function (cartLine, redirectURI) {
                var _this = this;
                if (this.cart.lineCount == 1) {
                    this.cartService.removeCart(this.cart).then(function () {
                        _this.$window.location.href = redirectURI + "?returnUrl=" + _this.$window.location.href;
                    });
                }
                else {
                    this.cartService.removeLine(cartLine).then(function (result) {
                        _this.spinnerService.show();
                        _this.update();
                    });
                    this.spinnerService.show();
                }
            };
            BrasselerOrderApprovalDetailController.prototype.quantityKeyPress = function (keyEvent, cartLine) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                    this.spinnerService.show();
                }
            };
            BrasselerOrderApprovalDetailController.prototype.cancelOrder = function (redirectUri) {
                var _this = this;
                this.cartService.removeCart(this.cart).then(function () {
                    _this.$window.location.href = redirectUri;
                });
            };
            BrasselerOrderApprovalDetailController.$inject = ["orderApprovalService", "cartService", "accountService", "coreService", "queryString", "spinnerService", "$window", "promotionService", "addToCartPopupService", "$rootScope"];
            return BrasselerOrderApprovalDetailController;
        }(orderapproval.OrderApprovalDetailController));
        orderapproval.BrasselerOrderApprovalDetailController = BrasselerOrderApprovalDetailController;
        angular
            .module("insite")
            .controller("OrderApprovalDetailController", BrasselerOrderApprovalDetailController);
    })(orderapproval = insite.orderapproval || (insite.orderapproval = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.order-approval-detail.controller.js.map