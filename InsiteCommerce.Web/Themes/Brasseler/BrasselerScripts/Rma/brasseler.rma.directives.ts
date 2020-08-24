module insite.rma {
    "use strict";

    angular
        .module("insite")
        .directive("iscRmaPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: false,
                templateUrl: "/PartialViews/Rma-RmaPopup"
            };
        }]);
}