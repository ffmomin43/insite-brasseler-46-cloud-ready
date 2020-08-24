var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var RecentlyViewedController = /** @class */ (function () {
            function RecentlyViewedController(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope, $attrs) {
                this.cartService = cartService;
                this.productService = productService;
                this.$timeout = $timeout;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$scope = $scope;
                this.$attrs = $attrs;
                this.failedToGetRealTimePrices = false;
                this.addingToCart = true;
            }
            RecentlyViewedController.prototype.$onInit = function () {
                var _this = this;
                this.carouselElement = angular.element("[carousel-element-id='" + this.$attrs.carouselElementId + "']");
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.products = [];
                this.imagesLoaded = 0;
                this.maxTries = 2000;
                var cart = this.cartService.getLoadedCurrentCart();
                if (!cart) {
                    this.$scope.$on("cartLoaded", function () {
                        _this.addingToCart = false;
                    });
                }
                else {
                    this.addingToCart = false;
                }
                this.$scope.$on("productLoaded", function (event, product) {
                    _this.product = product;
                });
            };
            RecentlyViewedController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                if (this.isProductDetailPage) {
                    this.waitForProduct(this.maxTries);
                }
                else {
                    this.getRecentlyViewed();
                }
            };
            RecentlyViewedController.prototype.getSettingsFailed = function (error) {
            };
            RecentlyViewedController.prototype.getRecentlyViewed = function () {
                var _this = this;
                this.productService.getProducts({}, ["pricing", "recentlyviewed", "brand"]).then(function (productCollection) { _this.getRecentlyViewedCompleted(productCollection); }, function (error) { _this.getRecentlyViewedFailed(error); });
            };
            RecentlyViewedController.prototype.getRecentlyViewedCompleted = function (productCollection) {
                var _this = this;
                this.products = productCollection.products;
                if (this.product) {
                    this.products = this.products.filter(function (product) { return product.erpNumber !== _this.product.erpNumber; });
                }
                this.imagesLoaded = 0;
                this.waitForDom(this.maxTries);
                if (this.productSettings.realTimePricing && this.products && this.products.length > 0) {
                    this.productService.getProductRealTimePrices(this.products).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            RecentlyViewedController.prototype.getRecentlyViewedFailed = function (error) {
            };
            RecentlyViewedController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            RecentlyViewedController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            RecentlyViewedController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            RecentlyViewedController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            RecentlyViewedController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            RecentlyViewedController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            RecentlyViewedController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            RecentlyViewedController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            RecentlyViewedController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            RecentlyViewedController.prototype.showRecentlyViewedCarousel = function () {
                return !!this.products
                    && this.products.length > 0
                    && !!this.productSettings;
            };
            RecentlyViewedController.prototype.showQuantityBreakPricing = function (product) {
                return product.canShowPrice
                    && product.pricing
                    && !!product.pricing.unitRegularBreakPrices
                    && product.pricing.unitRegularBreakPrices.length > 1
                    && !product.quoteRequired;
            };
            RecentlyViewedController.prototype.showUnitOfMeasure = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !!product.productUnitOfMeasures
                    && product.productUnitOfMeasures.length > 1
                    && this.productSettings.alternateUnitsOfMeasure;
            };
            RecentlyViewedController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            RecentlyViewedController.prototype.waitForProduct = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                }
                if (tries > 0) {
                    this.$timeout(function () {
                        if (_this.product) {
                            _this.imagesLoaded = 0;
                            _this.$scope.$apply();
                            _this.getRecentlyViewed();
                        }
                        else {
                            _this.waitForProduct(tries - 1);
                        }
                    }, 20, false);
                }
            };
            RecentlyViewedController.prototype.waitForDom = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                }
                // If DOM isn't ready after max number of tries then stop
                if (tries > 0) {
                    this.$timeout(function () {
                        if (_this.isCarouselDomReadyAndImagesLoaded()) {
                            _this.initializeCarousel();
                            _this.$scope.$apply();
                        }
                        else {
                            _this.waitForDom(tries - 1);
                        }
                    }, 20, false);
                }
            };
            RecentlyViewedController.prototype.isCarouselDomReadyAndImagesLoaded = function () {
                return $(".csCarousel_recentlyViewed", this.carouselElement).length > 0 && this.imagesLoaded >= this.products.length;
            };
            RecentlyViewedController.prototype.initializeCarousel = function () {
                var _this = this;
                var num = $(".csCarousel_recentlyViewed .isc-productContainer", this.carouselElement).length;
                var itemsNum = this.getItemsNumber();
                $(".csCarousel_recentlyViewed", this.carouselElement).flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    touch: num > itemsNum,
                    itemWidth: this.getItemSize(),
                    minItems: this.getItemsNumber(),
                    maxItems: this.getItemsNumber(),
                    move: this.getItemsMove(),
                    customDirectionNav: $(".carousel-control-nav_recentlyViewed", this.carouselElement),
                    start: function (slider) { _this.onCarouselStart(slider); }
                });
                $(window).resize(function () { _this.onWindowResize(); });
            };
            RecentlyViewedController.prototype.onCarouselStart = function (slider) {
                this.carousel = slider;
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            RecentlyViewedController.prototype.onWindowResize = function () {
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            RecentlyViewedController.prototype.setCarouselSpeed = function () {
                if (!this.carousel) {
                    return;
                }
                var container = $(".csCarousel_recentlyViewed", this.carouselElement);
                if (container.innerWidth() > 768) {
                    this.carousel.vars.move = 2;
                }
                else {
                    this.carousel.vars.move = 1;
                }
            };
            RecentlyViewedController.prototype.getItemSize = function () {
                var el = $(".csCarousel_recentlyViewed", this.carouselElement);
                var width = el.innerWidth();
                if (width > 768) {
                    width = width / 4;
                }
                else if (width > 480) {
                    width = width / 3;
                }
                return width;
            };
            RecentlyViewedController.prototype.getItemsMove = function () {
                var container = $(".csCarousel_recentlyViewed", this.carouselElement);
                if (container.innerWidth() > 768) {
                    return 2;
                }
                else {
                    return 1;
                }
            };
            RecentlyViewedController.prototype.getItemsNumber = function () {
                var el = $(".csCarousel_recentlyViewed", this.carouselElement);
                var width = el.innerWidth();
                var itemsNum;
                if (width > 768) {
                    itemsNum = 4;
                }
                else if (width > 480) {
                    itemsNum = 3;
                }
                else {
                    itemsNum = 1;
                }
                return itemsNum;
            };
            RecentlyViewedController.prototype.reloadCarousel = function () {
                var _this = this;
                if (!this.carousel) {
                    return;
                }
                var num = $(".csCarousel_recentlyViewed .isc-productContainer", this.carouselElement).length;
                var el = $(".csCarousel_recentlyViewed", this.carouselElement);
                var width = el.innerWidth();
                var itemsNum;
                var isItemsNumChanged = false;
                if (width > 768) {
                    itemsNum = 4;
                    this.showCarouselArrows(num > 4);
                }
                else if (width > 480) {
                    itemsNum = 3;
                    this.showCarouselArrows(num > 3);
                }
                else {
                    itemsNum = 1;
                    this.showCarouselArrows(num > 1);
                }
                if (this.carousel.vars.minItems !== itemsNum && this.carousel.vars.maxItems !== itemsNum) {
                    this.carousel.vars.minItems = itemsNum;
                    this.carousel.vars.maxItems = itemsNum;
                    this.carousel.doMath();
                    isItemsNumChanged = true;
                }
                this.$timeout(function () {
                    if (isItemsNumChanged) {
                        _this.carousel.resize();
                        if (num > itemsNum) {
                            if (_this.carousel.currentSlide > num - itemsNum) {
                                _this.carousel.flexAnimate(num - itemsNum);
                            }
                        }
                        else {
                            _this.carousel.flexAnimate(0);
                        }
                    }
                    _this.equalizeCarouselDimensions();
                }, 0);
            };
            RecentlyViewedController.prototype.equalizeCarouselDimensions = function () {
                if ($(".csCarousel_recentlyViewed .rp-carousel-item-equalize", this.carouselElement).length > 0) {
                    var maxHeight_1 = -1;
                    var maxThumbHeight_1 = -1;
                    var maxNameHeight_1 = -1;
                    var maxProductInfoHeight_1 = -1;
                    var navHeight = "min-height:" + $("ul.item-list").height();
                    $(".left-nav-2", this.carouselElement).attr("style", navHeight);
                    // clear the height overrides
                    $(".csCarousel_recentlyViewed .rp-carousel-item-equalize", this.carouselElement).each(function () {
                        var $this = $(this);
                        $this.find(".item-thumb").height("auto");
                        $this.find(".item-name").height("auto");
                        $this.find(".product-info").height("auto");
                        $this.height("auto");
                    });
                    // find the max heights
                    $(".csCarousel_recentlyViewed .rp-carousel-item-equalize", this.carouselElement).each(function () {
                        var $this = $(this);
                        var thumbHeight = $this.find(".item-thumb").height();
                        maxThumbHeight_1 = maxThumbHeight_1 > thumbHeight ? maxThumbHeight_1 : thumbHeight;
                        var nameHeight = $this.find(".item-name").height();
                        maxNameHeight_1 = maxNameHeight_1 > nameHeight ? maxNameHeight_1 : nameHeight;
                        var productInfoHeight = $this.find(".product-info").height();
                        maxProductInfoHeight_1 = maxProductInfoHeight_1 > productInfoHeight ? maxProductInfoHeight_1 : productInfoHeight;
                    });
                    // set all to max heights
                    if (maxThumbHeight_1 > 0) {
                        $(".csCarousel_recentlyViewed .rp-carousel-item-equalize", this.carouselElement).each(function () {
                            var $this = $(this);
                            $this.find(".item-thumb").height(maxThumbHeight_1);
                            $this.find(".item-name").height(maxNameHeight_1);
                            $this.find(".product-info").height(maxProductInfoHeight_1);
                            var height = $this.height();
                            maxHeight_1 = maxHeight_1 > height ? maxHeight_1 : height;
                            $this.addClass("eq");
                        });
                        $(".csCarousel_recentlyViewed .rp-carousel-item-equalize", this.carouselElement).height(maxHeight_1);
                    }
                }
            };
            RecentlyViewedController.prototype.showCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $(".carousel-control-nav_recentlyViewed", this.carouselElement).show();
                }
                else {
                    $(".carousel-control-nav_recentlyViewed", this.carouselElement).hide();
                }
            };
            RecentlyViewedController.$inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope", "$attrs"];
            return RecentlyViewedController;
        }());
        catalog.RecentlyViewedController = RecentlyViewedController;
        angular
            .module("insite")
            .controller("RecentlyViewedController", RecentlyViewedController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.recently-viewed.controller.js.map