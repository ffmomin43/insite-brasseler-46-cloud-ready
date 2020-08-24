var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCrossSellCarousel", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                productCrossSell: "@",
                product: "=",
                maxTries: "@"
            },
            templateUrl: "/PartialViews/Catalog-CrossSellCarousel",
            controller: "CrossSellCarouselController",
            controllerAs: "vm",
            bindToController: true,
            link: function (scope, element, attrs, controller) {
                if (controller) {
                    controller.carouselElement = element;
                }
            }
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cross-sell-carousel.directive.js.map