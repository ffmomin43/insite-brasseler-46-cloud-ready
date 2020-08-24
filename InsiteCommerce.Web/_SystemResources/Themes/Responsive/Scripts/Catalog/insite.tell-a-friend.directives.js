var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscTellAFriendPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {},
            templateUrl: "/PartialViews/Catalog-TellAFriendPopup",
            controller: "TellAFriendController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscTellAFriendField", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Catalog-TellAFriendField",
            scope: {
                fieldLabel: "@",
                fieldName: "@",
                isRequired: "@",
                isEmail: "@",
                fieldValue: "="
            }
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.tell-a-friend.directives.js.map