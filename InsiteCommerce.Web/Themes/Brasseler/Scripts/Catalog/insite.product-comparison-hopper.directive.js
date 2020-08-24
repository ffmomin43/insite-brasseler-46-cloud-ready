var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscProductComparisonHopper", function () { return ({
            controller: "ProductComparisonHopperController",
            controllerAs: "vm",
            replace: true,
            restrict: "E",
            templateUrl: "productList_productComparisonHopper",
            link: function (scope, element) {
                $("body").append(element);
            },
            bindToController: true
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-comparison-hopper.directive.js.map