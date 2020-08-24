var insite;
(function (insite) {
    var common;
    (function (common) {
        "use strict";
        var AccessTokenService = /** @class */ (function () {
            function AccessTokenService($http, $rootScope, $q, $localStorage, $window, ipCookie, base64) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.$localStorage = $localStorage;
                this.$window = $window;
                this.ipCookie = ipCookie;
                this.base64 = base64;
                this.tokenUri = "/identity/connect/token";
            }
            AccessTokenService.prototype.generate = function (username, password) {
                var data = "grant_type=password&username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&scope=" + insiteScope + " offline_access";
                var config = {
                    headers: {
                        "Authorization": "Basic " + this.base64.encode(insiteBasicAuthHeader),
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    bypassErrorInterceptor: true
                };
                return this.returnResult(data, config);
            };
            AccessTokenService.prototype.refresh = function (refreshToken) {
                var insiteBasicAuth = insiteBasicAuthHeader.split(":");
                var data = "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken) + "&client_id=" + insiteBasicAuth[0] + "&client_secret=" + insiteBasicAuth[1];
                var config = {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    bypassErrorInterceptor: true,
                    skipAddAccessToken: true
                };
                return this.returnResult(data, config);
            };
            AccessTokenService.prototype.returnResult = function (data, config) {
                var deferred = this.$q.defer();
                this.$http.post(this.tokenUri, data, config)
                    .success(function (result) { return deferred.resolve({
                    accessToken: result.access_token,
                    refreshToken: result.refresh_token,
                    expiresIn: result.expires_in
                }); })
                    .error(function (error, status) {
                    deferred.reject({
                        errorCode: error.error,
                        message: error.error_description,
                        status: status
                    });
                });
                return deferred.promise;
            };
            AccessTokenService.prototype.set = function (accessToken) {
                this.$localStorage.set("accessToken", accessToken);
            };
            AccessTokenService.prototype.get = function () {
                return this.$localStorage.get("accessToken");
            };
            AccessTokenService.prototype.remove = function () {
                if (this.$localStorage.get("accessToken")) {
                    this.$localStorage.remove("accessToken");
                }
            };
            AccessTokenService.prototype.exists = function () {
                return this.$localStorage.get("accessToken", null) !== null;
            };
            AccessTokenService.prototype.clear = function () {
                sessionStorage.clear();
                this.remove();
            };
            AccessTokenService.$inject = ["$http", "$rootScope", "$q", "$localStorage", "$window", "ipCookie", "base64"];
            return AccessTokenService;
        }());
        common.AccessTokenService = AccessTokenService;
        angular
            .module("insite-common")
            .service("accessToken", AccessTokenService);
    })(common = insite.common || (insite.common = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.access-token.service.js.map