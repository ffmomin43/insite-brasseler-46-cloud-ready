module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscCatalogBreadcrumb", () => ({
            restrict: "E",
            replace: true,
            scope: {
                breadcrumbs: "=",
                searchQuery: "="
            },
            templateUrl: "/PartialViews/Catalog-BreadCrumb"
        }))
        .directive("iscProductName", () => ({
            restrict: "E",
            replace: true,
            scope: {
                product: "=",
                noLink: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductName"
        }))
        .directive("iscProductThumb", () => ({
            restrict: "E",
            scope: {
                product: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductThumb"
        }))
        .directive("iscAvailabilityMessage", () => ({
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
        }))
        .directive("iscProductSalePriceLabel", () => ({
            controller: "ProductSalePriceLabelController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                price: "=",
                hideSalePriceLabel: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductSalePriceLabel"
        }))
        .directive("iscProductPrice", () => ({
            controller: "ProductPriceController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                idKey: "@",
                hideSalePriceLabel: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductPrice"
        }))
        .directive("iscProductPriceSaving", () => ({
            controller: "ProductPriceSavingController",
            controllerAs: "vm",
            restrict: "E",
            scope: {
                product: "=",
                currencySymbol: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductPriceSaving"
        }))
        .directive("iscQuantityBreakPricing", () => ({
            restrict: "E",
            scope: {
                productId: "=",
                breakPrices: "=",
                block: "@"
            },
            templateUrl: "/PartialViews/Catalog-QuantityBreakPricing"
        }))
        .directive("iscSortedAttributeValueList", () => ({
            restrict: "E",
            replace: true,
            scope: {
                attributeTypes: "=",
                brand: "=",
                maximumNumber: "@"
            },
            templateUrl: "/PartialViews/Catalog-SortedAttributeValueList"
        }))
        .directive("iscUnitOfMeasureSelectList", () => ({
            restrict: "E",
            templateUrl: "/PartialViews/Catalog-UnitOfMeasureSelectList",
            scope: {
                product: "=",
                alternateUnitsOfMeasure: "@",
                displayPack: "@",
                changeUnitOfMeasure: "&",
                readOnly: "@"
            }
        }))
        .directive("iscUnitOfMeasureDisplay", () => ({
            restrict: "E",
            templateUrl: "/PartialViews/Catalog-UnitOfMeasureDisplay",
            scope: {
                product: "="
            }
        }));
}