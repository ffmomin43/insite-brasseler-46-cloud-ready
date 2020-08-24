module insite {
    "use strict";

    angular
        .module("insite")
        .directive("iscContentPager", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Content-ContentPager",
            scope: {},
            controller: "ContentPagerController",
            controllerAs: "vm",
            bindToController: true
        }));
}