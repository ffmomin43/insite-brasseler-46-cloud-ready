var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        angular
            .module("insite")
            .directive("iscLeaveListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-LeaveListPopup",
            scope: {
                leaveList: "&",
                closeModal: "&",
                redirectToUrl: "@"
            }
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.leave-list-popup.directive.js.map