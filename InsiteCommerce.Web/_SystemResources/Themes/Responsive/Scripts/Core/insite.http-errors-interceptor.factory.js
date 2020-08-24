var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var HttpErrorsInterceptor = /** @class */ (function () {
            function HttpErrorsInterceptor($q, $rootScope, spinnerService) {
                var _this = this;
                this.$q = $q;
                this.$rootScope = $rootScope;
                this.spinnerService = spinnerService;
                this.xhrCreations = 0;
                this.xhrResolutions = 0;
                this.request = function (config) {
                    _this.xhrCreations++;
                    return config;
                };
                this.requestError = function (rejection) {
                    _this.xhrResolutions++;
                    _this.updateLoadingStatus();
                    return _this.$q.reject(rejection);
                };
                this.response = function (response) {
                    _this.xhrResolutions++;
                    _this.updateLoadingStatus();
                    return response;
                };
                this.responseError = function (response) {
                    _this.xhrResolutions++;
                    _this.updateLoadingStatus();
                    var config = response.config;
                    // TODO ditch bypassError completely?
                    if (config.bypassErrorInterceptor) {
                        return _this.$q.reject(response);
                    }
                    if (response.status === 500) {
                        _this.$rootScope.$broadcast("displayApiErrorPopup", response.data);
                    }
                    if (response.status === 404 && !_this.isApiRequest(config)) {
                        return _this.$q.when(response);
                    }
                    return _this.$q.reject(response);
                };
            }
            HttpErrorsInterceptor.prototype.updateLoadingStatus = function () {
                if (this.xhrResolutions >= this.xhrCreations) {
                    this.spinnerService.hideAll();
                }
            };
            HttpErrorsInterceptor.prototype.isApiRequest = function (config) {
                return config.url.length >= 5 && config.url.toLocaleLowerCase().substr(0, 5) === "/api/";
            };
            HttpErrorsInterceptor.$inject = ["$q", "$rootScope", "spinnerService"];
            return HttpErrorsInterceptor;
        }());
        core.HttpErrorsInterceptor = HttpErrorsInterceptor;
        angular
            .module("insite")
            .factory("httpErrorsInterceptor", ["$q", "$rootScope", "spinnerService", function ($q, $rootScope, spinnerService) {
                return new HttpErrorsInterceptor($q, $rootScope, spinnerService);
            }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.http-errors-interceptor.factory.js.map