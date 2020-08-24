module insite.catalog {
    "use strict";

    export interface IBrasselerProductService {
        getReplacementProductData(productId: string): ng.IPromise<ProductModel>;
    }

    export class BrasselerProductService implements IBrasselerProductService {
        productServiceUri = "/api/v1/products/";
        constructor(
            protected $http: ng.IHttpService,
            protected $q: ng.IQService,
            protected coreService: core.ICoreService) {
        }

        getReplacementProductData(productId: string): ng.IPromise<ProductModel> {
            var query = "?parameter.replaceProducts=true";
            var uri = this.productServiceUri + productId + query;
            var deferred = this.$q.defer<ProductModel>();
            this.$http.get<ProductModel>(uri, { bypassErrorInterceptor: true })
                .success(function (result) {
                    return deferred.resolve(result);
                })
                .error(deferred.reject);
            return deferred.promise;
        }
    }
    bfactory.$inject = ["$http", "$q", "coreService"];
    function bfactory(
        $http: ng.IHttpService,
        $q: ng.IQService,
        coreService: core.ICoreService): BrasselerProductService {
        return new BrasselerProductService($http, $q, coreService);
    }

    angular
        .module("insite")
        .factory("brasslerProductService", bfactory);

}