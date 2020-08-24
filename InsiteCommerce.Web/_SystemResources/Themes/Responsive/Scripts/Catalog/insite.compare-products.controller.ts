import AttributeTypeDto = Insite.Catalog.Services.Dtos.AttributeTypeDto;

module insite.catalog {
    "use strict";

    export class CompareProductsController {
        ready = false;
        productsToCompare: ProductDto[];
        relevantAttributeTypes: AttributeTypeDto[];
        productSettings: ProductSettingsModel;
        addingToCart = false;
        carouselIncludesBrands = false;

        static $inject = [
            "cartService",
            "coreService",
            "productService",
            "compareProductsService",
            "addToWishlistPopupService",
            "settingsService",
            "$localStorage"
        ];

        constructor(
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected productService: catalog.IProductService,
            protected compareProductsService: ICompareProductsService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $localStorage: common.IWindowStorage) {
        }

        $onInit(): void {
            this.productsToCompare = [];
            this.relevantAttributeTypes = [];

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.getProducts();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getProducts(): void {
            const productsToCompare = this.compareProductsService.getProductIds();
            const expand = ["styledproducts", "attributes", "pricing", "brand"];

            const parameter: IProductCollectionParameters = { productIds: productsToCompare };
            this.productService.getProducts(parameter, expand).then(
                (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection); },
                (error: any) => { this.getProductsFailed(error); });
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel): void {
            this.productsToCompare = productCollection.products;

            if (this.productsToCompare.length > 0) {
                this.carouselIncludesBrands = this.productsToCompare.some((product) => !!product.brand);
                const allAttributeTypes = lodash.chain(this.productsToCompare)
                    .pluck<AttributeTypeDto>("attributeTypes")
                    .flatten<AttributeTypeDto>(true)
                    .where<AttributeTypeDto, { "isComparable": boolean }>({ "isComparable": true })
                    .sortBy("label")
                    .value();

                this.relevantAttributeTypes = [];
                allAttributeTypes.forEach((attributeType) => {
                    if (!lodash.some(this.relevantAttributeTypes, relevantAttributeType =>
                        relevantAttributeType.id === attributeType.id
                    )) {
                        this.relevantAttributeTypes.push(attributeType);
                    }
                });
            }

            if (this.productSettings.realTimePricing) {
                this.productService.getProductRealTimePrices(this.productsToCompare).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }

            if (!this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }

            this.ready = true;
        }

        protected getProductsFailed(error: any): void {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.productsToCompare.forEach(product => {
                if (product.pricing) {
                    (product.pricing as any).failedToGetRealTimePrices = true;
                }
            });
        }

        protected getRealTimeInventory(): void {
            if (this.productSettings.realTimeInventory && this.productsToCompare.length) {
                this.productService.getProductRealTimeInventory(this.productsToCompare).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            }
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel): void {
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
        }

        // gets all attribute value display strings available for a given attribute type
        getAttributeTypeValuesForAllProducts(attributeTypeId: string): string[] {
            if (!attributeTypeId) {
                return [];
            }

            return lodash.chain(this.productsToCompare)
                .pluck<AttributeTypeDto>("attributeTypes")
                .flatten(true)
                .where({ "id": attributeTypeId })
                .pluck<AttributeTypeDto>("attributeValues")
                .flatten(true)
                .pluck<string>("valueDisplay")
                .value();
        }

        // returns all attribute value display strings belonging to products for a given attribute type
        getUniqueAttributeTypeValuesForAllProducts(attributeTypeId: string): string[] {
            let attributeValues: string[] = [];
            this.productsToCompare.forEach((product) => {
                attributeValues = attributeValues.concat(this.getAttributeValuesForProduct(product, attributeTypeId));
            });

            return lodash.uniq(attributeValues);
        }

        // returns the attribute value display string for a given product and attribute type
        getAttributeValuesForProduct(product: ProductDto, attributeTypeId: string): string[] {
            if (!product || !attributeTypeId) {
                return [];
            }

            return lodash.chain(product.attributeTypes)
                .where({ "id": attributeTypeId })
                .pluck<AttributeTypeDto>("attributeValues")
                .flatten(true)
                .pluck<string>("valueDisplay")
                .value();
        }

        // returns a list of products with a given attribute value
        getProductsThatContainAttributeTypeIdAndAttributeValue(attributeTypeId: string, attributeValue: string): ProductDto[] {
            if (!attributeTypeId || !attributeValue) {
                return [];
            }

            const productsThatContainsAttributeTypeIdAndAttributeValue: ProductDto[] = [];

            this.productsToCompare.forEach(product => {
                const attributeValues = this.getAttributeValuesForProduct(product, attributeTypeId);
                const hasAttributeTypeIdAndAttributeValue = attributeValues.length > 0 && lodash.indexOf(attributeValues, attributeValue) > -1;

                if (hasAttributeTypeIdAndAttributeValue) {
                    productsThatContainsAttributeTypeIdAndAttributeValue.push(product);
                }
            });

            return productsThatContainsAttributeTypeIdAndAttributeValue;
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

        removeComparedProduct(productId: string): void {
            lodash.remove(this.productsToCompare, p => p.id === productId);
            this.compareProductsService.removeProduct(productId);
        }

        openWishListPopup(product: ProductDto): void {
            this.addToWishlistPopupService.display([product]);
        }

        removeAllComparedProducts(): void {
            this.compareProductsService.removeAllProducts();
            this.productsToCompare = [];

            this.goBack();
        }

        goBack(): void {
            const returlUrl = this.$localStorage.get("compareReturnUrl");
            if (returlUrl) {
                this.coreService.redirectToPath(returlUrl);
            }
        }
    }

    angular
        .module("insite")
        .controller("CompareProductsController", CompareProductsController);
}