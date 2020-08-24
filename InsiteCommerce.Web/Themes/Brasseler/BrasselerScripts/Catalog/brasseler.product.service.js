var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var BrasselerProductService = /** @class */ (function () {
            function BrasselerProductService($http, $q, coreService) {
                this.$http = $http;
                this.$q = $q;
                this.coreService = coreService;
                this.productServiceUri = "/api/v1/products/";
            }
            BrasselerProductService.prototype.getReplacementProductData = function (productId) {
                var query = "?parameter.replaceProducts=true";
                var uri = this.productServiceUri + productId + query;
                var deferred = this.$q.defer();
                this.$http.get(uri, { bypassErrorInterceptor: true })
                    .success(function (result) {
                    return deferred.resolve(result);
                })
                    .error(deferred.reject);
                return deferred.promise;
            };
            return BrasselerProductService;
        }());
        catalog.BrasselerProductService = BrasselerProductService;
        bfactory.$inject = ["$http", "$q", "coreService"];
        function bfactory($http, $q, coreService) {
            return new BrasselerProductService($http, $q, coreService);
        }
        angular
            .module("insite")
            .factory("brasslerProductService", bfactory);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.product.service.js.map