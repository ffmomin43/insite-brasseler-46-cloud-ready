var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCompareProductsCarousel", function () { return ({
            controller: "CompareProductsCarouselController",
            controllerAs: "vm",
            replace: true,
            restrict: "E",
            scope: {
                addToCart: "&",
                removeComparedProduct: "&",
                productsToCompare: "=",
                openWishListPopup: "&",
                productSettings: "=",
                carouselIncludesBrands: "="
            },
            templateUrl: "productComparison_carousel",
            bindToController: true
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.compare-products-carousel.directive.js.map