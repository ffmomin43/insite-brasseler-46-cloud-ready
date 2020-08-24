module insite.catalog {
    "use strict";

    export class ProductSalePriceLabelController {
        static $inject = ["productPriceService"];

        constructor(protected productPriceService: IProductPriceService) {
        }

        showSalePriceLabel(product: ProductDto): boolean {
            return this.productPriceService.getUnitNetPrice(product).price < this.productPriceService.getUnitListPrice(product).price;
        }

        showSalePriceLabelForOrderHistory(orderLine: OrderLineModel): boolean {
            return orderLine.unitNetPrice < orderLine.unitListPrice;
        }
    };

    angular
        .module("insite")
        .controller("ProductSalePriceLabelController", ProductSalePriceLabelController);
}