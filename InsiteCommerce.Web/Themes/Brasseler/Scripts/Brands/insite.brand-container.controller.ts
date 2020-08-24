module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;

    export interface IBrandContainerAttributes {
        isEditMode: boolean;
        containerId: string;
    }

    export class BrandContainerController {
        isEditMode: boolean;
        containerElement: ng.IAugmentedJQuery;
        hasLeftColumnContent: boolean;
        hasRightColumnContent: boolean;

        static $inject = [
            "$window",
            "brandService",
            "$attrs",
            "$timeout"
        ];

        constructor(
            protected $window: ng.IWindowService,
            protected brandService: IBrandService,
            protected $attrs: IBrandContainerAttributes,
            protected $timeout: ng.ITimeoutService) {
        }

        $onInit(): void {
            this.isEditMode = this.$attrs.isEditMode.toString().toLowerCase() === "true";
            this.containerElement = angular.element(`[container-id='${this.$attrs.containerId}']`);

            this.brandService.getBrandByPath(this.$window.location.pathname).then(
                (brand: BrandModel) => { this.getBrandByPathCompleted(brand); },
                (error: any) => { this.getBrandByPathFailed(error); });
        }

        protected getBrandByPathCompleted(brand: BrandModel): void {
            this.$timeout(() => {
                this.hasLeftColumnContent = this.containerElement.find(".left-brand-container *:not([ng-controller])").length > 0;
                this.hasRightColumnContent = this.containerElement.find(".right-brand-container *:not([ng-controller])").length > 0;
            }, 0);
        }

        protected getBrandByPathFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("BrandContainerController", BrandContainerController);
}