module insite.catalog {
    "use strict";

    export interface IRecentlyViewedAttributes {
        carouselElementId: string;
    }

    export class RecentlyViewedController {
        isProductDetailPage: boolean;
        simplified: boolean;
        product: ProductDto;
        products: ProductDto[];
        maxTries: number;
        imagesLoaded: number;
        carousel: any;
        productSettings: ProductSettingsModel;
        failedToGetRealTimePrices = false;
        addingToCart = true;
        carouselElement: ng.IAugmentedJQuery;

        static $inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope", "$attrs"];

        constructor(
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected $timeout: ng.ITimeoutService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $scope: ng.IScope,
            protected $attrs: IRecentlyViewedAttributes) {
        }

        $onInit(): void {
            this.carouselElement = angular.element("[carousel-element-id='" + this.$attrs.carouselElementId + "']");
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.products = [];
            this.imagesLoaded = 0;
            this.maxTries = 2000;

            const cart = this.cartService.getLoadedCurrentCart();
            if (!cart) {
                this.$scope.$on("cartLoaded", () => {
                    this.addingToCart = false;
                });
            } else {
                this.addingToCart = false;
            }

            this.$scope.$on("productLoaded", (event: ng.IAngularEvent, product: ProductDto) => {
                this.product = product;
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            if (this.isProductDetailPage) {
                this.waitForProduct(this.maxTries);
            } else {
                this.getRecentlyViewed();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getRecentlyViewed(): void {
            this.productService.getProducts({}, ["pricing", "recentlyviewed", "brand"]).then(
                (productCollection: ProductCollectionModel) => { this.getRecentlyViewedCompleted(productCollection); },
                (error: any) => { this.getRecentlyViewedFailed(error); });
        }

        protected getRecentlyViewedCompleted(productCollection: ProductCollectionModel): void {
            this.products = productCollection.products;
            if (this.product) {
                this.products = this.products.filter((product: ProductDto) => product.erpNumber !== this.product.erpNumber);
            }

            this.imagesLoaded = 0;

            this.waitForDom(this.maxTries);

            if (this.productSettings.realTimePricing && this.products && this.products.length > 0) {
                this.productService.getProductRealTimePrices(this.products).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getRecentlyViewedFailed(error: any) {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
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

        showRecentlyViewedCarousel(): boolean {
            return !!this.products
                && this.products.length > 0
                && !!this.productSettings;
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
                    if (this.product) {
                        this.imagesLoaded = 0;
                        this.$scope.$apply();
                        this.getRecentlyViewed();
                    } else {
                        this.waitForProduct(tries - 1);
                    }
                }, 20, false);
            }
        }

        protected waitForDom(tries: number): void {
            if (isNaN(+tries)) {
                tries = this.maxTries || 1000; // Max 20000ms
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
            }
        }

        protected isCarouselDomReadyAndImagesLoaded(): boolean {
            return $(`.csCarousel_recentlyViewed`, this.carouselElement).length > 0 && this.imagesLoaded >= this.products.length;
        }

        protected initializeCarousel(): void {
            const num = $(`.csCarousel_recentlyViewed .isc-productContainer`, this.carouselElement).length;
            const itemsNum: number = this.getItemsNumber();

            $(`.csCarousel_recentlyViewed`, this.carouselElement).flexslider({
                animation: "slide",
                controlNav: false,
                animationLoop: true,
                slideshow: false,
                touch: num > itemsNum,
                itemWidth: this.getItemSize(),
                minItems: this.getItemsNumber(),
                maxItems: this.getItemsNumber(),
                move: this.getItemsMove(),
                customDirectionNav: $(`.carousel-control-nav_recentlyViewed`, this.carouselElement),
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

            const container = $(`.csCarousel_recentlyViewed`, this.carouselElement);
            if (container.innerWidth() > 768) {
                this.carousel.vars.move = 2;
            } else {
                this.carousel.vars.move = 1;
            }
        }

        protected getItemSize(): number {
            const el = $(`.csCarousel_recentlyViewed`, this.carouselElement);
            let width = el.innerWidth();

            if (width > 768) {
                width = width / 4;
            } else if (width > 480) {
                width = width / 3;
            }
            return width;
        }

        protected getItemsMove(): number {
            const container = $(`.csCarousel_recentlyViewed`, this.carouselElement);
            if (container.innerWidth() > 768) {
                return 2;
            } else {
                return 1;
            }
        }

        protected getItemsNumber(): number {
            const el = $(`.csCarousel_recentlyViewed`, this.carouselElement);
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

            const num = $(`.csCarousel_recentlyViewed .isc-productContainer`, this.carouselElement).length;
            const el = $(`.csCarousel_recentlyViewed`, this.carouselElement);
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
            if ($(`.csCarousel_recentlyViewed .rp-carousel-item-equalize`, this.carouselElement).length > 0) {
                let maxHeight = -1;
                let maxThumbHeight = -1;
                let maxNameHeight = -1;
                let maxProductInfoHeight = -1;

                const navHeight = `min-height:${$("ul.item-list").height()}`;
                $(".left-nav-2", this.carouselElement).attr("style", navHeight);

                // clear the height overrides
                $(`.csCarousel_recentlyViewed .rp-carousel-item-equalize`, this.carouselElement).each(function () {
                    const $this = $(this);
                    $this.find(".item-thumb").height("auto");
                    $this.find(".item-name").height("auto");
                    $this.find(".product-info").height("auto");
                    $this.height("auto");
                });

                // find the max heights
                $(`.csCarousel_recentlyViewed .rp-carousel-item-equalize`, this.carouselElement).each(function () {
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
                    $(`.csCarousel_recentlyViewed .rp-carousel-item-equalize`, this.carouselElement).each(function () {
                        const $this = $(this);
                        $this.find(".item-thumb").height(maxThumbHeight);
                        $this.find(".item-name").height(maxNameHeight);
                        $this.find(".product-info").height(maxProductInfoHeight);
                        const height = $this.height();
                        maxHeight = maxHeight > height ? maxHeight : height;
                        $this.addClass("eq");
                    });
                    $(`.csCarousel_recentlyViewed .rp-carousel-item-equalize`, this.carouselElement).height(maxHeight);
                }
            }
        }

        protected showCarouselArrows(shouldShowArrows: boolean): void {
            if (shouldShowArrows) {
                $(`.carousel-control-nav_recentlyViewed`, this.carouselElement).show();
            } else {
                $(`.carousel-control-nav_recentlyViewed`, this.carouselElement).hide();
            }
        }
    }

    angular
        .module("insite")
        .controller("RecentlyViewedController", RecentlyViewedController);
}