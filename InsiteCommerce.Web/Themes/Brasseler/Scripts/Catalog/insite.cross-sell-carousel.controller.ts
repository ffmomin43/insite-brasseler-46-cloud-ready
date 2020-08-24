module insite.catalog {
    "use strict";

    export class CrossSellCarouselController {
        product: ProductDto;
        productCrossSell: boolean;
        maxTries: number;
        crossSellProducts: ProductDto[];
        imagesLoaded: number;
        productsWithImages: number = 0;
        carousel: any;
        productSettings: ProductSettingsModel;
        failedToGetRealTimePrices = false;
        addingToCart = true;
        carouselElement: ng.IAugmentedJQuery;
        carouselIncludesBrands = false;

        static $inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope"];

        constructor(
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected $timeout: ng.ITimeoutService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $scope: ng.IScope) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.crossSellProducts = [];
            this.imagesLoaded = 0;

            const cart = this.cartService.getLoadedCurrentCart();
            if (!cart) {
                this.$scope.$on("cartLoaded", () => {
                    this.addingToCart = false;
                });
            } else {
                this.addingToCart = false;
            }

            this.$scope.$on("fulfillmentMethodChanged", () => {
                this.crossSellProducts = [];
                this.imagesLoaded = 0;
                this.getCrossSells();
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.getCrossSells();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getCrossSells(): void {
            if (!this.productCrossSell) {
                this.productService.getCrossSells(null).then(
                    (crossSellCollection: CrossSellCollectionModel) => { this.getCrossSellsCompleted(crossSellCollection); },
                    (error: any) => { this.getCrossSellsFailed(error); });
            } else {
                this.waitForProduct(this.maxTries);
            }
        }

        protected getCrossSellsCompleted(crossSellCollection: CrossSellCollectionModel): void {
            this.crossSellProducts = crossSellCollection.products;
            this.imagesLoaded = 0;

            this.waitForDom(this.maxTries);

            if (this.crossSellProducts && this.crossSellProducts.length > 0) {
                this.carouselIncludesBrands = this.crossSellProducts.some((product) => !!product.brand);
                this.getRealTimePrices();
                if (!this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            }
        }

        protected getCrossSellsFailed(error: any) {
        }

        protected getRealTimePrices(): void {
            if (this.productSettings.realTimePricing) {
                this.productService.getProductRealTimePrices(this.crossSellProducts).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
            if (this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
        }

        protected getRealTimeInventory(): void {
            if (this.productSettings.realTimeInventory) {
                this.productService.getProductRealTimeInventory(this.crossSellProducts).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            }
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel): void {
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            this.cartService.addLineFromProduct(product, null, null, true).then(
                (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                (error: any) => { this.addToCartFailed(error); });
        }

        protected addToCartCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
        }

        changeUnitOfMeasure(product: ProductDto): void {
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        openWishListPopup(product: ProductDto): void {
            this.addToWishlistPopupService.display([product]);
        }

        showCrossSellCarousel(): boolean {
            return !!this.crossSellProducts
                && this.crossSellProducts.length > 0
                && (!this.productCrossSell || !!this.productSettings);
        }

        showQuantityBreakPricing(product: ProductDto): boolean {
            return product.canShowPrice
                && product.pricing
                && !!product.pricing.unitRegularBreakPrices
                && product.pricing.unitRegularBreakPrices.length > 1
                && !product.quoteRequired;
        }

        showUnitOfMeasure(product: ProductDto): boolean {
            return product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !!product.productUnitOfMeasures
                && product.productUnitOfMeasures.length > 1
                && this.productSettings.alternateUnitsOfMeasure;
        }

        showUnitOfMeasureLabel(product: ProductDto): boolean {
            return product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !product.quoteRequired;
        }

        protected waitForProduct(tries: number): void {
            if (isNaN(+tries)) {
                tries = this.maxTries || 1000; // Max 20000ms
            }

            if (tries > 0) {
                this.$timeout(() => {
                    if (this.isProductLoaded()) {
                        this.crossSellProducts = this.product.crossSells;
                        this.imagesLoaded = 0;
                        this.$scope.$apply();
                        this.waitForDom(this.maxTries);
                    } else {
                        this.waitForProduct(tries - 1);
                    }
                }, 20, false);
            }
        }

        protected waitForDom(tries: number): void {
            if (isNaN(+tries)) {
                tries = this.maxTries || 1000; // Max 20000ms
                this.productsWithImages = this.crossSellProducts.filter((product: ProductDto) => !!product.mediumImagePath).length;
            }

            // If DOM isn't ready after max number of tries then stop
            if (tries > 0) {
                this.$timeout(() => {
                    if (this.isCarouselDomReadyAndImagesLoaded()) {
                        this.initializeCarousel();
                        this.$scope.$apply();
                    } else {
                        this.waitForDom(tries - 1);
                    }
                }, 20, false);
            } else {
                this.initializeCarousel();
                this.$scope.$apply();
            }
        }

        protected isCarouselDomReadyAndImagesLoaded(): boolean {
            return $(".cs-carousel", this.carouselElement).length > 0 && this.imagesLoaded >= this.productsWithImages;
        }

        protected isProductLoaded(): boolean {
            return this.product && typeof this.product === "object";
        }

        protected initializeCarousel(): void {
            const num = $(".cs-carousel .isc-productContainer", this.carouselElement).length;
            const itemsNum: number = this.getItemsNumber();

            $(".cs-carousel", this.carouselElement).flexslider({
                animation: "slide",
                controlNav: false,
                animationLoop: true,
                slideshow: false,
                touch: num > itemsNum,
                itemWidth: this.getItemSize(),
                minItems: this.getItemsNumber(),
                maxItems: this.getItemsNumber(),
                move: this.getItemsMove(),
                customDirectionNav: $(".carousel-control-nav", this.carouselElement),
                start: (slider: any) => { this.onCarouselStart(slider); }
            });

            $(window).resize(() => { this.onWindowResize(); });
        }

        protected onCarouselStart(slider: any): void {
            this.carousel = slider;
            this.reloadCarousel();
            this.setCarouselSpeed();
        }

        protected onWindowResize(): void {
            this.reloadCarousel();
            this.setCarouselSpeed();
        }

        protected setCarouselSpeed(): void {
            if (!this.carousel) {
                return;
            }

            const container = $(".cs-carousel", this.carouselElement);
            if (container.innerWidth() > 768) {
                this.carousel.vars.move = 2;
            } else {
                this.carousel.vars.move = 1;
            }
        }

        protected getItemSize(): number {
            const el = $(".cs-carousel", this.carouselElement);
            let width = el.innerWidth();

            if (width > 768) {
                width = width / 4;
            } else if (width > 480) {
                width = width / 3;
            }
            return width;
        }

        protected getItemsMove(): number {
            const container = $(".cs-carousel", this.carouselElement);
            if (container.innerWidth() > 768) {
                return 2;
            } else {
                return 1;
            }
        }

        protected getItemsNumber(): number {
            const el = $(".cs-carousel", this.carouselElement);
            const width = el.innerWidth();
            let itemsNum: number;

            if (width > 768) {
                itemsNum = 4;
            } else if (width > 480) {
                itemsNum = 3;
            } else {
                itemsNum = 1;
            }
            return itemsNum;
        }

        protected reloadCarousel(): void {
            if (!this.carousel) {
                return;
            }

            const num = $(".cs-carousel .isc-productContainer", this.carouselElement).length;
            const el = $(".cs-carousel", this.carouselElement);
            let width = el.innerWidth();
            let itemsNum: number;
            let isItemsNumChanged = false;

            if (width > 768) {
                itemsNum = 4;
                this.showCarouselArrows(num > 4);
            } else if (width > 480) {
                itemsNum = 3;
                this.showCarouselArrows(num > 3);
            } else {
                itemsNum = 1;
                this.showCarouselArrows(num > 1);
            }

            if (this.carousel.vars.minItems !== itemsNum && this.carousel.vars.maxItems !== itemsNum) {
                this.carousel.vars.minItems = itemsNum;
                this.carousel.vars.maxItems = itemsNum;
                this.carousel.doMath();
                isItemsNumChanged = true;
            }

            this.$timeout(() => {
                if (isItemsNumChanged) {
                    this.carousel.resize();
                    if (num > itemsNum) {
                        if (this.carousel.currentSlide > num - itemsNum) {
                            this.carousel.flexAnimate(num - itemsNum);
                        }
                    } else {
                        this.carousel.flexAnimate(0);
                    }
                }

                this.equalizeCarouselDimensions();
            }, 0);
        }

        protected equalizeCarouselDimensions(): void {
            if ($(".carousel-item-equalize", this.carouselElement).length > 0) {
                let maxHeight = -1;
                let maxThumbHeight = -1;
                let maxNameHeight = -1;
                let maxProductInfoHeight = -1;

                const navHeight = `min-height:${$("ul.item-list", this.carouselElement).height()}`;
                $(".left-nav-2", this.carouselElement).attr("style", navHeight);

                // clear the height overrides
                $(".carousel-item-equalize", this.carouselElement).each(function () {
                    const $this = $(this);
                    $this.find(".item-thumb").height("auto");
                    $this.find(".item-name").height("auto");
                    $this.find(".product-info").height("auto");
                    $this.height("auto");
                });

                // find the max heights
                $(".carousel-item-equalize", this.carouselElement).each(function () {
                    const $this = $(this);
                    const thumbHeight = $this.find(".item-thumb").height();
                    maxThumbHeight = maxThumbHeight > thumbHeight ? maxThumbHeight : thumbHeight;
                    const nameHeight = $this.find(".item-name").height();
                    maxNameHeight = maxNameHeight > nameHeight ? maxNameHeight : nameHeight;
                    const productInfoHeight = $this.find(".product-info").height();
                    maxProductInfoHeight = maxProductInfoHeight > productInfoHeight ? maxProductInfoHeight : productInfoHeight;

                });

                // set all to max heights
                if (maxThumbHeight > 0) {
                    $(".carousel-item-equalize", this.carouselElement).each(function () {
                        const $this = $(this);
                        $this.find(".item-thumb").height(maxThumbHeight);
                        $this.find(".item-name").height(maxNameHeight);
                        $this.find(".product-info").height(maxProductInfoHeight);
                        const height = $this.height();
                        maxHeight = maxHeight > height ? maxHeight : height;
                        $this.addClass("eq");
                    });
                    $(".carousel-item-equalize", this.carouselElement).height(maxHeight);
                }
            }
        }

        protected showCarouselArrows(shouldShowArrows: boolean): void {
            if (shouldShowArrows) {
                $(".carousel-control-nav", this.carouselElement).show();
            } else {
                $(".carousel-control-nav", this.carouselElement).hide();
            }
        }
    }

    angular
        .module("insite")
        .controller("CrossSellCarouselController", CrossSellCarouselController);
}