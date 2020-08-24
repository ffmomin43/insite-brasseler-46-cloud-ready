var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductCarouselController = /** @class */ (function () {
            function ProductCarouselController(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope, $attrs, queryString, $stateParams, brandService, $window) {
                this.cartService = cartService;
                this.productService = productService;
                this.$timeout = $timeout;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$scope = $scope;
                this.$attrs = $attrs;
                this.queryString = queryString;
                this.$stateParams = $stateParams;
                this.brandService = brandService;
                this.$window = $window;
                this.productsWithImages = 0;
                this.failedToGetRealTimePrices = false;
                this.addingToCart = true;
                this.selectedCategoryIds = [];
                this.carouselIncludesBrands = false;
            }
            ProductCarouselController.prototype.$onInit = function () {
                var _this = this;
                this.productCarouselType = this.$attrs.productCarouselType;
                this.relatedProductType = this.$attrs.relatedProductType;
                this.isProductDetailPage = this.$attrs.isProductDetailPage.toString().toLowerCase() === "true";
                this.numberOfProductsToDisplay = this.$attrs.numberOfProductsToDisplay;
                this.seedWithManuallyAssigned = this.$attrs.seedWithManuallyAssigned;
                if (this.$attrs.selectedCategoryIds) {
                    this.selectedCategoryIds = this.$attrs.selectedCategoryIds.split(",");
                }
                var isSearchPage = this.$stateParams.criteria || this.queryString.get("criteria");
                this.isCatalogPage = this.$attrs.isCatalogPage.toString().toLowerCase() === "true" && !isSearchPage;
                this.isBrandDetailPage = this.$attrs.isBrandDetailPage.toString().toLowerCase() === "true";
                this.enableDynamicRecommendations = this.$attrs.enableDynamicRecommendations.toString().toLowerCase() === "true";
                this.productCarouselElement = angular.element("[product-carousel-id='" + this.$attrs.productCarouselId + "']");
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.products = [];
                var cart = this.cartService.getLoadedCurrentCart();
                if (!cart) {
                    this.$scope.$on("cartLoaded", function () {
                        _this.addingToCart = false;
                    });
                }
                else {
                    this.addingToCart = false;
                }
                this.$scope.$on("cartChanged", function () {
                    if (_this.productCarouselType === "CustomersAlsoPurchased" && !_this.isProductDetailPage) {
                        _this.getCrossSells();
                    }
                });
                this.$scope.$on("fulfillmentMethodChanged", function () {
                    _this.products = null;
                    _this.getCrossSells();
                });
                this.$scope.$on("productLoaded", function (event, product) {
                    if (!_this.isProductLoaded()) {
                        _this.parentProduct = product;
                        _this.getCrossSells();
                    }
                });
                this.$scope.$on("catalogPageLoaded", function (event, catalogPage) {
                    if (_this.isCatalogPage) {
                        if (catalogPage.category) {
                            _this.selectedCategoryIds = [catalogPage.category.id];
                        }
                        if (catalogPage.brandId) {
                            _this.brandIds = [catalogPage.brandId];
                        }
                        _this.getCrossSells();
                    }
                });
            };
            ProductCarouselController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                if (!this.isProductDetailPage) {
                    this.getCrossSells();
                }
            };
            ProductCarouselController.prototype.getSettingsFailed = function (error) {
            };
            ProductCarouselController.prototype.getCrossSells = function () {
                var _this = this;
                if (typeof (this.productSettings) === "undefined") {
                    return;
                }
                if (this.productCarouselType === "RecentlyViewed") {
                    if (this.isProductDetailPage && !this.isProductLoaded()) {
                        return;
                    }
                    this.productService.getProducts({}, ["pricing", "recentlyviewed", "brand"]).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
                }
                else if (this.productCarouselType === "WebCrossSells") {
                    this.productService.getCrossSells(null).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
                }
                else if (this.productCarouselType === "RelatedProducts") {
                    if (this.isProductLoaded()) {
                        this.products = [];
                        angular.forEach(this.parentProduct.relatedProducts, function (relatedProduct) {
                            if (relatedProduct.relatedProductType === _this.relatedProductType) {
                                _this.products.push(relatedProduct.productDto);
                            }
                        });
                        this.waitForCarouselAndImages();
                        this.onCarouselProductsLoaded(this.products);
                    }
                }
                else if (this.productCarouselType === "CustomersAlsoPurchased") {
                    if (!this.enableDynamicRecommendations) {
                        return;
                    }
                    if (this.isProductDetailPage) {
                        if (!this.isProductLoaded()) {
                            return;
                        }
                        this.productService.getProductByParameters({ productId: this.parentProduct.id.toString(), alsoPurchasedMaxResults: this.numberOfProductsToDisplay, expand: "alsoPurchased" }).then(function (productModel) { _this.getProductCompleted(productModel); }, function (error) { _this.getProductFailed(error); });
                    }
                    else {
                        this.cartService.expand = "alsoPurchased";
                        this.cartService.alsoPurchasedMaxResults = this.numberOfProductsToDisplay;
                        this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
                    }
                }
                else if (this.productCarouselType === "TopSellers") {
                    if (!this.enableDynamicRecommendations) {
                        return;
                    }
                    if (this.isCatalogPage && this.selectedCategoryIds.length === 0 && !this.brandIds) {
                        return;
                    }
                    if (this.isBrandDetailPage && !this.brandIds) {
                        this.brandService.getBrandByPath(this.$window.location.pathname).then(function (brand) { _this.getBrandByPathCompleted(brand); }, function (error) { _this.getBrandByPathFailed(error); });
                        return;
                    }
                    this.productService.getProducts({
                        topSellersCategoryIds: this.selectedCategoryIds,
                        topSellersMaxResults: this.numberOfProductsToDisplay,
                        brandIds: this.brandIds,
                        makeBrandUrls: this.brandIds != null
                    }, ["brand"], ["topsellers"])
                        .then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
                }
                else if (this.productCarouselType === "FeaturedCategory") {
                    this.productService.getProducts({ categoryId: this.selectedCategoryIds[0], pageSize: 3 }).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
                }
            };
            ProductCarouselController.prototype.getProductsCompleted = function (productCollection) {
                this.onCarouselProductsLoaded(productCollection.products);
            };
            ProductCarouselController.prototype.getProductsFailed = function (error) {
            };
            ProductCarouselController.prototype.getProductCompleted = function (productModel) {
                var _this = this;
                var products = productModel.product.alsoPurchasedProducts;
                if (this.isProductLoaded() && this.seedWithManuallyAssigned && products.length < this.numberOfProductsToDisplay) {
                    angular.forEach(this.parentProduct.relatedProducts, function (relatedProduct) {
                        if (products.length < _this.numberOfProductsToDisplay && relatedProduct.relatedProductType === _this.seedWithManuallyAssigned && products.every(function (o) { return o.id !== relatedProduct.productDto.id; })) {
                            products.push(relatedProduct.productDto);
                        }
                    });
                }
                this.onCarouselProductsLoaded(products);
            };
            ProductCarouselController.prototype.getProductFailed = function (error) {
            };
            ProductCarouselController.prototype.getCartCompleted = function (cart) {
                this.onCarouselProductsLoaded(cart.alsoPurchasedProducts);
            };
            ProductCarouselController.prototype.getCartFailed = function (error) {
            };
            ProductCarouselController.prototype.getBrandByPathCompleted = function (brand) {
                this.brandIds = [brand.id];
                this.getCrossSells();
            };
            ProductCarouselController.prototype.getBrandByPathFailed = function (error) {
            };
            ProductCarouselController.prototype.onCarouselProductsLoaded = function (products) {
                var _this = this;
                this.products = products;
                if (this.parentProduct) {
                    this.products = this.products.filter(function (product) { return product.id !== _this.parentProduct.id; });
                }
                this.waitForCarouselAndImages();
                setTimeout(function () {
                    if (_this.carousel) {
                        _this.carousel.resize();
                    }
                });
                if (this.products && this.products.length > 0) {
                    this.carouselIncludesBrands = this.products.some(function (product) { return !!product.brand; });
                    this.getRealTimePrices();
                    if (!this.productSettings.inventoryIncludedWithPricing) {
                        this.getRealTimeInventory();
                    }
                }
            };
            ProductCarouselController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing) {
                    this.productService.getProductRealTimePrices(this.products).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            ProductCarouselController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            ProductCarouselController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            ProductCarouselController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory) {
                    this.productService.getProductRealTimeInventory(this.products).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
            };
            ProductCarouselController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory) {
            };
            ProductCarouselController.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            ProductCarouselController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            ProductCarouselController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            ProductCarouselController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            ProductCarouselController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            ProductCarouselController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            ProductCarouselController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            ProductCarouselController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            ProductCarouselController.prototype.showCarousel = function () {
                return !!this.products && this.products.length > 0;
            };
            ProductCarouselController.prototype.showQuantityBreakPricing = function (product) {
                return product.canShowPrice
                    && product.pricing
                    && !!product.pricing.unitRegularBreakPrices
                    && product.pricing.unitRegularBreakPrices.length > 1
                    && !product.quoteRequired;
            };
            ProductCarouselController.prototype.showUnitOfMeasure = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !!product.productUnitOfMeasures
                    && product.productUnitOfMeasures.length > 1
                    && this.productSettings.alternateUnitsOfMeasure;
            };
            ProductCarouselController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            ProductCarouselController.prototype.waitForCarouselAndImages = function (tries) {
                var _this = this;
                if (typeof (tries) === "undefined") {
                    this.imagesLoaded = 0;
                    tries = 1000; // Max 20s
                    this.productsWithImages = this.products.filter(function (product) { return !!product.mediumImagePath; }).length;
                }
                if (tries > 0) {
                    this.$timeout(function () {
                        if ($(".cs-carousel", _this.productCarouselElement).length > 0 && _this.imagesLoaded >= _this.productsWithImages) {
                            _this.initializeCarousel();
                            _this.$scope.$apply();
                        }
                        else {
                            _this.waitForCarouselAndImages(tries - 1);
                        }
                    }, 20, false);
                }
                else {
                    this.initializeCarousel();
                    this.$scope.$apply();
                }
            };
            ProductCarouselController.prototype.isProductLoaded = function () {
                return this.parentProduct && typeof this.parentProduct === "object";
            };
            ProductCarouselController.prototype.initializeCarousel = function () {
                var _this = this;
                var num = $(".cs-carousel .isc-productContainer", this.productCarouselElement).length;
                var itemsNum = this.getItemsNumber();
                var container = $(".cs-carousel", this.productCarouselElement);
                container.removeData("flexslider");
                container.flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    touch: num > itemsNum,
                    itemWidth: this.getItemSize(),
                    minItems: this.getItemsNumber(),
                    maxItems: this.getItemsNumber(),
                    move: this.getItemsMove(),
                    customDirectionNav: $(".carousel-control-nav", this.productCarouselElement),
                    start: function (slider) { _this.onCarouselStart(slider); }
                });
                $(window).resize(function () { _this.onWindowResize(); });
            };
            ProductCarouselController.prototype.onCarouselStart = function (slider) {
                this.carousel = slider;
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            ProductCarouselController.prototype.onWindowResize = function () {
                this.reloadCarousel();
                this.setCarouselSpeed();
            };
            ProductCarouselController.prototype.setCarouselSpeed = function () {
                if (!this.carousel) {
                    return;
                }
                var container = $(".cs-carousel", this.productCarouselElement);
                if (container.innerWidth() > 768) {
                    this.carousel.vars.move = 2;
                }
                else {
                    this.carousel.vars.move = 1;
                }
            };
            ProductCarouselController.prototype.getItemSize = function () {
                var el = $(".cs-carousel", this.productCarouselElement);
                var width = el.innerWidth();
                if (width > 768) {
                    width = width / 4;
                }
                else if (width > 480) {
                    width = width / 3;
                }
                return width;
            };
            ProductCarouselController.prototype.getItemsMove = function () {
                var container = $(".cs-carousel", this.productCarouselElement);
                if (container.innerWidth() > 768) {
                    return 2;
                }
                else {
                    return 1;
                }
            };
            ProductCarouselController.prototype.getItemsNumber = function () {
                var el = $(".cs-carousel", this.productCarouselElement);
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
            ProductCarouselController.prototype.reloadCarousel = function () {
                var _this = this;
                if (!this.carousel) {
                    return;
                }
                var num = $(".cs-carousel .isc-productContainer", this.productCarouselElement).length;
                var el = $(".cs-carousel", this.productCarouselElement);
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
            ProductCarouselController.prototype.equalizeCarouselDimensions = function () {
                if ($(".carousel-item-equalize", this.productCarouselElement).length > 0) {
                    var maxHeight_1 = -1;
                    var maxThumbHeight_1 = -1;
                    var maxNameHeight_1 = -1;
                    var maxProductInfoHeight_1 = -1;
                    var navHeight = "min-height:" + $("ul.item-list", this.productCarouselElement).height();
                    $(".left-nav-2", this.productCarouselElement).attr("style", navHeight);
                    // clear the height overrides
                    $(".carousel-item-equalize", this.productCarouselElement).each(function () {
                        var $this = $(this);
                        $this.find(".item-thumb").height("auto");
                        $this.find(".item-name").height("auto");
                        $this.find(".product-info").height("auto");
                        $this.height("auto");
                    });
                    // find the max heights
                    $(".carousel-item-equalize", this.productCarouselElement).each(function () {
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
                        $(".carousel-item-equalize", this.productCarouselElement).each(function () {
                            var $this = $(this);
                            $this.find(".item-thumb").height(maxThumbHeight_1);
                            $this.find(".item-name").height(maxNameHeight_1);
                            $this.find(".product-info").height(maxProductInfoHeight_1);
                            var height = $this.height();
                            maxHeight_1 = maxHeight_1 > height ? maxHeight_1 : height;
                            $this.addClass("eq");
                        });
                        $(".carousel-item-equalize", this.productCarouselElement).height(maxHeight_1);
                    }
                }
            };
            ProductCarouselController.prototype.showCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $(".carousel-control-nav", this.productCarouselElement).show();
                }
                else {
                    $(".carousel-control-nav", this.productCarouselElement).hide();
                }
            };
            ProductCarouselController.$inject = [
                "cartService",
                "productService",
                "$timeout",
                "addToWishlistPopupService",
                "settingsService",
                "$scope",
                "$attrs",
                "queryString",
                "$stateParams",
                "brandService",
                "$window"
            ];
            return ProductCarouselController;
        }());
        catalog.ProductCarouselController = ProductCarouselController;
        angular
            .module("insite")
            .controller("ProductCarouselController", ProductCarouselController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-carousel.controller.js.map