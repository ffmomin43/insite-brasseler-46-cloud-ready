var insite;
(function (insite) {
    var cart;
    (function (cart) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCartLines", function () { return ({
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
            link: function ($scope, element, attrs) {
                $scope.editable = attrs.editable === "true";
                $scope.quoteRequiredFilter = function (value) {
                    if ($scope.includeQuoteRequired) {
                        return true;
                    }
                    return value.quoteRequired === false;
                };
            }
        }); });
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cart-lines.directive.js.map