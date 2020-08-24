module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;

    export class ShopAllProductsController {
        productListPagePath: string;

        static $inject = ["$window", "brandService"];

        constructor(protected $window: ng.IWindowService, protected brandService: IBrandService) {
        }

        $onInit(): void {
            this.brandService.getBrandByPath(this.$window.location.pathname).then(
                (brand: BrandModel) => { this.getBrandByPathCompleted(brand); },
                (error: any) => { this.getBrandByPathFailed(error); });
        }

        protected getBrandByPathCompleted(brand: BrandModel): void {
            this.productListPagePath = brand.productListPagePath;
        }

        protected getBrandByPathFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("ShopAllProductsController", ShopAllProductsController);
}