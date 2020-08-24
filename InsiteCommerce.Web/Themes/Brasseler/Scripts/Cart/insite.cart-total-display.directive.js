var insite;
(function (insite) {
    var cart;
    (function (cart) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCartTotalDisplay", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Cart-CartTotalDisplay",
            scope: {
                cart: "=",
                promotions: "=",
                orderTaxes: "=",
                isCartPage: "=",
                showSeparateShippingAndHandling: "=",
                showMiscCharge: "=",
                showDiscountTotal: "=",
                label: "="
            },
            link: function ($scope) {
                $scope.discountOrderFilter = function (promotion) {
                    return (promotion.promotionResultType === "AmountOffOrder" || promotion.promotionResultType === "PercentOffOrder");
                };
                $scope.discountShippingFilter = function (promotion) {
                    return (promotion.promotionResultType === "AmountOffShipping" || promotion.promotionResultType === "PercentOffShipping");
                };
                $scope.discountTotal = function (promotions, currencySymbol) {
                    var discountTotal = 0;
                    if (promotions) {
                        promotions.forEach(function (promotion) {
                            if (promotion.promotionResultType === "AmountOffOrder" || promotion.promotionResultType === "PercentOffOrder"
                                || promotion.promotionResultType === "AmountOffShipping" || promotion.promotionResultType === "PercentOffShipping") {
                                discountTotal += promotion.amount;
                            }
                        });
                    }
                    return currencySymbol + discountTotal.toFixed(2);
                };
            }
        }); });
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cart-total-display.directive.js.map