var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var StaticListController = /** @class */ (function () {
            function StaticListController($scope, settingsService, queryString, wishListService, cartService, coreService, spinnerService, productService, addToWishlistPopupService, sessionService) {
                this.$scope = $scope;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.wishListService = wishListService;
                this.cartService = cartService;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.productService = productService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.sessionService = sessionService;
                this.failedToGetRealTimeInventory = false;
                this.inProgress = false;
            }
            StaticListController.prototype.$onInit = function () {
                var _this = this;
                this.listId = this.queryString.get("id");
                this.updateBreadcrumbs();
                this.initListPopupEvents();
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            StaticListController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.getList();
            };
            StaticListController.prototype.getSettingsFailed = function (error) {
            };
            StaticListController.prototype.onSessionUpdated = function (session) {
                this.getList();
            };
            StaticListController.prototype.updateBreadcrumbs = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.listModel && _this.listModel.name; }, function (newValue) {
                    if (newValue) {
                        angular.element(".breadcrumbs > .current").text(newValue);
                    }
                }, true);
            };
            StaticListController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            StaticListController.prototype.getList = function () {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getListById(this.listId, "staticlist,getalllines").then(function (list) { _this.getListCompleted(list); }, function (error) { _this.getListFailed(error); });
            };
            StaticListController.prototype.getListCompleted = function (list) {
                this.spinnerService.hide();
                this.listModel = list;
                this.getRealTimePrices();
                if (!this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            StaticListController.prototype.getListFailed = function (error) {
                this.spinnerService.hide();
            };
            StaticListController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing && this.listModel.wishListLineCollection != null) {
                    var products = this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection);
                    this.productService.getProductRealTimePrices(products).then(function (pricingResult) { _this.handleRealTimePricesCompleted(pricingResult); }, function (reason) { _this.handleRealtimePricesFailed(reason); });
                }
            };
            StaticListController.prototype.handleRealTimePricesCompleted = function (result) {
                var _this = this;
                result.realTimePricingResults.forEach(function (productPrice) {
                    var wishlistLine = _this.listModel.wishListLineCollection.find(function (p) { return p.productId === productPrice.productId; });
                    wishlistLine.pricing = productPrice;
                });
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            StaticListController.prototype.handleRealtimePricesFailed = function (reason) {
                this.listModel.wishListLineCollection.forEach(function (p) {
                    if (p.pricing) {
                        p.pricing.failedToGetRealTimePrices = true;
                    }
                });
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            StaticListController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory && this.listModel.wishListLineCollection != null) {
                    var products = this.listModel.wishListLineCollection.map(function (wishlistLine) { return _this.wishListService.mapWishlistLineToProduct(wishlistLine); });
                    this.productService.getProductRealTimeInventory(products).then(function (inventoryResult) { _this.handleRealTimeInventoryCompleted(inventoryResult); }, function (reason) { _this.handleRealtimeInventoryFailed(reason); });
                }
            };
            StaticListController.prototype.handleRealTimeInventoryCompleted = function (result) {
                this.wishListService.applyRealTimeInventoryResult(this.listModel, result);
            };
            StaticListController.prototype.handleRealtimeInventoryFailed = function (reason) {
                this.failedToGetRealTimeInventory = true;
            };
            StaticListController.prototype.changeUnitOfMeasure = function (line) {
                var _this = this;
                var product = this.wishListService.mapWishlistLineToProduct(line);
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(line, productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            StaticListController.prototype.changeUnitOfMeasureCompleted = function (line, productDto) {
                line = this.wishListService.mapProductToWishlistLine(productDto, line);
                if (!productDto.quoteRequired) {
                    line.pricing = productDto.pricing;
                }
                this.wishListService.updateAvailability(line);
            };
            StaticListController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            StaticListController.prototype.addLineToCart = function (line) {
                var _this = this;
                this.cartService.addLine(line, true).then(function (cartLine) { _this.addLineCompleted(cartLine); }, function (error) { _this.addLineFailed(error); });
            };
            StaticListController.prototype.addLineCompleted = function (cartLine) {
            };
            StaticListController.prototype.addLineFailed = function (error) {
            };
            StaticListController.prototype.openWishListPopup = function (line) {
                var product = {
                    id: line.productId,
                    qtyOrdered: line.qtyOrdered,
                    selectedUnitOfMeasure: line.unitOfMeasure
                };
                this.addToWishlistPopupService.display([product]);
            };
            StaticListController.prototype.allQtysIsValid = function () {
                if (!this.listModel || !this.listModel.wishListLineCollection) {
                    return false;
                }
                return this.listModel.wishListLineCollection.every(function (wishListLine) {
                    return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
                });
            };
            StaticListController.prototype.addAllToCart = function (wishList) {
                var _this = this;
                this.inProgress = true;
                this.cartService.addLineCollection(wishList.wishListLineCollection, true).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
            };
            StaticListController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.inProgress = false;
            };
            StaticListController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
            };
            StaticListController.prototype.initListPopupEvents = function () {
                var _this = this;
                var popup = angular.element("#popup-save-list");
                popup.on("closed", function () {
                    _this.clearMessages();
                    _this.listName = "";
                    if (_this.saveListForm) {
                        _this.saveListForm.$setPristine();
                        _this.saveListForm.$setUntouched();
                    }
                    _this.$scope.$apply();
                });
            };
            StaticListController.prototype.clearMessages = function () {
                this.errorMessage = "";
                this.saveInProgress = false;
            };
            StaticListController.prototype.openSaveListModal = function () {
                var _this = this;
                this.spinnerService.show();
                this.sessionService.getSession().then(function (session) {
                    _this.spinnerService.hide();
                    _this.isAuthenticated = session.isAuthenticated;
                    _this.coreService.displayModal("#popup-save-list");
                });
            };
            StaticListController.prototype.saveList = function () {
                var _this = this;
                this.clearMessages();
                if (!this.saveListForm.$valid) {
                    return;
                }
                this.disableSaveForm();
                this.wishListService.addWishList(this.listName).then(function (list) { _this.addListCompleted(list); }, function (error) { _this.addListFailed(error); });
            };
            StaticListController.prototype.addListCompleted = function (list) {
                this.addProductsToList(list);
            };
            StaticListController.prototype.addListFailed = function (error) {
                this.errorMessage = error.message;
                this.enableSaveForm();
            };
            StaticListController.prototype.addProductsToList = function (list) {
                if (this.listModel.wishListLinesCount === 1) {
                    this.addLineToList(list);
                }
                else {
                    this.addLineCollectionToList(list);
                }
            };
            StaticListController.prototype.addLineToList = function (list) {
                var _this = this;
                this.wishListService.addWishListLine(list, this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection)[0]).then(function (listLine) { _this.addListLineCompleted(list, listLine); }, function (error) { _this.addListLineFailed(error); });
            };
            StaticListController.prototype.addListLineCompleted = function (list, listLine) {
                this.redirectToWishListPage(list);
            };
            StaticListController.prototype.addListLineFailed = function (error) {
                this.errorMessage = error.message;
                this.enableSaveForm();
            };
            StaticListController.prototype.addLineCollectionToList = function (list) {
                var _this = this;
                this.wishListService.addWishListLines(list, this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection)).then(function (listLineCollection) { _this.addListLineCollectionCompleted(list, listLineCollection); }, function (error) { _this.addListLineCollectionFailed(error); });
            };
            StaticListController.prototype.addListLineCollectionCompleted = function (list, listLineCollection) {
                this.redirectToWishListPage(list);
            };
            StaticListController.prototype.addListLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
                this.enableSaveForm();
            };
            StaticListController.prototype.disableSaveForm = function () {
                this.saveInProgress = true;
                this.spinnerService.show();
            };
            StaticListController.prototype.enableSaveForm = function () {
                this.saveInProgress = false;
                this.spinnerService.hide();
            };
            StaticListController.prototype.redirectToWishListPage = function (list) {
                this.coreService.closeModal("#popup-save-list");
                this.coreService.redirectToPath(this.myListDetailUrl + "?id=" + list.id);
            };
            StaticListController.$inject = [
                "$scope",
                "settingsService",
                "queryString",
                "wishListService",
                "cartService",
                "coreService",
                "spinnerService",
                "productService",
                "addToWishlistPopupService",
                "sessionService"
            ];
            return StaticListController;
        }());
        wishlist.StaticListController = StaticListController;
        angular
            .module("insite")
            .controller("StaticListController", StaticListController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.static-list.controller.js.map