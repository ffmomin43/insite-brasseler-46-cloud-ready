module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscCategoryLeftNav", () => ({
            restrict: "E",
            replace: true,
            scope: {
                products: "=",
                breadCrumbs: "=",
                attributeValueIds: "=",
                filterCategory: "=",
                priceFilterMinimums: "=",
                searchWithinTerms: "=",
                category: "=",
                brandIds: "=",
                productLineIds: "=",
                showBrands: "=",
                showProductLines: "=",
                previouslyPurchasedProducts: "=",
                searchSettings: "=",
                productSettings: "=",
                stockedItemsOnly: "=",
                session: "="
            },
            templateUrl: "productList_categoryLeftNav",
            controller: "CategoryLeftNavController",
            controllerAs: "vm",
            bindToController: true
        }));
}