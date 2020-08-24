var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var ProductLinesController = /** @class */ (function () {
            function ProductLinesController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
                this.itemCount = 8;
            }
            ProductLinesController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            ProductLinesController.prototype.getBrandByPathCompleted = function (brand) {
                this.brandId = brand.id.toString();
                this.getBrandProductLines();
            };
            ProductLinesController.prototype.getBrandByPathFailed = function (error) {
            };
            ProductLinesController.prototype.getBrandProductLines = function () {
                var _this = this;
                var pagination = {
                    page: 1,
                    pageSize: 1000
                };
                this.brandService.getBrandProductLines({ brandId: this.brandId, pagination: pagination, sort: "name", getFeatured: true }).then(function (brandProductLineCollection) { _this.getBrandProductLinesCompleted(brandProductLineCollection); }, function (error) { _this.getBrandProductLinesFailed(error); });
            };
            ProductLinesController.prototype.getBrandProductLinesCompleted = function (brandProductLineCollection) {
                this.productLines = brandProductLineCollection.productLines;
                this.totalItemCount = brandProductLineCollection.pagination.totalItemCount;
            };
            ProductLinesController.prototype.getBrandProductLinesFailed = function (error) {
            };
            ProductLinesController.prototype.showAll = function () {
                this.itemCount = this.totalItemCount;
            };
            ProductLinesController.$inject = ["$window", "brandService"];
            return ProductLinesController;
        }());
        brands.ProductLinesController = ProductLinesController;
        angular
            .module("insite")
            .controller("ProductLinesController", ProductLinesController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-lines.controller.js.map