module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;
    import BrandProductLineCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandProductLineCollectionModel;
    import BrandProductLineModel = Insite.Brands.WebApi.V1.ApiModels.BrandProductLineModel;

    export class ProductLinesController {
        brandId: string;
        productLines: BrandProductLineModel[];
        totalItemCount: number;
        itemCount = 8;

        static $inject = ["$window", "brandService"];

        constructor(protected $window: ng.IWindowService, protected brandService: IBrandService) {
        }

        $onInit(): void {
            this.brandService.getBrandByPath(this.$window.location.pathname).then(
                (brand: BrandModel) => { this.getBrandByPathCompleted(brand); },
                (error: any) => { this.getBrandByPathFailed(error); });
        }

        protected getBrandByPathCompleted(brand: BrandModel): void {
            this.brandId = brand.id.toString();
            this.getBrandProductLines();
        }

        protected getBrandByPathFailed(error: any): void {
        }

        getBrandProductLines(): void {
            const pagination = {
                page: 1,
                pageSize: 1000
            } as PaginationModel;

            this.brandService.getBrandProductLines({ brandId: this.brandId, pagination: pagination, sort: "name", getFeatured: true }).then(
                (brandProductLineCollection: BrandProductLineCollectionModel) => { this.getBrandProductLinesCompleted(brandProductLineCollection); },
                (error: any) => { this.getBrandProductLinesFailed(error); });
        }

        protected getBrandProductLinesCompleted(brandProductLineCollection: BrandProductLineCollectionModel): void {
            this.productLines = brandProductLineCollection.productLines;
            this.totalItemCount = brandProductLineCollection.pagination.totalItemCount;
        }

        protected getBrandProductLinesFailed(error: any): void {
        }

        showAll(): void {
            this.itemCount = this.totalItemCount;
        }
    }

    angular
        .module("insite")
        .controller("ProductLinesController", ProductLinesController);
}