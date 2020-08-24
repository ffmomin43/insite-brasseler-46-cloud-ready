var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandContainerController = /** @class */ (function () {
            function BrandContainerController($window, brandService, $attrs, $timeout) {
                this.$window = $window;
                this.brandService = brandService;
                this.$attrs = $attrs;
                this.$timeout = $timeout;
            }
            BrandContainerController.prototype.$onInit = function () {
                var _this = this;
                this.isEditMode = this.$attrs.isEditMode.toString().toLowerCase() === "true";
                this.containerElement = angular.element("[container-id='" + this.$attrs.containerId + "']");
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            BrandContainerController.prototype.getBrandByPathCompleted = function (brand) {
                var _this = this;
                this.$timeout(function () {
                    _this.hasLeftColumnContent = _this.containerElement.find(".left-brand-container *:not([ng-controller])").length > 0;
                    _this.hasRightColumnContent = _this.containerElement.find(".right-brand-container *:not([ng-controller])").length > 0;
                }, 0);
            };
            BrandContainerController.prototype.getBrandByPathFailed = function (error) {
            };
            BrandContainerController.$inject = [
                "$window",
                "brandService",
                "$attrs",
                "$timeout"
            ];
            return BrandContainerController;
        }());
        brands.BrandContainerController = BrandContainerController;
        angular
            .module("insite")
            .controller("BrandContainerController", BrandContainerController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-container.controller.js.map