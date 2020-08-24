var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var WishListController = /** @class */ (function () {
            function WishListController($scope, coreService, wishListService, productService, cartService, paginationService, settingsService, queryString) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.wishListService = wishListService;
                this.productService = productService;
                this.cartService = cartService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.wishListCollection = [];
                this.paginationStorageKey = "DefaultPagination-WishList";
                this.inProgress = false;
                this.failedToGetRealTimeInventory = false;
            }
            WishListController.prototype.$onInit = function () {
                var _this = this;
                this.getWishLists();
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            WishListController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.wishListSettings = settingsCollection.wishListSettings;
            };
            WishListController.prototype.getSettingsFailed = function (error) {
            };
            WishListController.prototype.mapData = function (data) {
                this.wishListCount = data.wishListCollection.length;
                this.hasAnyWishListsLine = data.wishListCollection.some(function (e) { return e.hasAnyLines; });
                if (this.wishListCount > 0) {
                    this.wishListCollection = data.wishListCollection;
                    var wishListId_1 = this.queryString.get("wishListId") || this.queryString.get("id");
                    if (wishListId_1.length > 0) {
                        this.selectedWishList = this.wishListCollection.filter(function (x) { return x.id.toLowerCase() === wishListId_1.toLowerCase(); })[0];
                    }
                    else {
                        this.selectedWishList = this.wishListCollection[0];
                    }
                    this.getSelectedWishListDetails();
                }
            };
            WishListController.prototype.getWishLists = function () {
                var _this = this;
                var pagination = { pageSize: 999 };
                this.wishListService.getWishLists(null, null, null, pagination).then(function (wishListCollection) { _this.getWishListsCompleted(wishListCollection); }, function (error) { _this.getWishListsFailed(error); });
            };
            WishListController.prototype.getWishListsCompleted = function (wishListCollection) {
                this.mapData(wishListCollection);
            };
            WishListController.prototype.getWishListsFailed = function (error) {
            };
            WishListController.prototype.getSelectedWishListDetails = function () {
                var _this = this;
                this.selectedWishList.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey, this.selectedWishList.pagination);
                this.wishListService.getWishList(this.selectedWishList).then(function (wishList) { _this.getWishListCompleted(wishList); }, function (error) { _this.getWishListFailed(error); });
            };
            WishListController.prototype.getWishListCompleted = function (wishList) {
                this.selectedWishList = wishList;
                this.inProgress = false;
                this.getRealTimePrices();
                if (!this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            WishListController.prototype.getWishListFailed = function (error) {
            };
            WishListController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing && this.selectedWishList.wishListLineCollection != null) {
                    var products = this.selectedWishList.wishListLineCollection.map(function (wishlistLine) {
                        return {
                            id: wishlistLine.productId,
                            unitOfMeasure: wishlistLine.unitOfMeasure,
                            selectedUnitOfMeasure: wishlistLine.unitOfMeasure,
                            qtyOrdered: wishlistLine.qtyOrdered
                        };
                    });
                    this.productService.getProductRealTimePrices(products).then(function (pricingResult) { _this.handleRealTimePricesCompleted(pricingResult); }, function (reason) { _this.handleRealtimePricesFailed(reason); });
                }
            };
            WishListController.prototype.handleRealTimePricesCompleted = function (result) {
                var _this = this;
                result.realTimePricingResults.forEach(function (productPrice) {
                    var wishlistLine = _this.selectedWishList.wishListLineCollection.find(function (p) { return p.productId === productPrice.productId && p.unitOfMeasure === productPrice.unitOfMeasure; });
                    wishlistLine.pricing = productPrice;
                });
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            WishListController.prototype.handleRealtimePricesFailed = function (reason) {
                this.selectedWishList.wishListLineCollection.forEach(function (p) {
                    if (p.pricing) {
                        p.pricing.failedToGetRealTimePrices = true;
                    }
                });
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            WishListController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory && this.selectedWishList.wishListLineCollection != null) {
                    var products = this.selectedWishList.wishListLineCollection.map(function (wishlistLine) { return _this.mapWishlistLineToProduct(wishlistLine); });
                    this.productService.getProductRealTimeInventory(products).then(function (inventoryResult) { _this.handleRealTimeInventoryCompleted(inventoryResult); }, function (reason) { _this.handleRealtimeInventoryFailed(reason); });
                }
            };
            WishListController.prototype.handleRealTimeInventoryCompleted = function (result) {
                var _this = this;
                this.selectedWishList.wishListLineCollection.forEach(function (line) {
                    var productInventory = result.realTimeInventoryResults.find(function (productInventory) { return line.productId === productInventory.productId; });
                    if (productInventory) {
                        var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(function (o) { return o.unitOfMeasure === line.unitOfMeasure; });
                        if (inventoryAvailability) {
                            line.availability = inventoryAvailability.availability;
                        }
                        else {
                            line.availability = { messageType: 0 };
                        }
                        line.productUnitOfMeasures.forEach(function (productUnitOfMeasure) {
                            var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(function (o) { return o.unitOfMeasure === productUnitOfMeasure.unitOfMeasure; });
                            if (inventoryAvailability) {
                                productUnitOfMeasure.availability = inventoryAvailability.availability;
                            }
                            else {
                                productUnitOfMeasure.availability = { messageType: 0 };
                            }
                        });
                        _this.updateAvailability(line);
                    }
                });
            };
            WishListController.prototype.handleRealtimeInventoryFailed = function (reason) {
                this.failedToGetRealTimeInventory = true;
            };
            WishListController.prototype.deleteWishList = function () {
                var _this = this;
                this.wishListService.deleteWishList(this.selectedWishList).then(function (wishList) { _this.deleteWishListCompleted(wishList); }, function (error) { _this.deleteWishListFailed(error); });
            };
            WishListController.prototype.deleteWishListCompleted = function (wishList) {
                this.coreService.displayModal(angular.element("#popup-deletewishlist"));
                this.getWishLists();
            };
            WishListController.prototype.deleteWishListFailed = function (error) {
            };
            WishListController.prototype.deleteLine = function (line) {
                var _this = this;
                if (this.inProgress) {
                    return;
                }
                this.inProgress = true;
                this.wishListService.deleteLine(line).then(function (wishListLine) { _this.deleteLineCompleted(wishListLine); }, function (error) { _this.deleteLineFailed(error); });
            };
            WishListController.prototype.deleteLineCompleted = function (wishListLine) {
                this.getSelectedWishListDetails();
            };
            WishListController.prototype.deleteLineFailed = function (error) {
            };
            WishListController.prototype.updateLine = function (line) {
                var _this = this;
                if (line.qtyOrdered === 0) {
                    this.deleteLine(line);
                }
                else {
                    this.wishListService.updateLine(line).then(function (wishListLine) { _this.updateLineCompleted(wishListLine); }, function (error) { _this.updateLineFailed(error); });
                }
            };
            WishListController.prototype.updateLineCompleted = function (wishListLine) {
                this.getSelectedWishListDetails();
            };
            WishListController.prototype.updateLineFailed = function (error) {
            };
            WishListController.prototype.quantityKeyPress = function (line) {
                this.updateLine(line);
            };
            WishListController.prototype.addLineToCart = function (line) {
                var _this = this;
                this.cartService.addLine(line, true).then(function (cartLine) { _this.addLineCompleted(cartLine); }, function (error) { _this.addLineFailed(error); });
            };
            WishListController.prototype.addLineCompleted = function (cartLine) {
            };
            WishListController.prototype.addLineFailed = function (error) {
            };
            WishListController.prototype.addAllToCart = function () {
                var _this = this;
                this.inProgress = true;
                this.cartService.addLineCollection(this.selectedWishList.wishListLineCollection, true).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
            };
            WishListController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.inProgress = false;
            };
            WishListController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
            };
            WishListController.prototype.allQtysIsValid = function () {
                if (!this.selectedWishList || !this.selectedWishList.wishListLineCollection) {
                    return false;
                }
                return this.selectedWishList.wishListLineCollection.every(function (wishListLine) {
                    return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
                });
            };
            WishListController.prototype.changeUnitOfMeasure = function (line) {
                var _this = this;
                var product = this.mapWishlistLineToProduct(line);
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(line, productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            WishListController.prototype.changeUnitOfMeasureCompleted = function (line, productDto) {
                line = this.mapProductToWishlistLine(productDto, line);
                if (!productDto.quoteRequired) {
                    line.pricing = productDto.pricing;
                }
                this.updateLine(line);
                this.updateAvailability(line);
            };
            WishListController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            WishListController.prototype.updateAvailability = function (line) {
                if (line && line.productUnitOfMeasures && line.selectedUnitOfMeasure) {
                    var productUnitOfMeasure = line.productUnitOfMeasures.find(function (uom) { return uom.unitOfMeasure === line.selectedUnitOfMeasure; });
                    if (productUnitOfMeasure && productUnitOfMeasure.availability) {
                        line.availability = productUnitOfMeasure.availability;
                    }
                }
            };
            WishListController.prototype.mapProductToWishlistLine = function (product, line) {
                line.productUnitOfMeasures = product.productUnitOfMeasures;
                line.unitOfMeasureDisplay = product.unitOfMeasureDisplay;
                line.unitOfMeasureDescription = product.unitOfMeasureDescription;
                line.unitOfMeasure = product.unitOfMeasure;
                line.canShowUnitOfMeasure = product.canShowUnitOfMeasure;
                line.selectedUnitOfMeasure = product.selectedUnitOfMeasure;
                return line;
            };
            WishListController.prototype.mapWishlistLineToProduct = function (line) {
                return {
                    id: line.productId,
                    productUnitOfMeasures: line.productUnitOfMeasures,
                    unitOfMeasure: line.unitOfMeasure,
                    selectedUnitOfMeasure: line.selectedUnitOfMeasure,
                    quoteRequired: line.quoteRequired,
                    pricing: line.pricing
                };
            };
            WishListController.$inject = ["$scope", "coreService", "wishListService", "productService", "cartService", "paginationService", "settingsService", "queryString"];
            return WishListController;
        }());
        wishlist.WishListController = WishListController;
        angular
            .module("insite")
            .controller("WishListController", WishListController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.wishlist.controller.js.map