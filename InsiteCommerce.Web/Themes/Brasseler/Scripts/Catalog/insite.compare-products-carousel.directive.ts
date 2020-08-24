module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscCompareProductsCarousel", () => ({
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
        }));
}