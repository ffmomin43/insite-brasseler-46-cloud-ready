var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var CartLinesController = /** @class */ (function () {
            function CartLinesController($scope, cartService, productSubscriptionPopupService, addToWishlistPopupService, spinnerService, settingsService) {
                this.$scope = $scope;
                this.cartService = cartService;
                this.productSubscriptionPopupService = productSubscriptionPopupService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.spinnerService = spinnerService;
                this.settingsService = settingsService;
                this.openLineNoteId = "";
                this.isUpdateInProgress = false;
            }
            CartLinesController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("cartLoaded", function (event, cart) { return _this.onCartLoaded(event, cart); });
                this.$scope.$on("updateProductSubscription", function (event, productSubscription, product, cartLine) {
                    return _this.onUpdateProductSubscription(event, productSubscription, product, cartLine);
                });
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
            };
            CartLinesController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
            };
            CartLinesController.prototype.getSettingsFailed = function (error) {
            };
            CartLinesController.prototype.onCartLoaded = function (event, cart) {
                this.isUpdateInProgress = false;
            };
            CartLinesController.prototype.onUpdateProductSubscription = function (event, productSubscription, product, cartLine) {
                var productSubscriptionCustomPropertyName = "ProductSubscription";
                cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
                this.updateLine(cartLine, true);
            };
            CartLinesController.prototype.updateLine = function (cartLine, refresh, oldQtyOrdered) {
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
            };
            CartLinesController.prototype.updateLineCompleted = function (cartLine) {
            };
            CartLinesController.prototype.updateLineFailed = function (error) {
            };
            CartLinesController.prototype.removeLine = function (cartLine) {
                var _this = this;
                this.spinnerService.show();
                this.cartService.removeLine(cartLine).then(function () { _this.removeLineCompleted(cartLine); }, // the cartLine returned from the call will be null if successful, instead, send in the cartLine that was removed
                function (error) { _this.removeLineFailed(error); });
            };
            CartLinesController.prototype.removeLineCompleted = function (cartLine) {
            };
            CartLinesController.prototype.removeLineFailed = function (error) {
            };
            CartLinesController.prototype.quantityKeyPress = function (keyEvent, cartLine) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                }
            };
            CartLinesController.prototype.notesKeyPress = function (keyEvent, cartLine) {
                if (keyEvent.which === 13) {
                    this.updateLine(cartLine, false);
                }
            };
            CartLinesController.prototype.notePanelClicked = function (lineId) {
                if (this.openLineNoteId === lineId) {
                    this.openLineNoteId = "";
                }
                else {
                    this.openLineNoteId = lineId;
                }
            };
            CartLinesController.prototype.getSumQtyPerUom = function (productId, cartLines) {
                return cartLines.reduce(function (sum, current) {
                    return current.productId === productId
                        ? sum + current.qtyPerBaseUnitOfMeasure * current.qtyOrdered
                        : sum;
                }, 0);
            };
            CartLinesController.prototype.openProductSubscriptionPopup = function (cartLine) {
                this.productSubscriptionPopupService.display({ product: null, cartLine: cartLine, productSubscription: null });
            };
            CartLinesController.prototype.openWishListPopup = function (cartLine) {
                var product = {
                    id: cartLine.productId,
                    qtyOrdered: cartLine.qtyOrdered,
                    selectedUnitOfMeasure: cartLine.unitOfMeasure
                };
                this.addToWishlistPopupService.display([product]);
            };
            CartLinesController.prototype.isOutOfStockLine = function (inventoryCheck, cartLine) {
                return inventoryCheck && cartLine.availability.messageType === 2 && !cartLine.canBackOrder;
            };
            CartLinesController.$inject = ["$scope", "cartService", "productSubscriptionPopupService", "addToWishlistPopupService", "spinnerService", "settingsService"];
            return CartLinesController;
        }());
        cart_1.CartLinesController = CartLinesController;
        angular
            .module("insite")
            .controller("CartLinesController", CartLinesController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cart-lines.controller.js.map