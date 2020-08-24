var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var CompareProductsService = /** @class */ (function () {
            function CompareProductsService($localStorage, $rootScope) {
                this.$localStorage = $localStorage;
                this.$rootScope = $rootScope;
                this.cacheKey = "compareProducts";
            }
            CompareProductsService.prototype.getProductIds = function () {
                return this.$localStorage.getObject(this.cacheKey, []);
            };
            CompareProductsService.prototype.addProduct = function (product) {
                var productIds = this.$localStorage.getObject(this.cacheKey, []);
                if (!lodash.contains(productIds, product.id)) {
                    productIds.push(product.id);
                    this.$localStorage.setObject(this.cacheKey, productIds);
                    this.$rootScope.$broadcast("addProductToCompare", product);
                    return true;
                }
                return false;
            };
            CompareProductsService.prototype.removeProduct = function (productId) {
                var productIds = this.$localStorage.getObject(this.cacheKey, []);
                if (lodash.contains(productIds, productId)) {
                    lodash.pull(productIds, productId);
                    this.$localStorage.setObject(this.cacheKey, productIds);
                    this.$rootScope.$broadcast("removeProductToCompare", productId);
                    return true;
                }
                return false;
            };
            CompareProductsService.prototype.removeAllProducts = function () {
                this.$localStorage.setObject("compareProducts", []);
            };
            CompareProductsService.$inject = ["$localStorage", "$rootScope"];
            return CompareProductsService;
        }());
        catalog.CompareProductsService = CompareProductsService;
        angular
            .module("insite")
            .service("compareProductsService", CompareProductsService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.compare-products.service.js.map