var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            .directive("iscPager", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Core-Pager",
            scope: {
                pagination: "=",
                bottom: "@",
                updateData: "&",
                customContext: "=",
                storageKey: "=",
                pageChanged: "&",
                canEditSortOrder: "=",
                isSortingMode: "="
            },
            controller: "PagerController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.pager.directives.js.map