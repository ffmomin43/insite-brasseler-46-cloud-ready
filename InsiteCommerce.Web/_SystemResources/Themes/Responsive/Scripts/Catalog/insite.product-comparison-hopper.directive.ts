module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscProductComparisonHopper", () => ({
            controller: "ProductComparisonHopperController",
            controllerAs: "vm",
            replace: true,
            restrict: "E",
            templateUrl: "productList_productComparisonHopper",
            link: (scope, element) => {
                $("body").append(element);
            },
            bindToController: true
        }));
}