var insite;
(function (insite) {
    var brands;
    (function (brands) {
        "use strict";
        angular
            .module("insite")
            .directive("iscProductBrand", function () { return ({
            restrict: "E",
            scope: {
                product: "=",
                showLogo: "@",
                carouselIncludesBrands: "="
            },
            templateUrl: "/PartialViews/Brands-ProductBrand"
        }); });
    })(brands = insite.brands || (insite.brands = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.brand.directives.js.map