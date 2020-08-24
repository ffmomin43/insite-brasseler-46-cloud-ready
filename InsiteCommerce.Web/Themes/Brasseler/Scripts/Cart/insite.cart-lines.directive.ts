module insite.cart {
    "use strict";

    angular
        .module("insite")
        .directive("iscCartLines", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Cart-CartLines",
            scope: {
                cart: "=",
                promotions: "=",
                isCartPage: "=",
                showAddToList: "=",
                inventoryCheck: "@",
                includeInventory: "@",
                includeQuoteRequired: "=",
                failedToGetRealTimeInventory: "="
            },
            controller: "CartLinesController",
            controllerAs: "vm",
            link: ($scope: any, element, attrs) => {
                $scope.editable = attrs.editable === "true";
                $scope.quoteRequiredFilter = (value) => {
                    if ($scope.includeQuoteRequired) {
                        return true;
                    }
                    return value.quoteRequired === false;
                };
            }
        }));
}