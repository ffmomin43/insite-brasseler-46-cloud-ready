module insite.brands {
    "use strict";

    import BrandCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandCollectionModel;
    import BrandAlphabetModel = Insite.Brands.WebApi.V1.ApiModels.BrandAlphabetModel;
    import BrandModel = Insite.Brands.WebApi.V1.ApiModels.BrandModel;
    import BrandProductLineCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandProductLineCollectionModel;
    import BrandCategoryCollectionModel = Insite.Brands.WebApi.V1.ApiModels.BrandCategoryCollectionModel;

    export interface IGetBrandsParameter {
        sort: string;
        select?: string;
        pagination?: PaginationModel;
    }

    export interface IGetBrandProductLinesParameter {
        brandId: string;
        getFeatured?: boolean;
        getSponsored?: boolean;
        sort: string;
        pagination?: PaginationModel;
        expand?: string;
    }

    export interface IGetBrandCategoriesParameter {
        brandId: string;
        categoryId?: string;
        getHtmlContent?: boolean;
        getCustomProperties?: boolean;
        sort: string;
        pagination?: PaginationModel;
        maximumDepth: number;
    }

    export interface IBrandService {
        getBrandAlphabet(): ng.IPromise<BrandAlphabetModel>;
        getBrands(getBrandsParameter: IGetBrandsParameter): ng.IPromise<BrandCollectionModel>;
        getBrandByPath(path: string): ng.IPromise<BrandModel>;
        getBrandProductLines(getBrandProductLinesParameter: IGetBrandProductLinesParameter): ng.IPromise<BrandProductLineCollectionModel>;
        getBrandCategories(getBrandCategoriesParameter: IGetBrandCategoriesParameter): ng.IPromise<BrandCategoryCollectionModel>;
    }

    export class BrandService implements IBrandService {
        serviceUri = "/api/v1/brands";
        serviceAlphabetUri = "/api/v1/brandAlphabet";
        serviceGetByPathUri = "/api/v1/brands/getByPath";
        currentBrandPromises: {[path: string]: ng.IPromise<BrandModel>} = {};

        static $inject = ["$http", "httpWrapperService", "$q"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService,
            protected $q: ng.IQService) {
        }

        getBrandAlphabet(): ng.IPromise<BrandAlphabetModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceAlphabetUri }),
                this.getBrandAlphabetCompleted,
                this.getBrandAlphabetFailed);
        }

        protected getBrandAlphabetCompleted(response: ng.IHttpPromiseCallbackArg<BrandAlphabetModel>): void {
        }

        protected getBrandAlphabetFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getBrands(getBrandsParameter: IGetBrandsParameter): ng.IPromise<BrandCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getBrandsParams(getBrandsParameter) }),
                this.getBrandsCompleted,
                this.getBrandsFailed);
        }

        protected getBrandsParams(getBrandsParameter: IGetBrandsParameter): any {
            const params: any = getBrandsParameter ? JSON.parse(JSON.stringify(getBrandsParameter)) : {};

            delete params.pagination;
            if (getBrandsParameter && getBrandsParameter.pagination) {
                params.page = getBrandsParameter.pagination.page;
                params.pageSize = getBrandsParameter.pagination.pageSize;
            }

            return params;
        }

        protected getBrandsCompleted(response: ng.IHttpPromiseCallbackArg<BrandCollectionModel>): void {
        }

        protected getBrandsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getBrandByPath(path: string): ng.IPromise<BrandModel> {
            if (this.currentBrandPromises[path]) {
                return this.currentBrandPromises[path];
            }

            const deferred = this.$q.defer();
            this.$http({ method: "GET", url: this.serviceGetByPathUri, params: this.getBrandByPathParams(path) }).then((response: any) => {
                this.getBrandByPathCompleted(response);
                deferred.resolve(response.data);
                delete this.currentBrandPromises[path];
            }, (error: any) => {
                this.getBrandByPathFailed(error);
                deferred.reject(error);
                delete this.currentBrandPromises[path];
            });

            this.currentBrandPromises[path] = deferred.promise as any;
            return this.currentBrandPromises[path];
        }

        protected getBrandByPathParams(path: string): any {
            return { path: path };
        }

        protected getBrandByPathCompleted(response: ng.IHttpPromiseCallbackArg<BrandModel>): void {
        }

        protected getBrandByPathFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getBrandProductLines(getBrandProductLinesParameter: IGetBrandProductLinesParameter): ng.IPromise<BrandProductLineCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.serviceUri}/${getBrandProductLinesParameter.brandId}/productlines`, params: this.getBrandProductLinesParams(getBrandProductLinesParameter) }),
                this.getBrandProductLinesCompleted,
                this.getBrandProductLinesFailed);
        }

        protected getBrandProductLinesParams(getBrandProductLinesParameter: IGetBrandProductLinesParameter): any {
            const params: any = getBrandProductLinesParameter ? JSON.parse(JSON.stringify(getBrandProductLinesParameter)) : {};

            delete params.pagination;
            if (getBrandProductLinesParameter && getBrandProductLinesParameter.pagination) {
                params.page = getBrandProductLinesParameter.pagination.page;
                params.pageSize = getBrandProductLinesParameter.pagination.pageSize;
            }

            return params;
        }

        protected getBrandProductLinesCompleted(response: ng.IHttpPromiseCallbackArg<BrandCollectionModel>): void {
        }

        protected getBrandProductLinesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getBrandCategories(getBrandCategoriesParameter: IGetBrandCategoriesParameter): ng.IPromise<BrandCategoryCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.serviceUri}/${getBrandCategoriesParameter.brandId}/categories`, params: this.getBrandCategoriesParams(getBrandCategoriesParameter) }),
                this.getBrandCategoriesCompleted,
                this.getBrandCategoriesFailed);
        }

        protected getBrandCategoriesParams(getBrandCategoriesParameter: IGetBrandCategoriesParameter): any {
            const params: any = getBrandCategoriesParameter ? JSON.parse(JSON.stringify(getBrandCategoriesParameter)) : {};

            delete params.pagination;
            if (getBrandCategoriesParameter && getBrandCategoriesParameter.pagination) {
                params.page = getBrandCategoriesParameter.pagination.page;
                params.pageSize = getBrandCategoriesParameter.pagination.pageSize;
            }

            return params;
        }

        protected getBrandCategoriesCompleted(response: ng.IHttpPromiseCallbackArg<BrandCollectionModel>): void {
        }

        protected getBrandCategoriesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("brandService", BrandService);
}