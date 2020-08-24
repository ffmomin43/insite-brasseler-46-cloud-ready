var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductImageCarouselController = /** @class */ (function () {
            function ProductImageCarouselController($timeout, $scope) {
                this.$timeout = $timeout;
                this.$scope = $scope;
            }
            ProductImageCarouselController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.productImages; }, function () {
                    if (_this.productImages.length > 0) {
                        _this.imagesLoaded = 0;
                        _this.waitForDom(_this.maxTries);
                    }
                });
            };
            ProductImageCarouselController.prototype.waitForDom = function (tries) {
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
            ProductImageCarouselController.prototype.isCarouselDomReadyAndImagesLoaded = function () {
                return $("#" + this.prefix + "-img-carousel").length > 0 && this.productImages
                    && this.imagesLoaded >= this.productImages.length;
            };
            ProductImageCarouselController.prototype.initializeCarousel = function () {
                var _this = this;
                var $carousel = $("#" + this.prefix + "-img-carousel");
                if ($carousel.data("flexslider")) {
                    $carousel.removeData("flexslider");
                }
                $carousel.flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    animationSpeed: 200,
                    itemWidth: 46,
                    itemMargin: 4.8,
                    move: 1,
                    customDirectionNav: $("." + this.prefix + "-carousel-control-nav"),
                    start: function (slider) { _this.onSliderStart(slider); }
                });
                $(window).resize(function () { _this.onWindowResize(); });
            };
            ProductImageCarouselController.prototype.onSliderStart = function (slider) {
                this.carousel = slider;
                this.carouselWidth = this.getCarouselWidth();
                this.reloadCarousel();
            };
            ProductImageCarouselController.prototype.onWindowResize = function () {
                var currentCarouselWidth = this.getCarouselWidth();
                if (currentCarouselWidth && this.carouselWidth !== currentCarouselWidth) {
                    this.carouselWidth = currentCarouselWidth;
                    this.reloadCarousel();
                    $("#" + this.prefix + "-img-carousel").data("flexslider").flexAnimate(0);
                }
            };
            ProductImageCarouselController.prototype.reloadCarousel = function () {
                var $carousel = $("#" + this.prefix + "-img-carousel");
                var totalCarouselWidth = Math.round((this.carousel.vars.itemWidth + this.carousel.vars.itemMargin) * this.carousel.count - this.carousel.vars.itemMargin);
                $("#" + this.prefix + "-img-carousel-wrapper").css({
                    visibility: "visible",
                    position: "relative"
                });
                $carousel.css({
                    width: "",
                    margin: ""
                });
                if (totalCarouselWidth < $carousel.width()) {
                    $carousel.css({
                        width: totalCarouselWidth,
                        margin: "0 auto"
                    });
                }
                // this line should be there because of a flexslider issue (https://github.com/woocommerce/FlexSlider/issues/1263)
                $carousel.resize();
                this.showImageCarouselArrows($carousel.width() < totalCarouselWidth);
            };
            ProductImageCarouselController.prototype.showImageCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $("." + this.prefix + "-carousel-control-nav").show();
                }
                else {
                    $("." + this.prefix + "-carousel-control-nav").hide();
                }
            };
            ProductImageCarouselController.prototype.selectImage = function (image) {
                var _this = this;
                this.selectedImage = image;
                this.$timeout(function () {
                    _this.reloadCarousel();
                }, 20);
            };
            ProductImageCarouselController.$inject = ["$timeout", "$scope"];
            return ProductImageCarouselController;
        }());
        catalog.ProductImageCarouselController = ProductImageCarouselController;
        angular
            .module("insite")
            .controller("ProductImageCarouselController", ProductImageCarouselController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-image-carousel.controller.js.map