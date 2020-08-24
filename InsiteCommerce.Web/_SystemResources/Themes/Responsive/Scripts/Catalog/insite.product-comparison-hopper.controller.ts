module insite.catalog {
    "use strict";

    export class ProductComparisonHopperController {
        productsToCompare: ProductDto[];

        static $inject = ["$rootScope", "$scope", "productService", "compareProductsService", "coreService", "$localStorage"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected $scope: ng.IScope,
            protected productService: IProductService,
            protected compareProductsService: ICompareProductsService,
            protected coreService: core.ICoreService,
            protected $localStorage: common.IWindowStorage) {
        }

        $onInit(): void {
            this.productsToCompare = []; // full product objects

            // add product from product list controller
            const removeAddProductToCompare = this.$rootScope.$on("addProductToCompare", (event: ng.IAngularEvent, product: ProductDto) => {
                this.onAddProductToCompare(event, product);
            });

            // remove product from product list controller
            const removeRemoveProductToCompare = this.$rootScope.$on("removeProductToCompare", (event: ng.IAngularEvent, productId: string) => {
                this.onRemoveProductToCompare(event, productId);
            });

            this.$scope.$on("$destroy", () => {
                removeAddProductToCompare();
                removeRemoveProductToCompare();
            });

            // kill the hopper when we leave the product list page
            const removeListener = this.$rootScope.$on("$stateChangeStart", () => {
                this.$scope.$destroy();
                $(".compare-hopper").remove();
                removeListener();
            });

            this.setProductData();
        }

        protected onAddProductToCompare(event: ng.IAngularEvent, product: ProductDto): void {
            this.addProductToCompare(product);
        }

        protected onRemoveProductToCompare(event: ng.IAngularEvent, productId: string): void {
            this.removeProductToCompare(productId);
        }

        canShowCompareHopper(): boolean {
            return this.productsToCompare.length > 0;
        }

        protected setProductData(): void {
            const productIdsToCompare = this.compareProductsService.getProductIds();
            if (productIdsToCompare && productIdsToCompare.length > 0) {
                const parameter: IProductCollectionParameters = { productIds: productIdsToCompare };
                this.productService.getProducts(parameter).then(
                    (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection); },
                    (error: any) => { this.getProductsFailed(error); });
            }
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel): void {
            this.productsToCompare = productCollection.products;
        }

        protected getProductsFailed(error: any): void {
        }

        protected addProductToCompare(product: ProductDto): void {
            this.productsToCompare.push(product);
        }

        protected removeProductToCompare(productId: string): void {
            lodash.remove(this.productsToCompare, p => p.id === productId);
        }

        clickRemove(product: ProductDto): void {
            this.removeProductToCompare(product.id.toString());
            if (this.compareProductsService.removeProduct(product.id.toString())) {
                this.updateProductList();
            }
        }

        removeAllProductsToCompare(): void {
            this.compareProductsService.removeAllProducts();
            this.productsToCompare = [];
            this.updateProductList();
        }

        // tell the product list page to clear compare check boxes
        updateProductList(): void {
            this.$rootScope.$broadcast("compareProductsUpdated");
        }

        storeReturnUrl(): void {
            this.$localStorage.set("compareReturnUrl", this.coreService.getCurrentPath());
        }
    }

    angular
        .module("insite")
        .controller("ProductComparisonHopperController", ProductComparisonHopperController);
}