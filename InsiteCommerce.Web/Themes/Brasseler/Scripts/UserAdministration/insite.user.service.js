var insite;
(function (insite) {
    var useradministration;
    (function (useradministration) {
        "use strict";
        var UserService = /** @class */ (function () {
            function UserService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/accounts";
            }
            UserService.prototype.getUserShipToCollection = function (userProfileId, pagination, sort) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri + "/" + userProfileId + "/shiptos", params: this.getUserShipToCollectionParams(pagination, sort) }), this.getUserShipToCollectionCompleted, this.getUserShipToCollectionFailed);
            };
            UserService.prototype.getUserShipToCollectionParams = function (pagination, sort) {
                var params = {
                    sort: sort
                };
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            UserService.prototype.getUserShipToCollectionCompleted = function (response) {
            };
            UserService.prototype.getUserShipToCollectionFailed = function (error) {
            };
            UserService.prototype.applyUserShipToCollection = function (userProfileId, shipToCollection) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/" + userProfileId + "/shiptos", data: { UserShipToCollection: shipToCollection } }), this.applyUserShipToCollectionCompleted, this.applyUserShipToCollectionFailed);
            };
            UserService.prototype.applyUserShipToCollectionCompleted = function (response) {
            };
            UserService.prototype.applyUserShipToCollectionFailed = function (error) {
            };
            UserService.$inject = ["$http", "httpWrapperService"];
            return UserService;
        }());
        useradministration.UserService = UserService;
        angular
            .module("insite")
            .service("userService", UserService);
    })(useradministration = insite.useradministration || (insite.useradministration = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.user.service.js.map