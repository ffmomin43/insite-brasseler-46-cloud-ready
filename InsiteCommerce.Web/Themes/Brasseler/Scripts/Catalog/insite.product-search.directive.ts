module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscProductSearch", () => ({
            controller: "ProductSearchController",
            controllerAs: "vm",
            bindToController: true,
            replace: true,
            restrict: "E",
            scope: {
                isVisibleSearchInput: "="
            },
            templateUrl: "header_productSearch"
        }));
}