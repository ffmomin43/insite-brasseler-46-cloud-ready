var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var ShopAllProductsController = /** @class */ (function () {
            function ShopAllProductsController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
            }
            ShopAllProductsController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            ShopAllProductsController.prototype.getBrandByPathCompleted = function (brand) {
                this.productListPagePath = brand.productListPagePath;
            };
            ShopAllProductsController.prototype.getBrandByPathFailed = function (error) {
            };
            ShopAllProductsController.$inject = ["$window", "brandService"];
            return ShopAllProductsController;
        }());
        brands.ShopAllProductsController = ShopAllProductsController;
        angular
            .module("insite")
            .controller("ShopAllProductsController", ShopAllProductsController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.shop-all-products.controller.js.map