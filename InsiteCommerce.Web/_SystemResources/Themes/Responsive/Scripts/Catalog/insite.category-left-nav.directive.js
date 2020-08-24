var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCategoryLeftNav", function () { return ({
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
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.category-left-nav.directive.js.map