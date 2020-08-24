var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandCategoriesController = /** @class */ (function () {
            function BrandCategoriesController($window, brandService) {
                this.$window = $window;
                this.brandService = brandService;
            }
            BrandCategoriesController.prototype.$onInit = function () {
                var _this = this;
                this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
            };
            BrandCategoriesController.prototype.getBrandByPathCompleted = function (brand) {
                this.brandId = brand.id.toString();
                this.getBrandCategories();
            };
            BrandCategoriesController.prototype.getBrandByPathFailed = function (error) {
            };
            BrandCategoriesController.prototype.getBrandCategories = function () {
                var _this = this;
                var pagination = {
                    page: 1,
                    pageSize: 1000
                };
                this.brandService.getBrandCategories({ brandId: this.brandId, pagination: pagination, sort: "name", maximumDepth: 2 }).then(function (brandCategoryCollection) { _this.getBrandCategoriesCompleted(brandCategoryCollection); }, function (error) { _this.getBrandCategoriesFailed(error); });
            };
            BrandCategoriesController.prototype.getBrandCategoriesCompleted = function (brandCategoryCollection) {
                this.brandCategories = brandCategoryCollection.brandCategories;
                this.totalItemCount = brandCategoryCollection.pagination.totalItemCount;
            };
            BrandCategoriesController.prototype.getBrandCategoriesFailed = function (error) {
            };
            BrandCategoriesController.$inject = ["$window", "brandService"];
            return BrandCategoriesController;
        }());
        brands.BrandCategoriesController = BrandCategoriesController;
        angular
            .module("insite")
            .controller("BrandCategoriesController", BrandCategoriesController);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand-categories.controller.js.map