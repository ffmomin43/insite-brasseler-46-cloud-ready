module insite.catalog {
    "use strict";

    export interface ICompareProductsService {
        getProductIds(): System.Guid[];
        addProduct(product: ProductDto): boolean;
        removeProduct(product: string): boolean;
        removeAllProducts(): void;
    }

    export class CompareProductsService implements ICompareProductsService {
        cacheKey = "compareProducts";

        static $inject = ["$localStorage", "$rootScope"];

        constructor(
            protected $localStorage: common.IWindowStorage,
            protected $rootScope: ng.IRootScopeService) {
        }

        getProductIds(): System.Guid[] {
            return this.$localStorage.getObject(this.cacheKey, []);
        }

        addProduct(product: ProductDto): boolean {
            const productIds = this.$localStorage.getObject(this.cacheKey, []);
            if (!lodash.contains(productIds, product.id)) {
                productIds.push(product.id);
                this.$localStorage.setObject(this.cacheKey, productIds);
                this.$rootScope.$broadcast("addProductToCompare", product);
                return true;
            }

            return false;
        }

        removeProduct(productId: string): boolean {
            const productIds: System.Guid[] = this.$localStorage.getObject(this.cacheKey, []);
            if (lodash.contains(productIds, productId)) {
                lodash.pull(productIds, productId);
                this.$localStorage.setObject(this.cacheKey, productIds);
                this.$rootScope.$broadcast("removeProductToCompare", productId);
                return true;
            }

            return false;
        }

        removeAllProducts(): void {
            this.$localStorage.setObject("compareProducts", []);
        }
    }

    angular
        .module("insite")
        .service("compareProductsService", CompareProductsService);
}