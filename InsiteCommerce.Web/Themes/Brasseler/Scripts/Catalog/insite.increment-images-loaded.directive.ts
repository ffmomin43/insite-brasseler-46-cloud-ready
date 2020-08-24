module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("incrementImagesLoaded", () => ({
            link: (scope: any, element: ng.IAugmentedJQuery) => {
                element.on("load error", () => {
                    scope.vm.imagesLoaded++;
                });
            },
            restrict: "A"
        }));
}