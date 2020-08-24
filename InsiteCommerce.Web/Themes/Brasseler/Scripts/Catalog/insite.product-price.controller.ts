module insite.catalog {
    "use strict";

    export class ProductPriceController {
        static $inject = [ "productPriceService" ];

        constructor(protected productPriceService: IProductPriceService) {
        }

        getUnitNetPriceDisplay(product: ProductDto): string {
            return this.productPriceService.getUnitNetPrice(product).priceDisplay;
        }

        getUnitListPriceDisplay(product: ProductDto): string {
            return this.productPriceService.getUnitListPrice(product).priceDisplay;
        }
    };

    angular
        .module("insite")
        .controller("ProductPriceController", ProductPriceController);
}