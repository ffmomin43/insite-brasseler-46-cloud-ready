var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandLogoController = /** @class */ (function () {
            function BrandLogoController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
            }
            BrandLogoController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            BrandLogoController.prototype.getBrandByPathCompleted = function (brand) {
                this.brandName = brand.name;
                this.logoLargeImagePath = brand.logoLargeImagePath;
                this.logoAltText = brand.logoAltText;
            };
            BrandLogoController.prototype.getBrandByPathFailed = function (error) {
            };
            BrandLogoController.$inject = ["$window", "brandService"];
            return BrandLogoController;
        }());
        brands.BrandLogoController = BrandLogoController;
        angular
            .module("insite")
            .controller("BrandLogoController", BrandLogoController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-logo.controller.js.map