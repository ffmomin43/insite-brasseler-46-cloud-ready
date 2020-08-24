var insite;
(function (insite) {
    var useradministration;
    (function (useradministration) {
        "use strict";
        var UserListController = /** @class */ (function () {
            function UserListController(accountService, paginationService, coreService) {
                this.accountService = accountService;
                this.paginationService = paginationService;
                this.coreService = coreService;
                this.sort = "UserName";
                this.searchText = "";
                this.users = [];
                this.pagination = null;
                this.paginationStorageKey = "DefaultPagination-UserList";
            }
            UserListController.prototype.$onInit = function () {
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.restoreHistory();
                this.search(this.sort, false, false);
            };
            UserListController.prototype.search = function (sort, newSearch, storeHistory) {
                var _this = this;
                if (sort === void 0) { sort = "UserName"; }
                if (newSearch === void 0) { newSearch = false; }
                if (storeHistory === void 0) { storeHistory = true; }
                this.sort = sort;
                if (newSearch) {
                    this.pagination.page = 1;
                }
                if (storeHistory) {
                    this.updateHistory();
                }
                this.accountService.expand = "administration";
                this.accountService.getAccounts(this.searchText, this.pagination, this.sort).then(function (accountCollection) { _this.getAccountsCompleted(accountCollection); }, function (error) { _this.getAccountsFailed(error); });
            };
            UserListController.prototype.getAccountsCompleted = function (accountCollection) {
                this.users = accountCollection.accounts;
                this.pagination = accountCollection.pagination;
            };
            UserListController.prototype.getAccountsFailed = function (error) {
                this.users = [];
                this.pagination = null;
            };
            UserListController.prototype.clearSearch = function () {
                if (this.searchText) {
                    this.searchText = "";
                    this.search(this.sort, true);
                }
            };
            UserListController.prototype.sortBy = function (sortKey) {
                if (this.sort.indexOf(sortKey) >= 0) {
                    sortKey = this.sort.indexOf("DESC") >= 0 ? sortKey : sortKey + " DESC";
                }
                this.search(sortKey, true);
            };
            UserListController.prototype.getSortClass = function (key) {
                return this.sort.indexOf(key) >= 0 ?
                    (this.sort.indexOf("DESC") >= 0 ? "sort-descending" : "sort-ascending") : "";
            };
            UserListController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.searchText) {
                        this.searchText = state.searchText;
                    }
                    if (state.sort) {
                        this.sort = state.sort;
                    }
                }
            };
            UserListController.prototype.updateHistory = function () {
                this.coreService.replaceState({ searchText: this.searchText, pagination: this.pagination, sort: this.sort });
            };
            UserListController.$inject = ["accountService", "paginationService", "coreService"];
            return UserListController;
        }());
        useradministration.UserListController = UserListController;
        angular
            .module("insite")
            .controller("UserListController", UserListController);
    })(useradministration = insite.useradministration || (insite.useradministration = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.user-list.controller.js.map