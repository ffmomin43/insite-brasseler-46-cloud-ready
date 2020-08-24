var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var HttpWrapperService = /** @class */ (function () {
            function HttpWrapperService($http, $q) {
                this.$http = $http;
                this.$q = $q;
            }
            HttpWrapperService.prototype.executeHttpRequest = function (caller, requestMethod, completedFunction, failedFunction) {
                var deferred = this.$q.defer();
                requestMethod
                    .then(function (response) {
                    completedFunction.call(caller, response);
                    deferred.resolve(response.data);
                }, function (error) {
                    failedFunction.call(caller, error);
                    deferred.reject(error.data, error.status);
                });
                return deferred.promise;
            };
            HttpWrapperService.$inject = ["$http", "$q"];
            return HttpWrapperService;
        }());
        core.HttpWrapperService = HttpWrapperService;
        angular
            .module("insite")
            .service("httpWrapperService", HttpWrapperService);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.http-wrapper.service.js.map