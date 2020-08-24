var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        angular
            .module("insite")
            .directive("iscRecentOrders", function () { return ({
            controller: "RecentOrdersController",
            controllerAs: "vm",
            replace: true,
            restrict: "E",
            scope: {},
            templateUrl: "/PartialViews/History-RecentOrders"
        }); });
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order.directive.js.map