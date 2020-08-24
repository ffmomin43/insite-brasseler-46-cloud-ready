var insite;
(function (insite) {
    "use strict";
    angular
        .module("insite")
        .directive("iscContentPager", function () { return ({
        restrict: "E",
        replace: true,
        templateUrl: "/PartialViews/Content-ContentPager",
        scope: {},
        controller: "ContentPagerController",
        controllerAs: "vm",
        bindToController: true
    }); });
})(insite || (insite = {}));
//# sourceMappingURL=insite.content.directives.js.map