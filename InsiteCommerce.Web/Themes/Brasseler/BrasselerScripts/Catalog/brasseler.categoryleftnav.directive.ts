module insite.catalog {
    angular
        .module("insite")
        .directive("brasselerCategoryLeftNav", ["coreService", (coreService: core.ICoreService) => {
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
                    category: "="
                },
                templateUrl: "/PartialViews/Catalog-BrasselerCategoryLeftNav",
                controller: "CategoryLeftNavController",
                controllerAs: "vm",
                bindToController: true
            }
        }]);
}