var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        var BrandService = /** @class */ (function () {
            function BrandService($http, httpWrapperService, $q) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.$q = $q;
                this.serviceUri = "/api/v1/brands";
                this.serviceAlphabetUri = "/api/v1/brandAlphabet";
                this.serviceGetByPathUri = "/api/v1/brands/getByPath";
                this.currentBrandPromises = {};
            }
            BrandService.prototype.getBrandAlphabet = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceAlphabetUri }), this.getBrandAlphabetCompleted, this.getBrandAlphabetFailed);
            };
            BrandService.prototype.getBrandAlphabetCompleted = function (response) {
            };
            BrandService.prototype.getBrandAlphabetFailed = function (error) {
            };
            BrandService.prototype.getBrands = function (getBrandsParameter) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getBrandsParams(getBrandsParameter) }), this.getBrandsCompleted, this.getBrandsFailed);
            };
            BrandService.prototype.getBrandsParams = function (getBrandsParameter) {
                var params = getBrandsParameter ? JSON.parse(JSON.stringify(getBrandsParameter)) : {};
                delete params.pagination;
                if (getBrandsParameter && getBrandsParameter.pagination) {
                    params.page = getBrandsParameter.pagination.page;
                    params.pageSize = getBrandsParameter.pagination.pageSize;
                }
                return params;
            };
            BrandService.prototype.getBrandsCompleted = function (response) {
            };
            BrandService.prototype.getBrandsFailed = function (error) {
            };
            BrandService.prototype.getBrandByPath = function (path) {
                var _this = this;
                if (this.currentBrandPromises[path]) {
                    return this.currentBrandPromises[path];
                }
                var deferred = this.$q.defer();
                this.$http({ method: "GET", url: this.serviceGetByPathUri, params: this.getBrandByPathParams(path) }).then(function (response) {
                    _this.getBrandByPathCompleted(response);
                    deferred.resolve(response.data);
                    delete _this.currentBrandPromises[path];
                }, function (error) {
                    _this.getBrandByPathFailed(error);
                    deferred.reject(error);
                    delete _this.currentBrandPromises[path];
                });
                this.currentBrandPromises[path] = deferred.promise;
                return this.currentBrandPromises[path];
            };
            BrandService.prototype.getBrandByPathParams = function (path) {
                return { path: path };
            };
            BrandService.prototype.getBrandByPathCompleted = function (response) {
            };
            BrandService.prototype.getBrandByPathFailed = function (error) {
            };
            BrandService.prototype.getBrandProductLines = function (getBrandProductLinesParameter) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri + "/" + getBrandProductLinesParameter.brandId + "/productlines", params: this.getBrandProductLinesParams(getBrandProductLinesParameter) }), this.getBrandProductLinesCompleted, this.getBrandProductLinesFailed);
            };
            BrandService.prototype.getBrandProductLinesParams = function (getBrandProductLinesParameter) {
                var params = getBrandProductLinesParameter ? JSON.parse(JSON.stringify(getBrandProductLinesParameter)) : {};
                delete params.pagination;
                if (getBrandProductLinesParameter && getBrandProductLinesParameter.pagination) {
                    params.page = getBrandProductLinesParameter.pagination.page;
                    params.pageSize = getBrandProductLinesParameter.pagination.pageSize;
                }
                return params;
            };
            BrandService.prototype.getBrandProductLinesCompleted = function (response) {
            };
            BrandService.prototype.getBrandProductLinesFailed = function (error) {
            };
            BrandService.prototype.getBrandCategories = function (getBrandCategoriesParameter) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri + "/" + getBrandCategoriesParameter.brandId + "/categories", params: this.getBrandCategoriesParams(getBrandCategoriesParameter) }), this.getBrandCategoriesCompleted, this.getBrandCategoriesFailed);
            };
            BrandService.prototype.getBrandCategoriesParams = function (getBrandCategoriesParameter) {
                var params = getBrandCategoriesParameter ? JSON.parse(JSON.stringify(getBrandCategoriesParameter)) : {};
                delete params.pagination;
                if (getBrandCategoriesParameter && getBrandCategoriesParameter.pagination) {
                    params.page = getBrandCategoriesParameter.pagination.page;
                    params.pageSize = getBrandCategoriesParameter.pagination.pageSize;
                }
                return params;
            };
            BrandService.prototype.getBrandCategoriesCompleted = function (response) {
            };
            BrandService.prototype.getBrandCategoriesFailed = function (error) {
            };
            BrandService.$inject = ["$http", "httpWrapperService", "$q"];
            return BrandService;
        }());
        brands.BrandService = BrandService;
        angular
            .module("insite")
            .service("brandService", BrandService);
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand.service.js.map