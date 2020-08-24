var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductComparisonHopperController = /** @class */ (function () {
            function ProductComparisonHopperController($rootScope, $scope, productService, compareProductsService, coreService, $localStorage) {
                this.$rootScope = $rootScope;
                this.$scope = $scope;
                this.productService = productService;
                this.compareProductsService = compareProductsService;
                this.coreService = coreService;
                this.$localStorage = $localStorage;
            }
            ProductComparisonHopperController.prototype.$onInit = function () {
                var _this = this;
                this.productsToCompare = []; // full product objects
                // add product from product list controller
                var removeAddProductToCompare = this.$rootScope.$on("addProductToCompare", function (event, product) {
                    _this.onAddProductToCompare(event, product);
                });
                // remove product from product list controller
                var removeRemoveProductToCompare = this.$rootScope.$on("removeProductToCompare", function (event, productId) {
                    _this.onRemoveProductToCompare(event, productId);
                });
                this.$scope.$on("$destroy", function () {
                    removeAddProductToCompare();
                    removeRemoveProductToCompare();
                });
                // kill the hopper when we leave the product list page
                var removeListener = this.$rootScope.$on("$stateChangeStart", function () {
                    _this.$scope.$destroy();
                    $(".compare-hopper").remove();
                    removeListener();
                });
                this.setProductData();
            };
            ProductComparisonHopperController.prototype.onAddProductToCompare = function (event, product) {
                this.addProductToCompare(product);
            };
            ProductComparisonHopperController.prototype.onRemoveProductToCompare = function (event, productId) {
                this.removeProductToCompare(productId);
            };
            ProductComparisonHopperController.prototype.canShowCompareHopper = function () {
                return this.productsToCompare.length > 0;
            };
            ProductComparisonHopperController.prototype.setProductData = function () {
                var _this = this;
                var productIdsToCompare = this.compareProductsService.getProductIds();
                if (productIdsToCompare && productIdsToCompare.length > 0) {
                    var parameter = { productIds: productIdsToCompare };
                    this.productService.getProducts(parameter).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
                }
            };
            ProductComparisonHopperController.prototype.getProductsCompleted = function (productCollection) {
                this.productsToCompare = productCollection.products;
            };
            ProductComparisonHopperController.prototype.getProductsFailed = function (error) {
            };
            ProductComparisonHopperController.prototype.addProductToCompare = function (product) {
                this.productsToCompare.push(product);
            };
            ProductComparisonHopperController.prototype.removeProductToCompare = function (productId) {
                lodash.remove(this.productsToCompare, function (p) { return p.id === productId; });
            };
            ProductComparisonHopperController.prototype.clickRemove = function (product) {
                this.removeProductToCompare(product.id.toString());
                if (this.compareProductsService.removeProduct(product.id.toString())) {
                    this.updateProductList();
                }
            };
            ProductComparisonHopperController.prototype.removeAllProductsToCompare = function () {
                this.compareProductsService.removeAllProducts();
                this.productsToCompare = [];
                this.updateProductList();
            };
            // tell the product list page to clear compare check boxes
            ProductComparisonHopperController.prototype.updateProductList = function () {
                this.$rootScope.$broadcast("compareProductsUpdated");
            };
            ProductComparisonHopperController.prototype.storeReturnUrl = function () {
                this.$localStorage.set("compareReturnUrl", this.coreService.getCurrentPath());
            };
            ProductComparisonHopperController.$inject = ["$rootScope", "$scope", "productService", "compareProductsService", "coreService", "$localStorage"];
            return ProductComparisonHopperController;
        }());
        catalog.ProductComparisonHopperController = ProductComparisonHopperController;
        angular
            .module("insite")
            .controller("ProductComparisonHopperController", ProductComparisonHopperController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-comparison-hopper.controller.js.map