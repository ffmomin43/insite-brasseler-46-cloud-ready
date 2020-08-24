var insite;
(function (insite) {
    var savedorders;
    (function (savedorders) {
        "use strict";
        var SavedOrderDetailController = /** @class */ (function () {
            function SavedOrderDetailController(cartService, coreService, spinnerService, settingsService, queryString, addToWishlistPopupService) {
                this.cartService = cartService;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.cart = null;
                this.canAddToCart = false;
                this.canAddAllToCart = false;
                this.showInventoryAvailability = false;
                this.requiresRealTimeInventory = false;
                this.failedToGetRealTimeInventory = false;
                this.canAddAllToList = false;
            }
            SavedOrderDetailController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.cartService.expand = "cartlines,costcodes,hiddenproducts";
                this.cartService.getCart(this.queryString.get("cartid"), true).then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            SavedOrderDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.showInventoryAvailability = settingsCollection.productSettings.showInventoryAvailability;
                this.requiresRealTimeInventory = settingsCollection.productSettings.realTimeInventory;
            };
            SavedOrderDetailController.prototype.getSettingsFailed = function (error) {
            };
            SavedOrderDetailController.prototype.getCartCompleted = function (cart) {
                this.cartService.expand = "";
                this.cart = cart;
                this.cart.showTaxAndShipping = false;
                this.canAddAllToList = this.cart.cartLines.every(function (l) { return l.canAddToWishlist; });
                this.canAddToCart = this.cart.cartLines.some(this.canAddCartLineToCart);
                this.canAddAllToCart = this.cart.cartLines.every(this.canAddCartLineToCart);
                this.getRealTimeInventory();
            };
            SavedOrderDetailController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
                this.coreService.redirectToPath(this.listPageUri);
            };
            SavedOrderDetailController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.requiresRealTimeInventory) {
                    this.cartService.getRealTimeInventory(this.cart).then(function (realTimeInventory) { return _this.getRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getRealTimeInventoryFailed(error); });
                }
            };
            SavedOrderDetailController.prototype.getRealTimeInventoryCompleted = function (realTimeInventory) {
            };
            SavedOrderDetailController.prototype.getRealTimeInventoryFailed = function (error) {
                this.failedToGetRealTimeInventory = true;
            };
            SavedOrderDetailController.prototype.addAllToList = function () {
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
            SavedOrderDetailController.prototype.placeSavedOrder = function (cartUri) {
                var _this = this;
                var availableLines = this.cart.cartLines.filter(this.canAddCartLineToCart);
                if (availableLines.length <= 0) {
                    return;
                }
                this.spinnerService.show();
                this.cartService.addLineCollection(availableLines, true, false).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection, cartUri); }, function (error) { _this.addLineCollectionFailed(error); });
            };
            SavedOrderDetailController.prototype.addLineCollectionCompleted = function (cartLineCollection, cartUri) {
                var _this = this;
                var currentCart = this.cartService.getLoadedCurrentCart();
                if (!currentCart.notes) {
                    currentCart.notes = this.cart.notes;
                }
                if (!currentCart.requestedDeliveryDate) {
                    currentCart.requestedDeliveryDate = this.cart.requestedDeliveryDate;
                }
                if (!currentCart.poNumber) {
                    currentCart.poNumber = this.cart.poNumber;
                }
                this.cartService.updateCart(currentCart).then(function (cart) { _this.placeSavedOrderCompleted(cart, cartUri); }, function (error) { _this.placeSavedOrderFailed(error); });
            };
            SavedOrderDetailController.prototype.addLineCollectionFailed = function (error) {
            };
            SavedOrderDetailController.prototype.placeSavedOrderCompleted = function (cart, cartUri) {
                this.deleteSavedOrder(cartUri);
            };
            SavedOrderDetailController.prototype.placeSavedOrderFailed = function (error) {
            };
            SavedOrderDetailController.prototype.deleteSavedOrder = function (redirectUri) {
                var _this = this;
                this.cartService.removeCart(this.cart).then(function (cart) { _this.deleteSavedOrderCompleted(cart, redirectUri); }, function (error) { _this.deleteSavedOrderFailed(error); });
            };
            SavedOrderDetailController.prototype.deleteSavedOrderCompleted = function (cart, redirectUri) {
                this.coreService.redirectToPath(redirectUri);
            };
            SavedOrderDetailController.prototype.deleteSavedOrderFailed = function (error) {
            };
            SavedOrderDetailController.prototype.canAddCartLineToCart = function (cartLine) {
                return cartLine.canAddToCart && (cartLine.availability.messageType !== 2 || cartLine.canBackOrder);
            };
            SavedOrderDetailController.$inject = ["cartService", "coreService", "spinnerService", "settingsService", "queryString", "addToWishlistPopupService"];
            return SavedOrderDetailController;
        }());
        savedorders.SavedOrderDetailController = SavedOrderDetailController;
        angular
            .module("insite")
            .controller("SavedOrderDetailController", SavedOrderDetailController);
    })(savedorders = insite.savedorders || (insite.savedorders = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.saved-order-detail.controller.js.map