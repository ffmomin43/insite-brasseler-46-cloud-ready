module insite.wishlist {
    "use strict";

    angular
        .module("insite")
        .directive("iscLeaveListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-LeaveListPopup",
            scope: {
                leaveList: "&",
                closeModal: "&",
                redirectToUrl: "@"
            }
        }));
}