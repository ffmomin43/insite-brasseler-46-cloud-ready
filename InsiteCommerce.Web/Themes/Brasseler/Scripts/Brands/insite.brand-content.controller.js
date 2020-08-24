var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandContentController = /** @class */ (function () {
            function BrandContentController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
            }
            BrandContentController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            BrandContentController.prototype.getBrandByPathCompleted = function (brand) {
                this.brand = brand;
            };
            BrandContentController.prototype.getBrandByPathFailed = function (error) {
            };
            BrandContentController.$inject = [
                "$window",
                "brandService"
            ];
            return BrandContentController;
        }());
        brands.BrandContentController = BrandContentController;
        angular
            .module("insite")
            .controller("BrandContentController", BrandContentController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-content.controller.js.map