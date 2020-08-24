interface JQuery {
    flexslider: any;
}

module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscCrossSellCarousel", () => ({
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
            link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes, controller: CrossSellCarouselController) => {
                if (controller) {
                    controller.carouselElement = element;
                }
            }
        }));
}