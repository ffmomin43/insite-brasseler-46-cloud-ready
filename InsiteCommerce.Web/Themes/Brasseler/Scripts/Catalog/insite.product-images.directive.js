var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscProductImages", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                product: "=",
                imageProvider: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductImages",
            controller: "ProductImagesController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-images.directive.js.map