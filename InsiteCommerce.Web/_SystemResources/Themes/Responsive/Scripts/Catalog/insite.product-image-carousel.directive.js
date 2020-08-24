var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscProductImageCarousel", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                productImages: "=",
                selectedImage: "=",
                prefix: "@",
                maxTries: "@",
                getCarouselWidth: "&",
                imageProvider: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductImageCarousel",
            controller: "ProductImageCarouselController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-image-carousel.directive.js.map