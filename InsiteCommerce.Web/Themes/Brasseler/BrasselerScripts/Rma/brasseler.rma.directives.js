var insite;
(function (insite) {
    var rma;
    (function (rma) {
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
    })(rma = insite.rma || (insite.rma = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.rma.directives.js.map