var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductSalePriceLabelController = /** @class */ (function () {
            function ProductSalePriceLabelController(productPriceService) {
                this.productPriceService = productPriceService;
            }
            ProductSalePriceLabelController.prototype.showSalePriceLabel = function (product) {
                return this.productPriceService.getUnitNetPrice(product).price < this.productPriceService.getUnitListPrice(product).price;
            };
            ProductSalePriceLabelController.prototype.showSalePriceLabelForOrderHistory = function (orderLine) {
                return orderLine.unitNetPrice < orderLine.unitListPrice;
            };
            ProductSalePriceLabelController.$inject = ["productPriceService"];
            return ProductSalePriceLabelController;
        }());
        catalog.ProductSalePriceLabelController = ProductSalePriceLabelController;
        ;
        angular
            .module("insite")
            .controller("ProductSalePriceLabelController", ProductSalePriceLabelController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-sale-price-label.controller.js.map