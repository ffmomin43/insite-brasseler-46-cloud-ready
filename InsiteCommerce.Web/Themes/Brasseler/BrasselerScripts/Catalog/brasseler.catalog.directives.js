var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscBrasselerQuantityBreakPricing", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    scope: {
                        productId: "=",
                        breakPrices: "=",
                        relatedProducts: "=",
                        cart: "=",
                        cartLine: "=",
                        volumeGrpDescription: "=",
                        block: "@"
                    },
                    templateUrl: "/PartialViews/Catalog-PDPQuantityBreakPricing"
                };
            }])
            .directive("iscBrasselerCartQuantityBreakPricing", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    controller: "CartLinesController",
                    controllerAs: "vm",
                    scope: {
                        productId: "=",
                        breakPrices: "=",
                        relatedProducts: "=",
                        cart: "=",
                        cartLine: "=",
                        volumeGrpDescription: "=",
                        qtyBrkCls: "=",
                        block: "@"
                    },
                    templateUrl: "/PartialViews/Catalog-CartQuantityBreakPricing"
                };
            }])
            .directive("iscVolumeGrpCartLines", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/Cart-VolumeGrpCartLines",
                    scope: {
                        cart: "=",
                        inventoryCheck: "@",
                        includeInventory: "@",
                        includeQuoteRequired: "=",
                        isCartPage: "=",
                        showAddToList: "=",
                        promotions: "=",
                        failedToGetRealTimeInventory: "="
                    },
                    controller: "CartLinesController",
                    controllerAs: "vm",
                    link: function (scope, element, attrs) {
                        scope.editable = attrs.editable === "true";
                        scope.quoteRequiredFilter = function (value) {
                            if (scope.includeQuoteRequired) {
                                return true;
                            }
                            return value.quoteRequired === false;
                        };
                    }
                };
            }])
            .directive("iscSubscriptionProductPrice", ["coreService", function (coreService) {
                return {
                    controller: "ProductPriceController",
                    controllerAs: "vm",
                    restrict: "E",
                    scope: {
                        product: "=",
                        idKey: "@"
                    },
                    templateUrl: "/PartialViews/Catalog-SubscriptionProductPrice"
                };
            }])
            .directive("iscSampleProductPopup", function () { return ({
            restrict: "E",
            scope: {
                message: "="
            },
            templateUrl: "/PartialViews/Cart-SampleProductPopup"
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.catalog.directives.js.map