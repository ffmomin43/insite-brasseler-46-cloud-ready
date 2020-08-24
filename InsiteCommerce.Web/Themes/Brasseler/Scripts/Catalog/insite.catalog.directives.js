var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCatalogBreadcrumb", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                breadcrumbs: "=",
                searchQuery: "="
            },
            templateUrl: "/PartialViews/Catalog-BreadCrumb"
        }); })
            .directive("iscProductName", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                product: "=",
                noLink: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductName"
        }); })
            .directive("iscProductThumb", function () { return ({
            restrict: "E",
            scope: {
                product: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductThumb"
        }); })
            .directive("iscAvailabilityMessage", function () { return ({
            controller: "ProductAvailabilityMessageController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                availability: "=",
                failedToGetRealTimeInventory: "=",
                productSettings: "=",
                productId: "=",
                unitOfMeasure: "=",
                configuration: "=",
                page: "@",
                trackInventory: "="
            },
            templateUrl: "/PartialViews/Catalog-AvailabilityMessage"
        }); })
            .directive("iscProductSalePriceLabel", function () { return ({
            controller: "ProductSalePriceLabelController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                price: "=",
                hideSalePriceLabel: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductSalePriceLabel"
        }); })
            .directive("iscProductPrice", function () { return ({
            controller: "ProductPriceController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                idKey: "@",
                hideSalePriceLabel: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductPrice"
        }); })
            .directive("iscProductPriceSaving", function () { return ({
            controller: "ProductPriceSavingController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                currencySymbol: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductPriceSaving"
        }); })
            .directive("iscQuantityBreakPricing", function () { return ({
            restrict: "E",
            scope: {
                productId: "=",
                breakPrices: "=",
                block: "@"
            },
            templateUrl: "/PartialViews/Catalog-QuantityBreakPricing"
        }); })
            .directive("iscSortedAttributeValueList", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                attributeTypes: "=",
                brand: "=",
                maximumNumber: "@"
            },
            templateUrl: "/PartialViews/Catalog-SortedAttributeValueList"
        }); })
            .directive("iscUnitOfMeasureSelectList", function () { return ({
            restrict: "E",
            templateUrl: "/PartialViews/Catalog-UnitOfMeasureSelectList",
            scope: {
                product: "=",
                alternateUnitsOfMeasure: "@",
                displayPack: "@",
                changeUnitOfMeasure: "&",
                readOnly: "@"
            }
        }); })
            .directive("iscUnitOfMeasureDisplay", function () { return ({
            restrict: "E",
            templateUrl: "/PartialViews/Catalog-UnitOfMeasureDisplay",
            scope: {
                product: "="
            }
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.catalog.directives.js.map