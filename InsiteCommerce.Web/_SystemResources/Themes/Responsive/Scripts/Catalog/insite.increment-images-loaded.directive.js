var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("incrementImagesLoaded", function () { return ({
            link: function (scope, element) {
                element.on("load error", function () {
                    scope.vm.imagesLoaded++;
                });
            },
            restrict: "A"
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.increment-images-loaded.directive.js.map