var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        angular
            .module("insite")
            .directive("brasselerCategoryLeftNav", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    scope: {
                        products: "=",
                        breadCrumbs: "=",
                        attributeValueIds: "=",
                        filterCategory: "=",
                        priceFilterMinimums: "=",
                        updateProductData: "&",
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
                    templateUrl: "/PartialViews/Catalog-BrasselerCategoryLeftNav",
                    controller: "CategoryLeftNavController",
                    controllerAs: "vm",
                    bindToController: true
                };
            }]);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.categoryleftnav.directive.js.map