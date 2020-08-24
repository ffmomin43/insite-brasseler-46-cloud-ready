module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;

    export class BrandLogoController {
        brandName: string;
        logoLargeImagePath: string;
        logoAltText: string;

        static $inject = ["$window", "brandService"];

        constructor(protected $window: ng.IWindowService, protected brandService: IBrandService) {
        }

        $onInit(): void {
            this.brandService.getBrandByPath(this.$window.location.pathname).then(
                (brand: BrandModel) => { this.getBrandByPathCompleted(brand); },
                (error: any) => { this.getBrandByPathFailed(error); });
        }

        protected getBrandByPathCompleted(brand: BrandModel): void {
            this.brandName = brand.name;
            this.logoLargeImagePath = brand.logoLargeImagePath;
            this.logoAltText = brand.logoAltText;
        }

        protected getBrandByPathFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("BrandLogoController", BrandLogoController);
}