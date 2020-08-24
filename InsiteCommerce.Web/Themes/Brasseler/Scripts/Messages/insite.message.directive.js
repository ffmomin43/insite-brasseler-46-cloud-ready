var insite;
(function (insite) {
    var message;
    (function (message) {
        "use strict";
        angular
            .module("insite")
            .directive("iscMessageList", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Messages-MessageList",
            controller: "MessageController",
            controllerAs: "vm",
            scope: {}
        }); });
    })(message = insite.message || (insite.message = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.message.directive.js.map