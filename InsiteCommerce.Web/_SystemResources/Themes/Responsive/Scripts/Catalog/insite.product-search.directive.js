var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscProductSearch", function () { return ({
            controller: "ProductSearchController",
            controllerAs: "vm",
            bindToController: true,
            replace: true,
            restrict: "E",
            scope: {
                isVisibleSearchInput: "="
            },
            templateUrl: "header_productSearch"
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-search.directive.js.map