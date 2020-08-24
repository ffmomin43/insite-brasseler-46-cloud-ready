var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        angular
            .module("insite")
            .controller("SharedListController", wishlist.SharedListController)
            .directive("iscSharedList", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-SharedList",
            scope: {
                list: "=",
                session: "=",
                listSettings: "=",
                showNoPermissionsTooltip: "="
            },
            controller: "SharedListController",
            controllerAs: "vm"
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.shared-list.directive.js.map