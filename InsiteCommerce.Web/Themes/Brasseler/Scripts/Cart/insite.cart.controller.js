var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var CartController = /** @class */ (function () {
            function CartController($scope, cartService, promotionService, settingsService, coreService, $localStorage, addToWishlistPopupService, spinnerService, sessionService) {
                this.$scope = $scope;
                this.cartService = cartService;
                this.promotionService = promotionService;
                this.settingsService = settingsService;
                this.coreService = coreService;
                this.$localStorage = $localStorage;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.spinnerService = spinnerService;
                this.sessionService = sessionService;
                this.showInventoryAvailability = false;
                this.productsCannotBePurchased = false;
                this.requiresRealTimeInventory = false;
                this.failedToGetRealTimeInventory = false;
                this.canAddAllToList = false;
                this.requisitionSubmitting = false;
                this.enableWarehousePickup = false;
            }
            CartController.prototype.$onInit = function () {
                this.initEvents();
                this.cartService.cartLoadCalled = true; // prevents request race
            };
            CartController.prototype.initEvents = function () {
                var _this = this;
                this.$scope.$on("cartChanged", function (event) { return _this.onCartChanged(event); });
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            CartController.prototype.onCartChanged = function (event) {
                this.getCart();
            };
            CartController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.cartSettings;
                this.showInventoryAvailability = settingsCollection.productSettings.showInventoryAvailability;
                this.requiresRealTimeInventory = settingsCollection.productSettings.realTimeInventory;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                this.getCart();
            };
            CartController.prototype.getSettingsFailed = function (error) {
            };
            CartController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.fulfillmentMethod = session.fulfillmentMethod;
                this.pickUpWarehouse = session.pickUpWarehouse;
            };
            CartController.prototype.getSessionFailed = function (error) {
            };
            CartController.prototype.onSessionUpdated = function (session) {
                this.fulfillmentMethod = session.fulfillmentMethod;
                this.pickUpWarehouse = session.pickUpWarehouse;
                this.getCart();
            };
            CartController.prototype.getCart = function () {
                var _this = this;
                this.cartService.expand = "cartlines,costcodes,hiddenproducts";
                if (this.settings.showTaxAndShipping) {
                    this.cartService.expand += ",shipping,tax";
                    this.cartService.allowInvalidAddress = true;
                }
                var hasRestrictedProducts = this.$localStorage.get("hasRestrictedProducts");
                if (hasRestrictedProducts === true.toString()) {
                    this.cartService.expand += ",restrictions";
                }
                this.spinnerService.show();
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            CartController.prototype.getCartCompleted = function (cart) {
                this.cartService.expand = "";
                this.failedToGetRealTimeInventory = cart.failedToGetRealTimeInventory;
                this.cartService.allowInvalidAddress = false;
                if (!cart.cartLines.some(function (o) { return o.isRestricted || !o.isActive; })) {
                    this.$localStorage.remove("hasRestrictedProducts");
                    this.productsCannotBePurchased = false;
                }
                else {
                    this.productsCannotBePurchased = true;
                }
                this.displayCart(cart);
                this.cartIdParam = this.cart.id === "current" ? "" : "?cartId=" + this.cart.id;
            };
            CartController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
                this.cartService.allowInvalidAddress = false;
            };
            CartController.prototype.displayCart = function (cart) {
                var _this = this;
                this.cart = cart;
                this.canAddAllToList = this.cart.cartLines.every(function (l) { return l.canAddToWishlist; });
                this.promotionService.getCartPromotions(this.cart.id).then(function (promotionCollection) { _this.getCartPromotionsCompleted(promotionCollection); }, function (error) { _this.getCartPromotionsFailed(error); });
            };
            CartController.prototype.getCartPromotionsCompleted = function (promotionCollection) {
                this.promotions = promotionCollection.promotions;
            };
            CartController.prototype.getCartPromotionsFailed = function (error) {
            };
            CartController.prototype.emptyCart = function (emptySuccessUri) {
                var _this = this;
                this.cartService.removeLineCollection(this.cart).then(function () { _this.emptyCartCompleted(); }, function (error) { _this.emptyCartFailed(error); });
            };
            CartController.prototype.emptyCartCompleted = function () {
            };
            CartController.prototype.emptyCartFailed = function (error) {
            };
            CartController.prototype.saveCart = function (saveSuccessUri, signInUri) {
                var _this = this;
                if (!this.cart.isAuthenticated || this.cart.isGuestOrder) {
                    this.coreService.redirectToPath(signInUri + "?returnUrl=" + this.coreService.getCurrentPath());
                    return;
                }
                this.cartService.saveCart(this.cart).then(function (cart) { return _this.saveCartCompleted(saveSuccessUri, cart); }, function (error) { _this.saveCartFailed(error); });
            };
            CartController.prototype.saveCartCompleted = function (saveSuccessUri, cart) {
                this.cartService.getCart();
                if (cart.id !== "current") {
                    this.coreService.redirectToPath(saveSuccessUri + "?cartid=" + cart.id);
                }
            };
            CartController.prototype.saveCartFailed = function (error) {
            };
            CartController.prototype.addAllToList = function () {
                var products = [];
                for (var i = 0; i < this.cart.cartLines.length; i++) {
                    var cartLine = this.cart.cartLines[i];
                    if (!cartLine.canAddToWishlist) {
                        continue;
                    }
                    var product = {
                        id: cartLine.productId,
                        qtyOrdered: cartLine.qtyOrdered,
                        selectedUnitOfMeasure: cartLine.unitOfMeasure
                    };
                    products.push(product);
                }
                this.addToWishlistPopupService.display(products);
            };
            CartController.prototype.submitRequisition = function (submitRequisitionSuccessUri) {
                var _this = this;
                if (this.requisitionSubmitting) {
                    return;
                }
                this.requisitionSubmitting = true;
                this.cart.status = "RequisitionSubmitted";
                this.cartService.submitRequisition(this.cart).then(function (cart) { return _this.submitRequisitionCompleted(submitRequisitionSuccessUri, cart); }, function (error) { _this.submitRequisitionFailed(error); });
            };
            CartController.prototype.submitRequisitionCompleted = function (submitRequisitionSuccessUri, cart) {
                this.cartService.getCart();
                this.coreService.redirectToPath(submitRequisitionSuccessUri);
                this.requisitionSubmitting = false;
            };
            CartController.prototype.submitRequisitionFailed = function (error) {
                this.requisitionSubmitting = false;
            };
            CartController.prototype.continueShopping = function ($event) {
                var referrer = this.coreService.getReferringPath();
                if (typeof (referrer) !== "undefined" && referrer !== null) {
                    $event.preventDefault();
                    this.coreService.redirectToPath(referrer);
                }
            };
            CartController.$inject = ["$scope", "cartService", "promotionService", "settingsService", "coreService", "$localStorage", "addToWishlistPopupService", "spinnerService", "sessionService"];
            return CartController;
        }());
        cart_1.CartController = CartController;
        angular
            .module("insite")
            .controller("CartController", CartController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cart.controller.js.map