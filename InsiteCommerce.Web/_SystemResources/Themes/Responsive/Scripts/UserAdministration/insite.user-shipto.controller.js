var insite;
(function (insite) {
    var useradministration;
    (function (useradministration) {
        "use strict";
        var UserShipToController = /** @class */ (function () {
            function UserShipToController(userService, paginationService, queryString) {
                this.userService = userService;
                this.paginationService = paginationService;
                this.queryString = queryString;
                this.pageNumber = 1;
                this.pageSize = null;
                this.sort = "ShipTo";
                this.paginationStorageKey = "DefaultPagination-UserShipTo";
                this.errorMessage = "";
                this.saveSuccess = false;
            }
            UserShipToController.prototype.$onInit = function () {
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.userProfileId = this.queryString.get("userId");
                this.search();
            };
            UserShipToController.prototype.search = function () {
                var _this = this;
                this.errorMessage = "";
                this.userService.getUserShipToCollection(this.userProfileId, this.pagination, this.sort).then(function (accountShipToCollection) { _this.getUserShipToCollectionCompleted(accountShipToCollection); }, function (error) { _this.getUserShipToCollectionFailed(error); });
            };
            UserShipToController.prototype.getUserShipToCollectionCompleted = function (accountShipToCollection) {
                this.pagination = accountShipToCollection.pagination;
                this.costCodeCollection = accountShipToCollection.costCodeCollection;
                this.userShipToCollection = accountShipToCollection.userShipToCollection;
            };
            UserShipToController.prototype.getUserShipToCollectionFailed = function (error) {
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            UserShipToController.prototype.saveShipToCollection = function () {
                var _this = this;
                this.errorMessage = "";
                this.saveSuccess = false;
                this.userService.applyUserShipToCollection(this.userProfileId, this.userShipToCollection).then(function (accountShipToCollection) { _this.applyUserShipToCollectionCompleted(accountShipToCollection); }, function (error) { _this.applyUserShipToCollectionFailed(error); });
            };
            UserShipToController.prototype.applyUserShipToCollectionCompleted = function (accountShipToCollection) {
                this.saveSuccess = true;
            };
            UserShipToController.prototype.applyUserShipToCollectionFailed = function (error) {
                this.saveSuccess = false;
                this.errorMessage = "";
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            UserShipToController.prototype.sortBy = function (sortKey) {
                if (this.sort.indexOf(sortKey) >= 0) {
                    this.sort = this.sort.indexOf("DESC") >= 0 ? sortKey : sortKey + " DESC";
                }
                else {
                    this.sort = sortKey;
                }
                this.pagination.page = 1;
                this.search();
            };
            UserShipToController.prototype.getSortClass = function (key) {
                return this.sort.indexOf(key) >= 0 ?
                    (this.sort.indexOf("DESC") >= 0 ? "sort-descending" : "sort-ascending") : "";
            };
            UserShipToController.$inject = ["userService", "paginationService", "queryString"];
            return UserShipToController;
        }());
        useradministration.UserShipToController = UserShipToController;
        angular
            .module("insite")
            .controller("UserShipToController", UserShipToController);
    })(useradministration = insite.useradministration || (insite.useradministration = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.user-shipto.controller.js.map