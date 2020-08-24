var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductPriceController = /** @class */ (function () {
            function ProductPriceController(productPriceService) {
                this.productPriceService = productPriceService;
            }
            ProductPriceController.prototype.getUnitNetPriceDisplay = function (product) {
                return this.productPriceService.getUnitNetPrice(product).priceDisplay;
            };
            ProductPriceController.prototype.getUnitListPriceDisplay = function (product) {
                return this.productPriceService.getUnitListPrice(product).priceDisplay;
            };
            ProductPriceController.$inject = ["productPriceService"];
            return ProductPriceController;
        }());
        catalog.ProductPriceController = ProductPriceController;
        ;
        angular
            .module("insite")
            .controller("ProductPriceController", ProductPriceController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-price.controller.js.map