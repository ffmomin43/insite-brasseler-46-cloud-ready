module insite.brands {
    "use strict";

    angular
        .module("insite")
        .directive("iscProductBrand", () => ({
            restrict: "E",
            scope: {
                product: "=",
                showLogo: "@",
                carouselIncludesBrands: "="
            },
            templateUrl: "/PartialViews/Brands-ProductBrand"
        }));
}