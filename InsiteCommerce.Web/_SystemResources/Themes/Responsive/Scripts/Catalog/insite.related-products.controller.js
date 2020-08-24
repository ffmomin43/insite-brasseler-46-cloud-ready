var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var RelatedProductsController = /** @class */ (function () {
            function RelatedProductsController(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope, $attrs) {
                this.cartService = cartService;
                this.productService = productService;
                this.$timeout = $timeout;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$scope = $scope;
                this.$attrs = $attrs;
                this.isRelatedProductsLoaded = false;
                this.failedToGetRealTimePrices = false;
                this.addingToCart = true;
            }
            RelatedProductsController.prototype.$onInit = function () {
                var _this = this;
                this.carouselElement = angular.element("[carousel-element-id='" + this.$attrs.carouselElementId + "']");
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.relatedProducts = [];
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
                    angular.forEach(product.relatedProducts, function (relatedProduct) {
                        if (relatedProduct.relatedProductType === _this.relatedProductType) {
                            _this.relatedProducts.push(relatedProduct.productDto);
                        }
                    });
                    _this.isRelatedProductsLoaded = true;
                });
            };
            RelatedProductsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.waitForRelatedProducts(this.maxTries);
            };
            RelatedProductsController.prototype.getSettingsFailed = function (error) {
            };
            RelatedProductsController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            RelatedProductsController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            RelatedProductsController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            RelatedProductsController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            RelatedProductsController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            RelatedProductsController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            RelatedProductsController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            RelatedProductsController.prototype.showRelatedProductsCarousel = function () {
                return !!this.relatedProducts
                    && this.relatedProducts.length > 0
                    && !!this.productSettings;
            };
            RelatedProductsController.prototype.showQuantityBreakPricing = function (product) {
                return product.canShowPrice
                    && product.pricing
                    && !!product.pricing.unitRegularBreakPrices
                    && product.pricing.unitRegularBreakPrices.length > 1
                    && !product.quoteRequired;
            };
            RelatedProductsController.prototype.showUnitOfMeasure = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !!product.productUnitOfMeasures
                    && product.productUnitOfMeasures.length > 1
                    && this.productSettings.alternateUnitsOfMeasure;
            };
            RelatedProductsController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            RelatedProductsController.prototype.waitForRelatedProducts = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                }
                if (tries > 0) {
                    this.$timeout(function () {
                        if (_this.isRelatedProductsLoaded) {
                            // this.relatedProducts = this.product.crossSells;
                            _this.$scope.$apply();
                            _this.waitForDom(_this.maxTries);
                            if (_this.productSettings.realTimePricing && _this.relatedProducts && _this.relatedProducts.length > 0) {
                                _this.productService.getProductRealTimePrices(_this.relatedProducts).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                            }
                        }
                        else {
                            _this.waitForRelatedProducts(tries - 1);
                        }
                    }, 20, false);
                }
            };
            RelatedProductsController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            RelatedProductsController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            RelatedProductsController.prototype.waitForDom = function (tries) {
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
            RelatedProductsController.prototype.isCarouselDomReadyAndImagesLoaded = function () {
                return $(".csCarousel_" + this.relatedProductType, this.carouselElement).length > 0 && this.imagesLoaded >= this.relatedProducts.length;
            };
            RelatedProductsController.prototype.initializeCarousel = function () {
                var _this = this;
                var num = $(".csCarousel_" + this.relatedProductType + " .isc-productContainer", this.carouselElement).length;
                var itemsNum = this.getItemsNumber();
                $(".csCarousel_" + this.relatedProductType, this.carouselElement).flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    touch: num > itemsNum,
                    itemWidth: this.getItemSize(),
                    minItems: this.getItemsNumber(),
                    maxItems: this.getItemsNumber(),
                    move: this.getItemsMove(),
                    customDirectionNav: $(".carousel-control-nav_" + this.relatedProductType, this.carouselElement),
                    start: function (slider) { _this.onCarouselStart(slider); }
                });
                $(window).resize(function () { _this.onWindowResize(); });
            };
            RelatedProductsController.prototype.onCarouselStart = function (slider) {
                this.carousel = slider;
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            RelatedProductsController.prototype.onWindowResize = function () {
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            RelatedProductsController.prototype.setCarouselSpeed = function () {
                if (!this.carousel) {
                    return;
                }
                var container = $(".csCarousel_" + this.relatedProductType, this.carouselElement);
                if (container.innerWidth() > 768) {
                    this.carousel.vars.move = 2;
                }
                else {
                    this.carousel.vars.move = 1;
                }
            };
            RelatedProductsController.prototype.getItemSize = function () {
                var el = $(".csCarousel_" + this.relatedProductType, this.carouselElement);
                var width = el.innerWidth();
                if (width > 768) {
                    width = width / 4;
                }
                else if (width > 480) {
                    width = width / 3;
                }
                return width;
            };
            RelatedProductsController.prototype.getItemsMove = function () {
                var container = $(".csCarousel_" + this.relatedProductType, this.carouselElement);
                if (container.innerWidth() > 768) {
                    return 2;
                }
                else {
                    return 1;
                }
            };
            RelatedProductsController.prototype.getItemsNumber = function () {
                var el = $(".csCarousel_" + this.relatedProductType, this.carouselElement);
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
            RelatedProductsController.prototype.reloadCarousel = function () {
                var _this = this;
                if (!this.carousel) {
                    return;
                }
                var num = $(".csCarousel_" + this.relatedProductType + " .isc-productContainer", this.carouselElement).length;
                var el = $(".csCarousel_" + this.relatedProductType, this.carouselElement);
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
            RelatedProductsController.prototype.equalizeCarouselDimensions = function () {
                if ($(".csCarousel_" + this.relatedProductType + " .rp-carousel-item-equalize", this.carouselElement).length > 0) {
                    var maxHeight_1 = -1;
                    var maxThumbHeight_1 = -1;
                    var maxNameHeight_1 = -1;
                    var maxProductInfoHeight_1 = -1;
                    var navHeight = "min-height:" + $("ul.item-list").height();
                    $(".left-nav-2", this.carouselElement).attr("style", navHeight);
                    // clear the height overrides
                    $(".csCarousel_" + this.relatedProductType + " .rp-carousel-item-equalize", this.carouselElement).each(function () {
                        var $this = $(this);
                        $this.find(".item-thumb").height("auto");
                        $this.find(".item-name").height("auto");
                        $this.find(".product-info").height("auto");
                        $this.height("auto");
                    });
                    // find the max heights
                    $(".csCarousel_" + this.relatedProductType + " .rp-carousel-item-equalize", this.carouselElement).each(function () {
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
                        $(".csCarousel_" + this.relatedProductType + " .rp-carousel-item-equalize", this.carouselElement).each(function () {
                            var $this = $(this);
                            $this.find(".item-thumb").height(maxThumbHeight_1);
                            $this.find(".item-name").height(maxNameHeight_1);
                            $this.find(".product-info").height(maxProductInfoHeight_1);
                            var height = $this.height();
                            maxHeight_1 = maxHeight_1 > height ? maxHeight_1 : height;
                            $this.addClass("eq");
                        });
                        $(".csCarousel_" + this.relatedProductType + " .rp-carousel-item-equalize", this.carouselElement).height(maxHeight_1);
                    }
                }
            };
            RelatedProductsController.prototype.showCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $(".carousel-control-nav_" + this.relatedProductType, this.carouselElement).show();
                }
                else {
                    $(".carousel-control-nav_" + this.relatedProductType, this.carouselElement).hide();
                }
            };
            RelatedProductsController.$inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope", "$attrs"];
            return RelatedProductsController;
        }());
        catalog.RelatedProductsController = RelatedProductsController;
        angular
            .module("insite")
            .controller("RelatedProductsController", RelatedProductsController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.related-products.controller.js.map