module insite.message {
    "use strict";

    angular
        .module("insite")
        .directive("iscMessageList", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Messages-MessageList",
            controller: "MessageController",
            controllerAs: "vm",
            scope: { }
        }));
}