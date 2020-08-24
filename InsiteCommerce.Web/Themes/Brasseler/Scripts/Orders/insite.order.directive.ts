module insite.order {
    "use strict";

    angular
        .module("insite")
        .directive("iscRecentOrders", () => ({
            controller: "RecentOrdersController",
            controllerAs: "vm",
            replace: true,
            restrict: "E",
            scope: {
            },
            templateUrl: "/PartialViews/History-RecentOrders"
        }));
}