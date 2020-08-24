module insite.order {
    "use strict";

    export interface IProductItem {
        id: System.Guid;
        unitOfMeasure?: string;
        product?: ProductDto;
    }

    export class FrequentlyPurchasedController {
        productItems: IProductItem[] = [];
        addingToCart = false;
        realTimePricing = false;
        failedToGetRealTimePrices = false;

        static $inject = ["settingsService", "productService", "cartService"];

        constructor(
            protected settingsService: core.ISettingsService,
            protected productService: catalog.IProductService,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.realTimePricing = settingsCollection.productSettings.realTimePricing;
            this.getProducts();
        }

        protected getSettingsFailed(error: any): void {
        }

        getProducts(): void {
            this.productService.getProducts({}, ["pricing", "frequentlypurchased", "brand"]).then(
                (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection); },
                (error: any) => { this.getProductsFailed(error); }
            );
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel): void {
            const products = productCollection.products;
            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                product.qtyOrdered = product.minimumOrderQty || 1;
                this.productItems.push({ id: product.id, unitOfMeasure: product.unitOfMeasure, product: product });
            }

            if (this.realTimePricing && this.productItems && this.productItems.length > 0) {
                this.productService.getProductRealTimePrices(this.productItems.map(o => o.product)).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getProductsFailed(error: any): void {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
        }

        showUnitOfMeasureLabel(product: ProductDto): boolean {
            return product.canShowUnitOfMeasure
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
        .controller("FrequentlyPurchasedController", FrequentlyPurchasedController);
}