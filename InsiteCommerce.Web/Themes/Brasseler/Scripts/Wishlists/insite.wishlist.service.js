var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var WishListService = /** @class */ (function () {
            function WishListService($http, httpWrapperService, coreService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.coreService = coreService;
                this.serviceUri = "/api/v1/wishlists";
                this.wishListSettingsUri = "/api/v1/settings/wishlist";
                this.cacheKey = "addWishListLineProducts";
            }
            WishListService.prototype.getWishLists = function (sort, expand, wishListLinesSort, pagination, query, filter) {
                var params = {
                    sort: sort,
                    expand: expand,
                    wishListLinesSort: wishListLinesSort,
                    page: pagination ? pagination.page : null,
                    pageSize: pagination ? pagination.pageSize : null,
                    query: query,
                    filter: filter
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: params }), this.getWishListsCompleted, this.getWishListsFailed);
            };
            WishListService.prototype.getWishListsCompleted = function (response) {
            };
            WishListService.prototype.getWishListsFailed = function (error) {
            };
            WishListService.prototype.getWishList = function (wishList, expand) {
                var uri = wishList.uri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getWishListParams(wishList.pagination, expand) }), this.getWishListCompleted, this.getWishListFailed);
            };
            WishListService.prototype.getListById = function (listId, expand, pagination, exclude) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/" + listId, method: "GET", params: this.getWishListParams(pagination, expand, exclude) }), this.getWishListCompleted, this.getWishListFailed);
            };
            WishListService.prototype.getWishListParams = function (pagination, expand, exclude) {
                var params = { expand: expand, exclude: exclude };
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                    params.sort = pagination.sortType;
                }
                return params;
            };
            WishListService.prototype.getWishListLinesById = function (wishListId, parameter) {
                var wishListParams = this.getWishListLinesParams(parameter);
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/" + wishListId + "/wishlistLines", method: "GET", params: wishListParams }), this.getWishListLinesCompleted, this.getWishListLinesFailed);
            };
            WishListService.prototype.getWishListLinesParams = function (parameter) {
                var params = {};
                if (parameter && parameter.pagination) {
                    params.page = parameter.pagination.page;
                    params.pageSize = parameter.pagination.pageSize;
                    params.sort = parameter.pagination.sortType;
                    params.defaultPageSize = parameter.pagination.defaultPageSize;
                }
                if (parameter && parameter.query) {
                    params.query = parameter.query;
                }
                if (parameter && parameter.changedSharedListLinesQuantities) {
                    params.changedSharedListLinesQuantities = parameter.changedSharedListLinesQuantities;
                }
                return params;
            };
            WishListService.prototype.getWishListCompleted = function (response) {
            };
            WishListService.prototype.getWishListFailed = function (error) {
            };
            WishListService.prototype.getWishListLinesCompleted = function (response) {
            };
            WishListService.prototype.getWishListLinesFailed = function (error) {
            };
            WishListService.prototype.addWishList = function (wishListName, description) {
                var wishList = angular.toJson({
                    name: wishListName,
                    description: description ? description : ""
                });
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.serviceUri, wishList), this.addWishListCompleted, this.addWishListFailed);
            };
            WishListService.prototype.addWishListCompleted = function (response) {
            };
            WishListService.prototype.addWishListFailed = function (error) {
            };
            WishListService.prototype.deleteWishList = function (wishList) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(wishList.uri), this.deleteWishListCompleted, this.deleteWishListFailed);
            };
            WishListService.prototype.deleteWishListCompleted = function (response) {
            };
            WishListService.prototype.deleteWishListFailed = function (error) {
            };
            WishListService.prototype.deleteWishListShare = function (wishList, wishListShareId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(wishList.uri + "/share/" + (wishListShareId ? wishListShareId : "current")), this.deleteWishListShareCompleted, this.deleteWishListShareFailed);
            };
            WishListService.prototype.deleteWishListShareCompleted = function (response) {
            };
            WishListService.prototype.deleteWishListShareFailed = function (error) {
            };
            WishListService.prototype.addWishListLine = function (wishList, product) {
                var wishListLine = {};
                wishListLine.productId = product.id;
                wishListLine.qtyOrdered = product.qtyOrdered;
                wishListLine.unitOfMeasure = product.selectedUnitOfMeasure;
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(wishList.wishListLinesUri, wishListLine), this.addWishListLineCompleted, this.addWishListLineFailed);
            };
            WishListService.prototype.addWishListLineCompleted = function (response) {
            };
            WishListService.prototype.addWishListLineFailed = function (error) {
            };
            WishListService.prototype.deleteLine = function (line) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(line.uri), this.deleteLineCompleted, this.deleteLineFailed);
            };
            WishListService.prototype.deleteLineCompleted = function (response) {
            };
            WishListService.prototype.deleteLineFailed = function (error) {
            };
            WishListService.prototype.deleteLineCollection = function (wishList, lines) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "DELETE", url: wishList.wishListLinesUri + "/batch", params: { wishListLineIds: lines.map(function (o) { return o.id; }) } }), this.deleteLineCollectionCompleted, this.deleteLineCollectionFailed);
            };
            WishListService.prototype.deleteLineCollectionCompleted = function (response) {
            };
            WishListService.prototype.deleteLineCollectionFailed = function (error) {
            };
            WishListService.prototype.updateLine = function (line) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: line.uri, data: line }), this.updateLineCompleted, this.updateLineFailed);
            };
            WishListService.prototype.updateLineCompleted = function (response) {
            };
            WishListService.prototype.updateLineFailed = function (error) {
            };
            WishListService.prototype.updateWishList = function (list) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: list.uri, data: list }), this.updateWishListCompleted, this.updateWishListFailed);
            };
            WishListService.prototype.updateWishListCompleted = function (response) {
            };
            WishListService.prototype.updateWishListFailed = function (error) {
            };
            WishListService.prototype.updateWishListLineCollection = function (data) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/" + data.wishListId + "/wishlistLines/batch", data: data }), this.updateWishListCompleted, this.updateWishListFailed);
            };
            WishListService.prototype.updateWishListLineCollectionCompleted = function (response) {
            };
            WishListService.prototype.updateWishListLineCollectionFailed = function (error) {
            };
            WishListService.prototype.updateWishListSchedule = function (list) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: list.uri + "/schedule", data: list }), this.updateWishListScheduleCompleted, this.updateWishListScheduleFailed);
            };
            WishListService.prototype.updateWishListScheduleCompleted = function (response) {
            };
            WishListService.prototype.updateWishListScheduleFailed = function (error) {
            };
            WishListService.prototype.activateInvite = function (invite) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/activateinvite", data: { invite: invite } }), this.updateWishListInviteCompleted, this.updateWishListInviteFailed);
            };
            WishListService.prototype.updateWishListInviteCompleted = function (response) {
            };
            WishListService.prototype.updateWishListInviteFailed = function (error) {
            };
            WishListService.prototype.sendACopy = function (list) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: list.uri + "/sendacopy", data: list }), this.updateWishListSendACopyCompleted, this.updateWishListSendACopyFailed);
            };
            WishListService.prototype.updateWishListSendACopyCompleted = function (response) {
            };
            WishListService.prototype.updateWishListSendACopyFailed = function (error) {
            };
            WishListService.prototype.addWishListLines = function (wishList, products) {
                var wishListLineCollection = { wishListLines: this.getWishListLinesFromProducts(products) };
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(wishList.wishListLinesUri + "/batch", wishListLineCollection), this.addWishListLinesCompleted, this.addWishListLinesFailed);
            };
            WishListService.prototype.addWishListLinesCompleted = function (response) {
            };
            WishListService.prototype.addWishListLinesFailed = function (error) {
            };
            WishListService.prototype.addAllWishListLines = function (wishList, copyFromWishListId, changedSharedListLinesQtys) {
                var wishListLineCollection = {
                    changedListLineQuantities: changedSharedListLinesQtys,
                    wishListLines: [],
                    pagination: null
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(wishList.wishListLinesUri + "/batch/" + copyFromWishListId, wishListLineCollection), this.addAllWishListLinesCompleted, this.addAllWishListLinesFailed);
            };
            WishListService.prototype.addAllWishListLinesCompleted = function (response) {
            };
            WishListService.prototype.addAllWishListLinesFailed = function (error) {
            };
            WishListService.prototype.getWishListSettings = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.wishListSettingsUri), this.getWishListSettingsCompleted, this.getWishListSettingsFailed);
            };
            WishListService.prototype.getWishListSettingsCompleted = function (response) {
            };
            WishListService.prototype.getWishListSettingsFailed = function (error) {
            };
            WishListService.prototype.getWishListLinesFromProducts = function (products) {
                var wishListLineCollection = [];
                angular.forEach(products, function (product) {
                    wishListLineCollection.push({
                        productId: product.id,
                        qtyOrdered: product.qtyOrdered,
                        unitOfMeasure: product.selectedUnitOfMeasure
                    });
                });
                return wishListLineCollection;
            };
            WishListService.prototype.mapWishlistLineToProduct = function (line) {
                return {
                    id: line.productId,
                    productUnitOfMeasures: line.productUnitOfMeasures,
                    unitOfMeasure: line.unitOfMeasure,
                    selectedUnitOfMeasure: line.selectedUnitOfMeasure,
                    quoteRequired: line.quoteRequired,
                    pricing: line.pricing,
                    qtyOrdered: line.qtyOrdered
                };
            };
            WishListService.prototype.mapWishListLinesToProducts = function (lines) {
                return lines.map(function (wishlistLine) {
                    return {
                        id: wishlistLine.productId,
                        unitOfMeasure: wishlistLine.unitOfMeasure,
                        selectedUnitOfMeasure: wishlistLine.unitOfMeasure,
                        qtyOrdered: wishlistLine.qtyOrdered
                    };
                });
            };
            WishListService.prototype.mapProductToWishlistLine = function (product, line) {
                line.productUnitOfMeasures = product.productUnitOfMeasures;
                line.unitOfMeasureDisplay = product.unitOfMeasureDisplay;
                line.unitOfMeasureDescription = product.unitOfMeasureDescription;
                line.unitOfMeasure = product.unitOfMeasure;
                line.canShowUnitOfMeasure = product.canShowUnitOfMeasure;
                line.selectedUnitOfMeasure = product.selectedUnitOfMeasure;
                return line;
            };
            WishListService.prototype.applyRealTimeInventoryResult = function (list, result) {
                var _this = this;
                list.wishListLineCollection.forEach(function (line) {
                    var productInventory = result.realTimeInventoryResults.find(function (productInventory) { return line.productId === productInventory.productId; });
                    if (productInventory) {
                        line.qtyOnHand = productInventory.qtyOnHand;
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
                        if (line.canAddToCart && !line.canBackOrder && line.trackInventory && line.qtyOnHand <= 0) {
                            line.canAddToCart = false;
                            line.canEnterQuantity = line.canAddToCart;
                        }
                    }
                });
                list.canAddAllToCart = list.wishListLineCollection.every(function (p) { return p.canAddToCart; });
                list.canAddToCart = list.canAddAllToCart || list.wishListLineCollection.some(function (p) { return p.canAddToCart; });
            };
            WishListService.prototype.updateAvailability = function (line) {
                if (line && line.productUnitOfMeasures && line.selectedUnitOfMeasure) {
                    var productUnitOfMeasure = line.productUnitOfMeasures.find(function (uom) { return uom.unitOfMeasure === line.selectedUnitOfMeasure; });
                    if (productUnitOfMeasure && productUnitOfMeasure.availability) {
                        line.availability = productUnitOfMeasure.availability;
                    }
                }
            };
            WishListService.$inject = ["$http", "httpWrapperService", "coreService"];
            return WishListService;
        }());
        wishlist.WishListService = WishListService;
        angular
            .module("insite")
            .service("wishListService", WishListService);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.wishlist.service.js.map