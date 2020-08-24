var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandImageController = /** @class */ (function () {
            function BrandImageController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
            }
            BrandImageController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            BrandImageController.prototype.getBrandByPathCompleted = function (brand) {
                this.brand = brand;
            };
            BrandImageController.prototype.getBrandByPathFailed = function (error) {
            };
            BrandImageController.$inject = [
                "$window",
                "brandService"
            ];
            return BrandImageController;
        }());
        brands.BrandImageController = BrandImageController;
        angular
            .module("insite")
            .controller("BrandImageController", BrandImageController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-image.controller.js.map