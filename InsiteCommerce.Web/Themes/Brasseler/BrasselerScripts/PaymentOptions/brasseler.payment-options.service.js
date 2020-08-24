var insite;
(function (insite) {
    var paymentoptions;
    (function (paymentoptions) {
        "use strict";
        var UserPaymentProfileService = /** @class */ (function () {
            function UserPaymentProfileService($http, $q, coreService, $window, httpWrapperService) {
                this.$http = $http;
                this.$q = $q;
                this.coreService = coreService;
                this.$window = $window;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/userpaymentprofile";
                this.expand = "";
            }
            UserPaymentProfileService.prototype.getUserPaymentProfiles = function () {
                var uri = this.serviceUri;
                var params = {};
                return this.$http({
                    url: uri,
                    method: "GET",
                    params: params,
                    bypassErrorInterceptor: true,
                    headers: { 'Cache-Control': 'no-cache' } //BUSA-605 : Set Default functionality is not working when user reloads the page from "Manage Payment Options" page.
                });
            };
            UserPaymentProfileService.prototype.deleteUserPaymentProfile = function (userPaymentProfile) {
                var deferred = this.$q.defer();
                return this.$http.delete(userPaymentProfile.uri, { bypassErrorInterceptor: true })
                    .success(function (result) {
                    return deferred.resolve(result);
                });
            };
            //BUSA-1122 Allowing user to update expiry date of existing CC start.
            UserPaymentProfileService.prototype.updateUserPaymentProfile = function (userPaymentProfile, refresh) {
                var _this = this;
                var deferred = this.$q.defer();
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: userPaymentProfile.uri, data: userPaymentProfile }), function (response) { _this.updateCardCompleted(response, refresh); }, this.updateCartFailed);
            };
            UserPaymentProfileService.prototype.updateCardCompleted = function (response, refresh) {
                if (refresh) {
                    //this.getCart();
                    //this.$rootScope.$broadcast("cartChanged");
                }
            };
            UserPaymentProfileService.prototype.updateCartFailed = function (error) {
            };
            UserPaymentProfileService.$inject = ["$http", "$q", "coreService", "$window", "httpWrapperService"];
            return UserPaymentProfileService;
        }());
        paymentoptions.UserPaymentProfileService = UserPaymentProfileService;
        angular
            .module("insite")
            .service("userPaymentProfileService", UserPaymentProfileService);
    })(paymentoptions = insite.paymentoptions || (insite.paymentoptions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.payment-options.service.js.map