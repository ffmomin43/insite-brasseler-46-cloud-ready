var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var CrossSellCarouselController = /** @class */ (function () {
            function CrossSellCarouselController(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope) {
                this.cartService = cartService;
                this.productService = productService;
                this.$timeout = $timeout;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$scope = $scope;
                this.productsWithImages = 0;
                this.failedToGetRealTimePrices = false;
                this.addingToCart = true;
                this.carouselIncludesBrands = false;
            }
            CrossSellCarouselController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.crossSellProducts = [];
                this.imagesLoaded = 0;
                var cart = this.cartService.getLoadedCurrentCart();
                if (!cart) {
                    this.$scope.$on("cartLoaded", function () {
                        _this.addingToCart = false;
                    });
                }
                else {
                    this.addingToCart = false;
                }
                this.$scope.$on("fulfillmentMethodChanged", function () {
                    _this.crossSellProducts = [];
                    _this.imagesLoaded = 0;
                    _this.getCrossSells();
                });
            };
            CrossSellCarouselController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.getCrossSells();
            };
            CrossSellCarouselController.prototype.getSettingsFailed = function (error) {
            };
            CrossSellCarouselController.prototype.getCrossSells = function () {
                var _this = this;
                if (!this.productCrossSell) {
                    this.productService.getCrossSells(null).then(function (crossSellCollection) { _this.getCrossSellsCompleted(crossSellCollection); }, function (error) { _this.getCrossSellsFailed(error); });
                }
                else {
                    this.waitForProduct(this.maxTries);
                }
            };
            CrossSellCarouselController.prototype.getCrossSellsCompleted = function (crossSellCollection) {
                this.crossSellProducts = crossSellCollection.products;
                this.imagesLoaded = 0;
                this.waitForDom(this.maxTries);
                if (this.crossSellProducts && this.crossSellProducts.length > 0) {
                    this.carouselIncludesBrands = this.crossSellProducts.some(function (product) { return !!product.brand; });
                    this.getRealTimePrices();
                    if (!this.productSettings.inventoryIncludedWithPricing) {
                        this.getRealTimeInventory();
                    }
                }
            };
            CrossSellCarouselController.prototype.getCrossSellsFailed = function (error) {
            };
            CrossSellCarouselController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing) {
                    this.productService.getProductRealTimePrices(this.crossSellProducts).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            CrossSellCarouselController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            CrossSellCarouselController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            CrossSellCarouselController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory) {
                    this.productService.getProductRealTimeInventory(this.crossSellProducts).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
            };
            CrossSellCarouselController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory) {
            };
            CrossSellCarouselController.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            CrossSellCarouselController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            CrossSellCarouselController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            CrossSellCarouselController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            CrossSellCarouselController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            CrossSellCarouselController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            CrossSellCarouselController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            CrossSellCarouselController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            CrossSellCarouselController.prototype.showCrossSellCarousel = function () {
                return !!this.crossSellProducts
                    && this.crossSellProducts.length > 0
                    && (!this.productCrossSell || !!this.productSettings);
            };
            CrossSellCarouselController.prototype.showQuantityBreakPricing = function (product) {
                return product.canShowPrice
                    && product.pricing
                    && !!product.pricing.unitRegularBreakPrices
                    && product.pricing.unitRegularBreakPrices.length > 1
                    && !product.quoteRequired;
            };
            CrossSellCarouselController.prototype.showUnitOfMeasure = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !!product.productUnitOfMeasures
                    && product.productUnitOfMeasures.length > 1
                    && this.productSettings.alternateUnitsOfMeasure;
            };
            CrossSellCarouselController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            CrossSellCarouselController.prototype.waitForProduct = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                }
                if (tries > 0) {
                    this.$timeout(function () {
                        if (_this.isProductLoaded()) {
                            _this.crossSellProducts = _this.product.crossSells;
                            _this.imagesLoaded = 0;
                            _this.$scope.$apply();
                            _this.waitForDom(_this.maxTries);
                        }
                        else {
                            _this.waitForProduct(tries - 1);
                        }
                    }, 20, false);
                }
            };
            CrossSellCarouselController.prototype.waitForDom = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                    this.productsWithImages = this.crossSellProducts.filter(function (product) { return !!product.mediumImagePath; }).length;
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
                else {
                    this.initializeCarousel();
                    this.$scope.$apply();
                }
            };
            CrossSellCarouselController.prototype.isCarouselDomReadyAndImagesLoaded = function () {
                return $(".cs-carousel", this.carouselElement).length > 0 && this.imagesLoaded >= this.productsWithImages;
            };
            CrossSellCarouselController.prototype.isProductLoaded = function () {
                return this.product && typeof this.product === "object";
            };
            CrossSellCarouselController.prototype.initializeCarousel = function () {
                var _this = this;
                var num = $(".cs-carousel .isc-productContainer", this.carouselElement).length;
                var itemsNum = this.getItemsNumber();
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
                    start: function (slider) { _this.onCarouselStart(slider); }
                });
                $(window).resize(function () { _this.onWindowResize(); });
            };
            CrossSellCarouselController.prototype.onCarouselStart = function (slider) {
                this.carousel = slider;
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            CrossSellCarouselController.prototype.onWindowResize = function () {
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            CrossSellCarouselController.prototype.setCarouselSpeed = function () {
                if (!this.carousel) {
                    return;
                }
                var container = $(".cs-carousel", this.carouselElement);
                if (container.innerWidth() > 768) {
                    this.carousel.vars.move = 2;
                }
                else {
                    this.carousel.vars.move = 1;
                }
            };
            CrossSellCarouselController.prototype.getItemSize = function () {
                var el = $(".cs-carousel", this.carouselElement);
                var width = el.innerWidth();
                if (width > 768) {
                    width = width / 4;
                }
                else if (width > 480) {
                    width = width / 3;
                }
                return width;
            };
            CrossSellCarouselController.prototype.getItemsMove = function () {
                var container = $(".cs-carousel", this.carouselElement);
                if (container.innerWidth() > 768) {
                    return 2;
                }
                else {
                    return 1;
                }
            };
            CrossSellCarouselController.prototype.getItemsNumber = function () {
                var el = $(".cs-carousel", this.carouselElement);
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
            CrossSellCarouselController.prototype.reloadCarousel = function () {
                var _this = this;
                if (!this.carousel) {
                    return;
                }
                var num = $(".cs-carousel .isc-productContainer", this.carouselElement).length;
                var el = $(".cs-carousel", this.carouselElement);
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
            CrossSellCarouselController.prototype.equalizeCarouselDimensions = function () {
                if ($(".carousel-item-equalize", this.carouselElement).length > 0) {
                    var maxHeight_1 = -1;
                    var maxThumbHeight_1 = -1;
                    var maxNameHeight_1 = -1;
                    var maxProductInfoHeight_1 = -1;
                    var navHeight = "min-height:" + $("ul.item-list", this.carouselElement).height();
                    $(".left-nav-2", this.carouselElement).attr("style", navHeight);
                    // clear the height overrides
                    $(".carousel-item-equalize", this.carouselElement).each(function () {
                        var $this = $(this);
                        $this.find(".item-thumb").height("auto");
                        $this.find(".item-name").height("auto");
                        $this.find(".product-info").height("auto");
                        $this.height("auto");
                    });
                    // find the max heights
                    $(".carousel-item-equalize", this.carouselElement).each(function () {
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
                        $(".carousel-item-equalize", this.carouselElement).each(function () {
                            var $this = $(this);
                            $this.find(".item-thumb").height(maxThumbHeight_1);
                            $this.find(".item-name").height(maxNameHeight_1);
                            $this.find(".product-info").height(maxProductInfoHeight_1);
                            var height = $this.height();
                            maxHeight_1 = maxHeight_1 > height ? maxHeight_1 : height;
                            $this.addClass("eq");
                        });
                        $(".carousel-item-equalize", this.carouselElement).height(maxHeight_1);
                    }
                }
            };
            CrossSellCarouselController.prototype.showCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $(".carousel-control-nav", this.carouselElement).show();
                }
                else {
                    $(".carousel-control-nav", this.carouselElement).hide();
                }
            };
            CrossSellCarouselController.$inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope"];
            return CrossSellCarouselController;
        }());
        catalog.CrossSellCarouselController = CrossSellCarouselController;
        angular
            .module("insite")
            .controller("CrossSellCarouselController", CrossSellCarouselController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cross-sell-carousel.controller.js.map