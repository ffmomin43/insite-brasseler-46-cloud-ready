var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var AuthenticationInterceptor = /** @class */ (function () {
            function AuthenticationInterceptor($window, $q, spinnerService) {
                var _this = this;
                this.$window = $window;
                this.$q = $q;
                this.spinnerService = spinnerService;
                this.request = function (config) {
                    config.headers = config.headers || {};
                    if (config.url.indexOf("account/isauthenticated") === -1 && _this.$window.localStorage.getItem("accessToken")) {
                        config.headers.Authorization = "Bearer " + _this.$window.localStorage.getItem("accessToken");
                    }
                    if (config.url.substr(0, 1) === "/" && insiteMicrositeUriPrefix && insiteMicrositeUriPrefix.length > 0) {
                        if (config.url.toLocaleLowerCase().indexOf("/partialviews/") === -1) {
                            var addMicrositeToUrl = insiteMicrositeUriPrefix.substr(1);
                            if (config.url.indexOf("?") === -1) {
                                addMicrositeToUrl = "?microsite=" + addMicrositeToUrl;
                            }
                            else {
                                addMicrositeToUrl = "&microsite=" + addMicrositeToUrl;
                            }
                            config.url += addMicrositeToUrl;
                        }
                        else {
                            config.url = "" + insiteMicrositeUriPrefix + config.url;
                        }
                    }
                    return config;
                };
                this.responseError = function (response) {
                    _this.spinnerService.hide();
                    if (response.status === 401) {
                        // If we got a 401, but do have a local access token, then our access token has expired, need to remove it
                        // Note: We can't use sessionService.isAuthenticated() because of circular dependency
                        if (_this.$window.localStorage.getItem("accessToken") !== null) {
                            _this.$window.localStorage.removeItem("accessToken");
                            // force reload the browser window to invalidate all the etags and not get any stale data
                            _this.$window.location.reload(true);
                        }
                    }
                    return _this.$q.reject(response);
                };
            }
            AuthenticationInterceptor.$inject = ["$window", "$q", "spinnerService"];
            return AuthenticationInterceptor;
        }());
        core.AuthenticationInterceptor = AuthenticationInterceptor;
        angular
            .module("insite")
            .factory("authenticationInterceptor", ["$window", "$q", "spinnerService", function ($window, $q, spinnerService) {
                return new AuthenticationInterceptor($window, $q, spinnerService);
            }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.authentication-interceptor.factory.js.map