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
    (function (cart) {
        "use strict";
        var BrasselerOrderConfirmationController = /** @class */ (function (_super) {
            __extends(BrasselerOrderConfirmationController, _super);
            function BrasselerOrderConfirmationController(cartService, promotionService, queryString, orderService, sessionService, settingsService, addToWishlistPopupService) {
                var _this = _super.call(this, cartService, promotionService, queryString, orderService, sessionService, settingsService, addToWishlistPopupService) || this;
                _this.cartService = cartService;
                _this.promotionService = promotionService;
                _this.queryString = queryString;
                _this.orderService = orderService;
                _this.sessionService = sessionService;
                _this.settingsService = settingsService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.isCartSubscribed = false;
                _super.prototype.$onInit.call(_this);
                return _this;
            }
            BrasselerOrderConfirmationController.prototype.getConfirmedCartCompleted = function (confirmedCart) {
                var _this = this;
                this.cart = confirmedCart;
                if (this.cart.creditCardBillingAddress) {
                    this.creditCardBillingAddress = this.cart.creditCardBillingAddress;
                    this.creditCardBillingAddress.state = { abbreviation: this.cart.creditCardBillingAddress.stateAbbreviation };
                    this.creditCardBillingAddress.country = { abbreviation: this.cart.creditCardBillingAddress.countryAbbreviation };
                }
                if (window.hasOwnProperty("dataLayer")) {
                    var data = {
                        "event": "transactionComplete", 'ecommerce': {
                            'purchase': {
                                'actionField': {
                                    "id": confirmedCart.orderNumber,
                                    "affiliation": confirmedCart.billTo.companyName,
                                    "revenue": confirmedCart.orderGrandTotal,
                                    "tax": confirmedCart.totalTax,
                                    "shipping": confirmedCart.shippingAndHandling
                                },
                                "products": []
                            }
                        }
                    };
                    var cartLines = this.cart.cartLines;
                    for (var key in cartLines) {
                        if (cartLines.hasOwnProperty(key)) {
                            var cartLine = cartLines[key];
                            data.ecommerce.purchase.products.push({
                                "id": cartLine.erpNumber,
                                "name": cartLine.shortDescription,
                                "price": cartLine.pricing.unitNetPrice,
                                "quantity": cartLine.qtyOrdered,
                                "variant": cartLine.unitOfMeasure,
                                "brand": "Brasseler"
                            });
                        }
                    }
                    window.dataLayer.push(data);
                    // BUSA-463 : Set Smart Supply Deactivation date a year from the order date.
                    var orderDate = new Date(this.cart.orderDate.toString());
                    var year = orderDate.getFullYear();
                    var month = orderDate.getMonth();
                    var day = orderDate.getDate();
                    var deActivationDate = new Date(year + 1, month, day);
                    this.deactivationDate = deActivationDate;
                    this.nextShipDate = new Date(this.cart.properties["checkoutNextShipDate"]); //BUSA-871 showing next ship date
                    if (this.cart.properties["checkoutNextShipDate"] != undefined) {
                        this.cart.properties["checkoutNextShipDate"] = this.cart.properties["checkoutNextShipDate"].substr(0, 10);
                    }
                }
                this.cart.cartLines.forEach(function (cartline) {
                    if (cartline.isSubscription == true && confirmedCart.properties['subscriptionFrequencyOpted']) {
                        _this.isCartSubscribed = true;
                    }
                });
                this.orderService.getOrder(this.cart.orderNumber, "").then(function (order) { _this.getOrderCompleted(order); }, function (error) { _this.getCartFailed(error); });
                this.promotionService.getCartPromotions(this.cart.id).then(function (promotionCollection) { _this.getCartPromotionsCompleted(promotionCollection); }, function (error) { _this.getCartFailed(error); });
                if (this.cart.properties["subscriptionFrequency"] != null) {
                    this.frequencyMap = JSON.parse(this.cart.properties["subscriptionFrequency"]);
                }
            };
            BrasselerOrderConfirmationController.$inject = ["cartService", "promotionService", "queryString", "orderService", "sessionService", "settingsService", "addToWishlistPopupService"];
            return BrasselerOrderConfirmationController;
        }(cart.OrderConfirmationController));
        cart.BrasselerOrderConfirmationController = BrasselerOrderConfirmationController;
        angular
            .module("insite")
            .controller("OrderConfirmationController", BrasselerOrderConfirmationController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.order-confirmation.controller.js.map