module insite.core {
    "use strict";

    angular
        .module("insite")
        .directive("iscPager", () => ({
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
        }));
}