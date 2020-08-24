module insite.order {
    "use strict";

    export class RecentlyPurchasedController {
        showOrders: boolean;
        products: ProductDto[] = [];
        addingToCart = false;
        realTimePricing = false;
        failedToGetRealTimePrices = false;

        static $inject = ["settingsService", "productService", "cartService", "$scope"];

        constructor(
            protected settingsService: core.ISettingsService,
            protected productService: catalog.IProductService,
            protected cartService: cart.ICartService,
            protected $scope: ng.IScope) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("fulfillmentMethodChanged", () => {
                this.products = [];
                if (this.showOrders) {
                    this.getRecentlyPurchasedItems();
                }
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.showOrders = settingsCollection.orderSettings.showOrders;
            this.realTimePricing = settingsCollection.productSettings.realTimePricing;
            if (this.showOrders) {
                this.getRecentlyPurchasedItems();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        getRecentlyPurchasedItems(page: number = 1): void {
            this.productService.getProducts({ }, ["recentlypurchased", "pricing"]).then(
                (productCollection: ProductCollectionModel) => { this.getRecentlyPurchasedItemsCompleted(productCollection); },
                (error: any) => { this.getRecentlyPurchasedItemsFailed(error); }
            );
        }

        protected getRecentlyPurchasedItemsCompleted(productCollection: ProductCollectionModel): void {
            this.products = productCollection.products;

            for (let i = 0; i < this.products.length; i++) {
                this.products[i].qtyOrdered = this.products[i].minimumOrderQty || 1;
            }

            if (this.realTimePricing && this.products && this.products.length > 0) {
                this.productService.getProductRealTimePrices(this.products).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getRecentlyPurchasedItemsFailed(error: any): void {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
            realTimePricing.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const product = this.products.find((p: ProductDto) => p.id === productPrice.productId && p.unitOfMeasure === productPrice.unitOfMeasure);
                product.pricing = productPrice;
            });
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
        }

        showUnitOfMeasureLabel(product: ProductDto): boolean {
            return product !== null && product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !product.quoteRequired;
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            this.cartService.addLineFromProduct(product, null, null, true).then(
                (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                (error: any) => { this.addToCartFailed(error); }
            );
        }

        protected addToCartCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
        }
    }

    angular
        .module("insite")
        .controller("RecentlyPurchasedController", RecentlyPurchasedController);
}