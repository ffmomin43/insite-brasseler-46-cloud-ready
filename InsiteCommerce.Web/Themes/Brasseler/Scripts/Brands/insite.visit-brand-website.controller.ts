module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;

    export class VisitBrandWebsiteController {
        externalUrl: string;

        static $inject = ["$window", "brandService"];

        constructor(protected $window: ng.IWindowService, protected brandService: IBrandService) {
        }

        $onInit(): void {
            this.brandService.getBrandByPath(this.$window.location.pathname).then(
                (brand: BrandModel) => { this.getBrandByPathCompleted(brand); },
                (error: any) => { this.getBrandByPathFailed(error); });
        }

        protected getBrandByPathCompleted(brand: BrandModel): void {
            this.externalUrl = brand.externalUrl;
        }

        protected getBrandByPathFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("VisitBrandWebsiteController", VisitBrandWebsiteController);
}