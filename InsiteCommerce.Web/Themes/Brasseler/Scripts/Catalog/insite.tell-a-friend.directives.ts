module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscTellAFriendPopup", () => ({
            restrict: "E",
            replace: true,
            scope: {},
            templateUrl: "/PartialViews/Catalog-TellAFriendPopup",
            controller: "TellAFriendController",
            controllerAs: "vm",
            bindToController: true
        }))
        .directive("iscTellAFriendField", () => ({
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
        }));
}