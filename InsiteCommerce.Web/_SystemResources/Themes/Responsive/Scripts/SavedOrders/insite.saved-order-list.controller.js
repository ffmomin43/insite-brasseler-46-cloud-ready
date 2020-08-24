var insite;
(function (insite) {
    var savedorders;
    (function (savedorders) {
        "use strict";
        var SavedOrderListController = /** @class */ (function () {
            function SavedOrderListController(cartService, coreService, paginationService) {
                this.cartService = cartService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.paginationStorageKey = "DefaultPagination-SavedOrderList";
            }
            SavedOrderListController.prototype.$onInit = function () {
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.searchFilter = this.getDefaultSearchFilter();
                this.restoreHistory();
                this.getCarts();
            };
            SavedOrderListController.prototype.clear = function () {
                this.pagination.page = 1;
                this.searchFilter = this.getDefaultSearchFilter();
                this.getCarts();
            };
            SavedOrderListController.prototype.changeSort = function (sort) {
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort + " DESC";
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getCarts();
            };
            SavedOrderListController.prototype.search = function () {
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                this.getCarts();
            };
            SavedOrderListController.prototype.getCarts = function () {
                var _this = this;
                this.updateHistory();
                this.cartService.getCarts(this.searchFilter, this.pagination).then(function (cartCollection) { _this.getCartsCompleted(cartCollection); }, function (error) { _this.getCartsFailed(error); });
            };
            SavedOrderListController.prototype.getCartsCompleted = function (cartCollection) {
                this.savedCarts = cartCollection.carts;
                this.pagination = cartCollection.pagination;
            };
            SavedOrderListController.prototype.getCartsFailed = function (error) {
            };
            SavedOrderListController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.filter) {
                        this.searchFilter = state.filter;
                    }
                }
            };
            SavedOrderListController.prototype.updateHistory = function () {
                this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
            };
            SavedOrderListController.prototype.getDefaultSearchFilter = function () {
                return {
                    status: "Saved",
                    sort: "OrderDate DESC",
                    shipToId: null
                };
            };
            SavedOrderListController.$inject = ["cartService", "coreService", "paginationService"];
            return SavedOrderListController;
        }());
        savedorders.SavedOrderListController = SavedOrderListController;
        angular
            .module("insite")
            .controller("SavedOrderListController", SavedOrderListController);
    })(savedorders = insite.savedorders || (insite.savedorders = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.saved-order-list.controller.js.map