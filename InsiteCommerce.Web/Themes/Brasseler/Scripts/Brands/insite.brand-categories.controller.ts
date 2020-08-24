module insite.brands {
    "use strict";

    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;
    import BrandCategoryCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandCategoryCollectionModel;
    import BrandCategoryModel = Insite.Brands.WebApi.V1.ApiModels.BrandCategoryModel;

    export class BrandCategoriesController {
        brandId: string;
        brandCategories: BrandCategoryModel[];
        totalItemCount: number;

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
            this.getBrandCategories();
        }

        protected getBrandByPathFailed(error: any): void {
        }

        getBrandCategories(): void {
            const pagination = {
                page: 1,
                pageSize: 1000
            } as PaginationModel;

            this.brandService.getBrandCategories({ brandId: this.brandId, pagination: pagination, sort: "name", maximumDepth: 2 }).then(
                (brandCategoryCollection: BrandCategoryCollectionModel) => { this.getBrandCategoriesCompleted(brandCategoryCollection); },
                (error: any) => { this.getBrandCategoriesFailed(error); });
        }

        protected getBrandCategoriesCompleted(brandCategoryCollection: BrandCategoryCollectionModel): void {
            this.brandCategories = brandCategoryCollection.brandCategories;
            this.totalItemCount = brandCategoryCollection.pagination.totalItemCount;
        }

        protected getBrandCategoriesFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("BrandCategoriesController", BrandCategoriesController);
}