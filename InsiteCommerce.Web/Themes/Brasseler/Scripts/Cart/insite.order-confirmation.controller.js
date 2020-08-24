var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var OrderConfirmationController = /** @class */ (function () {
            function OrderConfirmationController(cartService, promotionService, queryString, orderService, sessionService, settingsService, addToWishlistPopupService) {
                this.cartService = cartService;
                this.promotionService = promotionService;
                this.queryString = queryString;
                this.orderService = orderService;
                this.sessionService = sessionService;
                this.settingsService = settingsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
            }
            OrderConfirmationController.prototype.$onInit = function () {
                var _this = this;
                var confirmedCartId = this.queryString.get("cartId");
                this.cartService.expand = "cartlines,carriers,creditCardBillingAddress";
                this.cartService.getCart(confirmedCartId).then(function (confirmedCart) { _this.getConfirmedCartCompleted(confirmedCart); }, function (error) { _this.getConfirmedCartFailed(error); });
                // get the current cart to update the mini cart
                this.cartService.expand = "";
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            OrderConfirmationController.prototype.getConfirmedCartCompleted = function (confirmedCart) {
                var _this = this;
                this.cart = confirmedCart;
                if (this.cart.creditCardBillingAddress) {
                    this.creditCardBillingAddress = this.cart.creditCardBillingAddress;
                    this.creditCardBillingAddress.state = { abbreviation: this.cart.creditCardBillingAddress.stateAbbreviation };
                    this.creditCardBillingAddress.country = { abbreviation: this.cart.creditCardBillingAddress.countryAbbreviation };
                }
                if (window.hasOwnProperty("dataLayer")) {
                    var data = {
                        "event": "transactionComplete",
                        "transactionId": this.cart.orderNumber,
                        "transactionAffiliation": this.cart.billTo.companyName,
                        "transactionTotal": this.cart.orderGrandTotal,
                        "transactionTax": this.cart.totalTax,
                        "transactionShipping": this.cart.shippingAndHandling,
                        "transactionProducts": []
                    };
                    var cartLines = this.cart.cartLines;
                    for (var key in cartLines) {
                        if (cartLines.hasOwnProperty(key)) {
                            var cartLine = cartLines[key];
                            data.transactionProducts.push({
                                "sku": cartLine.erpNumber,
                                "name": cartLine.shortDescription,
                                "price": cartLine.pricing.unitNetPrice,
                                "quantity": cartLine.qtyOrdered
                            });
                        }
                    }
                    window.dataLayer.push(data);
                }
                this.orderService.getOrder(this.cart.orderNumber, "").then(function (order) { _this.getOrderCompleted(order); }, function (error) { _this.getCartFailed(error); });
                this.promotionService.getCartPromotions(this.cart.id).then(function (promotionCollection) { _this.getCartPromotionsCompleted(promotionCollection); }, function (error) { _this.getCartFailed(error); });
            };
            OrderConfirmationController.prototype.getConfirmedCartFailed = function (error) {
            };
            OrderConfirmationController.prototype.getOrderCompleted = function (orderHistory) {
                this.order = orderHistory;
            };
            OrderConfirmationController.prototype.getOrderFailed = function (error) {
            };
            OrderConfirmationController.prototype.getCartPromotionsCompleted = function (promotionCollection) {
                this.promotions = promotionCollection.promotions;
            };
            OrderConfirmationController.prototype.getCartPromotionsFailed = function (error) {
            };
            OrderConfirmationController.prototype.getCartCompleted = function (cart) {
                this.showRfqMessage = cart.canRequestQuote && cart.quoteRequiredCount > 0;
            };
            OrderConfirmationController.prototype.getCartFailed = function (error) {
            };
            OrderConfirmationController.prototype.getSessionCompleted = function (session) {
                this.isGuestUser = session.isAuthenticated && session.isGuest;
            };
            OrderConfirmationController.prototype.getSessionFailed = function (error) {
            };
            OrderConfirmationController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
            };
            OrderConfirmationController.prototype.getSettingsFailed = function (error) {
            };
            OrderConfirmationController.prototype.openWishListPopup = function () {
                var products = this.cart.cartLines
                    .filter(function (o) { return o.canAddToWishlist; })
                    .map(function (o) { return ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure }); });
                this.addToWishlistPopupService.display(products);
            };
            OrderConfirmationController.$inject = ["cartService", "promotionService", "queryString", "orderService", "sessionService", "settingsService", "addToWishlistPopupService"];
            return OrderConfirmationController;
        }());
        cart_1.OrderConfirmationController = OrderConfirmationController;
        angular
            .module("insite")
            .controller("OrderConfirmationController", OrderConfirmationController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-confirmation.controller.js.map