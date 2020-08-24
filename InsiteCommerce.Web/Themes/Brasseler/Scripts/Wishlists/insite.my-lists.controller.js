var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var MyListsController = /** @class */ (function () {
            function MyListsController($scope, coreService, wishListService, cartService, settingsService, spinnerService, $timeout, sessionService, paginationService, createListPopupService, deleteListPopupService) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.wishListService = wishListService;
                this.cartService = cartService;
                this.settingsService = settingsService;
                this.spinnerService = spinnerService;
                this.$timeout = $timeout;
                this.sessionService = sessionService;
                this.paginationService = paginationService;
                this.createListPopupService = createListPopupService;
                this.deleteListPopupService = deleteListPopupService;
                this.wishListCollection = [];
                this.inProgress = false;
                this.paginationStorageKey = "DefaultPagination-WishList";
                this.sort = "ModifiedOn DESC";
            }
            MyListsController.prototype.$onInit = function () {
                var _this = this;
                this.restoreHistory();
                this.getWishLists(false);
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.$scope.$on("list-was-created", function () {
                    _this.getWishLists();
                });
                this.$scope.$on("list-was-deleted", function () {
                    _this.getWishLists();
                });
                this.$scope.$on("leaveListPopupContext", function (event, list) {
                    _this.popupWishListModel = list;
                });
            };
            MyListsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.listSettings = settingsCollection.wishListSettings;
                this.$timeout(function () { return angular.element(document).foundation(); }, 0);
                this.redirectToMyListDetails();
            };
            MyListsController.prototype.getSettingsFailed = function (error) {
            };
            MyListsController.prototype.getSessionCompleted = function (session) {
                this.session = session;
            };
            MyListsController.prototype.getSessionFailed = function (error) {
            };
            MyListsController.prototype.mapData = function (data) {
                this.wishListCount = data.wishListCollection.length;
                this.pagination = data.pagination;
                this.hasAnyWishListsLine = data.wishListCollection.some(function (e) { return e.hasAnyLines; });
                if (this.wishListCount > 0) {
                    this.wishListCollection = data.wishListCollection;
                }
            };
            MyListsController.prototype.changeSortBy = function () {
                this.coreService.replaceState({ sort: this.sort });
                this.getWishLists();
            };
            MyListsController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.sort) {
                        this.sort = state.sort;
                    }
                }
            };
            MyListsController.prototype.getWishLists = function (storeHistory, filterChanged) {
                var _this = this;
                if (storeHistory === void 0) { storeHistory = true; }
                if (filterChanged === void 0) { filterChanged = false; }
                this.spinnerService.show();
                if (storeHistory) {
                    this.updateHistory();
                }
                if (filterChanged) {
                    this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                }
                this.wishListService.getWishLists(this.sort, "top3products", null, this.pagination, this.filter).then(function (wishListCollection) { _this.getWishListsCompleted(wishListCollection); }, function (error) { _this.getWishListsFailed(error); });
            };
            MyListsController.prototype.getWishListsCompleted = function (wishListCollection) {
                this.mapData(wishListCollection);
                this.spinnerService.hide();
                this.redirectToMyListDetails();
                // refresh foundation tip hover
                this.$timeout(function () { return angular.element(document).foundation("dropdown", "reflow"); }, 0);
            };
            MyListsController.prototype.getWishListsFailed = function (error) {
                this.spinnerService.hide();
            };
            MyListsController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            MyListsController.prototype.setWishList = function (wishList) {
                this.popupWishListModel = wishList;
            };
            MyListsController.prototype.leaveList = function () {
                var _this = this;
                this.wishListService.deleteWishListShare(this.popupWishListModel).then(function (wishList) { _this.leaveListCompleted(wishList); }, function (error) { _this.leaveListFailed(error); });
            };
            MyListsController.prototype.leaveListCompleted = function (wishList) {
                this.closeModal("#popup-leave-list");
                this.getWishLists();
            };
            MyListsController.prototype.leaveListFailed = function (error) {
            };
            MyListsController.prototype.addAllToCart = function (wishList) {
                var _this = this;
                this.inProgress = true;
                this.cartService.addWishListToCart(wishList.id, true).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
            };
            MyListsController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.inProgress = false;
            };
            MyListsController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
            };
            MyListsController.prototype.isSharedByCustomer = function (list) {
                return list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers];
            };
            MyListsController.prototype.redirectToMyListDetails = function () {
                // skip redirect for cms widget
                if (!this.myListDetailUrl) {
                    return;
                }
                if (this.listSettings && !this.listSettings.allowMultipleWishLists && this.wishListCollection && this.wishListCollection.length > 0) {
                    this.spinnerService.show();
                    this.coreService.redirectToPath(this.myListDetailUrl + "?id=" + this.wishListCollection[0].id);
                }
            };
            MyListsController.prototype.updateHistory = function () {
                this.coreService.pushState({ sort: this.sort, pagination: this.pagination });
            };
            MyListsController.prototype.openCreatePopup = function (wishList) {
                this.createListPopupService.display(wishList);
            };
            MyListsController.prototype.openDeletePopup = function (wishList) {
                this.deleteListPopupService.display(wishList);
            };
            MyListsController.$inject = ["$scope", "coreService", "wishListService", "cartService", "settingsService", "spinnerService", "$timeout", "sessionService", "paginationService", "createListPopupService", "deleteListPopupService"];
            return MyListsController;
        }());
        wishlist.MyListsController = MyListsController;
        angular
            .module("insite")
            .controller("MyListsController", MyListsController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-lists.controller.js.map