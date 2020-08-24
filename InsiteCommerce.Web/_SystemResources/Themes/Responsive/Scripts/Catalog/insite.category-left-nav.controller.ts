import AttributeValueFacetDto = Insite.Core.Plugins.Search.Dtos.AttributeValueFacetDto;
import PriceFacetDto = Insite.Core.Plugins.Search.Dtos.PriceFacetDto;
import GenericFacetDto = Insite.Core.Plugins.Search.Dtos.GenericFacetDto;

module insite.catalog {
    "use strict";

    export class CategoryLeftNavController {
        products: ProductCollectionModel; // full product collection model from the last rest api call
        breadCrumbs: BreadCrumbModel[];
        attributeValueIds: string[]; // a list of selected attributes, used by productlist to request data
        brandIds: string[]; // a list of selected brands, used by productlist to request data
        productLineIds: string[]; // a list of selected product lines, used by productlist to request data
        filterCategory: CategoryFacetDto; // category selected by user, used by productlist to request data
        priceFilterMinimums: string[]; // a list of the prices selected by the user, used by productlist to request data
        searchWithinTerms: any[]; // search within search terms
        category: CategoryModel; // category if this is a category page
        attributeValues: AttributeValueFacetDto[] = []; // private list of attributes for the ui to display
        priceFilters: PriceFacetDto[] = []; // private list of price ranges for the ui to display
        brandFilters: GenericFacetDto[] = [];
        productLineFilters: GenericFacetDto[] = [];
        attributeTypeAttributeValueLimits: {} = {}; // dictionary of attribute types and the number of attribute values to show
        currencySymbol: string;
        searchWithinInput: string;
        showBrands: boolean;
        showProductLines: boolean;
        filterBrandId: string;
        filterProductLineId: string;

        static $inject = ["$timeout", "$window", "$scope", "$rootScope", "sessionService"];

        constructor(
            protected $timeout: ng.ITimeoutService,
            protected $window: ng.IWindowService,
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected sessionService: account.ISessionService) {
        }

        $onInit(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.onGetSessionCompleted(session); },
                (error: any) => { this.onGetSessionFailed(error); });

            this.getAllSelectedFilters();

            this.$window.addEventListener("popstate", () => { this.onPopState(); });

            this.$scope.$on("ProductListController-filterLoaded", () => { this.onFilterLoaded(); });
        }

        protected onGetSessionCompleted(session: SessionModel): void {
            this.currencySymbol = session.currency.currencySymbol;
        }

        protected onGetSessionFailed(error: any): void {
        }

        protected onPopState(): void {
            this.$timeout(() => {
                this.getAllSelectedFilters();
            }, 0);
        }

        protected onFilterLoaded(): void {
            this.$timeout(() => {
                this.getAllSelectedFilters();
            }, 0);
        }

        getAllSelectedFilters(){
            this.getSelectedFilters();
            this.getSelectedPriceFilters();
            this.getSelectedBrandFilters();
            this.getSelectedProductLineFilters();
        }

        toggleFilter(attributeValueId: string): void {
            this.changeArrayValue(attributeValueId, this.attributeValueIds);
            this.getSelectedFilters();
            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "attribute");
        }

        togglePreviouslyPurchasedProducts(): void {
            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "previouslyPurchasedProducts");
        }

        toggleStockedItemsOnly(): void {
            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "stockedItemsOnly");
        }

        // removes or adds item to array
        protected changeArrayValue(item: string, array: string[]): void {
            if (this.products && this.products.attributeTypeFacets && this.products.attributeTypeFacets.some(atf => atf.attributeTypeId === item)) {
                const facet = this.products.attributeTypeFacets.filter(atf => atf.attributeTypeId === item)[0];
                facet.attributeValueFacets.forEach((av) => {
                    if ($.inArray(av.attributeValueId, array) !== -1) {
                        array.splice(array.indexOf(av.attributeValueId.toString()), 1);
                    }
                });

                return;
            }

            if ($.inArray(item, array) !== -1) {
                const facet = this.products.attributeTypeFacets.filter(atf => (atf as any).attributeValueId === item)[0];
                if (facet) {
                    (facet as any).attributeValueId = "";
                }
                array.splice(array.indexOf(item), 1);
            } else {
                array.push(item);
            }
        }

        toggleCategory(categoryFacet: CategoryFacetDto): void {
            if (categoryFacet && !categoryFacet.selected) {
                this.filterCategory.categoryId = categoryFacet.categoryId;
                this.filterCategory.shortDescription = categoryFacet.shortDescription;
            } else {
                this.filterCategory.categoryId = "";
            }

            categoryFacet.selected = !categoryFacet.selected;

            this.attributeValueIds.length = 0;
            this.priceFilterMinimums.length = 0;

            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "category");
        }

        toggleBrandId(brandId: string): void {

            this.changeGenericArrayValue(brandId, this.brandIds);
            this.getSelectedBrandFilters();

            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "brand");
        }

        toggleProductLineId(productLineId: string): void {

            this.changeGenericArrayValue(productLineId, this.productLineIds);
            this.getSelectedProductLineFilters();

            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "product line");
        }

        changeGenericArrayValue(id: string, array: string[]): void {
            if(!id){
                array.length = 0;
                return;
            }
            const index = array.indexOf(id);
            if (index > -1){
                array.splice(index, 1);
            }
            else {
                array.push(id);
            }
        }

        toggleCategoryId(categoryId: string): void {
            let categoryFacet: CategoryFacetDto;
            this.products.categoryFacets.forEach((c) => {
                if (c.categoryId.toString() === categoryId) {
                    categoryFacet = c;
                }
            });
            this.toggleCategory(categoryFacet);
        }

        togglePriceFilter(minimumPrice: string): void {
            this.changeArrayValue(minimumPrice, this.priceFilterMinimums);
            this.getSelectedPriceFilters();

            this.attributeValueIds.length = 0;

            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "price");
        }

        priceRangeDisplay(priceFacet: PriceFacetDto): string {
            return `${this.currencySymbol}${priceFacet.minimumPrice} - ${this.currencySymbol}${priceFacet.maximumPrice > 10 ? priceFacet.maximumPrice - 1 : priceFacet.maximumPrice - .01}`;
        }

        clearFilters(): void {
            // clear in place
            this.filterCategory.categoryId = "";
            this.attributeValueIds.length = 0;
            this.priceFilterMinimums.length = 0;
            if(this.showBrands) {
                this.brandIds.length = 0;
                this.filterBrandId = "";
            }

            if(this.showProductLines) {
                this.productLineIds.length = 0;
                this.filterProductLineId = "";
            }

            this.searchWithinTerms.length = 0;
            this.getAllSelectedFilters();
            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "clear");
        }

        // builds attributeValues from the attributeValuesIds collection
        protected getSelectedFilters(): void {
            this.attributeValues = [];
            const attributeValuesIdsCopy = this.attributeValueIds.slice();
            this.attributeValueIds.length = 0;
            if (this.products && this.products.attributeTypeFacets) {
                this.products.attributeTypeFacets.forEach((attribute) => {
                    attribute.attributeValueFacets.forEach((attributeValue) => {
                        attributeValuesIdsCopy.forEach((attributeValueId) => {
                            if (attributeValue.attributeValueId.toString() === attributeValueId &&
                                !this.attributeValues.some((av) => av.attributeValueId === attributeValue.attributeValueId)) {
                                (attributeValue as any).sectionNameDisplay = attribute.nameDisplay;
                                (attribute as any).selectedAttributeValueId = attributeValue.attributeValueId;
                                this.attributeValues.push(attributeValue);
                                this.attributeValueIds.push(attributeValueId); // rebuild this.attributeValueIds in case any were removed
                            }
                        });
                    });
                });
            }
        }

        // builds this.priceFilters and this.priceFilterMinimums collections
        protected getSelectedPriceFilters(): void {
            this.priceFilters = [];
            const priceRange = this.products.priceRange;
            const priceFiltersMinimumsCopy = this.priceFilterMinimums.slice();
            this.priceFilterMinimums.length = 0;
            if (priceRange != null && priceRange.priceFacets != null) {
                priceRange.priceFacets.forEach((priceFacet) => {
                    priceFiltersMinimumsCopy.forEach((priceFilter) => {
                        if (priceFacet.minimumPrice.toString() === priceFilter && !this.priceFilters.some((pf) => pf.minimumPrice === priceFacet.minimumPrice)) {
                            this.priceFilters.push(priceFacet);
                            this.priceFilterMinimums.push(priceFilter); // rebuild this.priceFilterMinimums in case any were removed
                        }
                    });
                });
            }
        }

        protected getSelectedBrandFilters(){
            this.getSelectedGenericFilters(this.products.brandFacets, this.brandFilters, this.brandIds);
        }

        protected getSelectedProductLineFilters(){
            this.getSelectedGenericFilters(this.products.productLineFacets, this.productLineFilters, this.productLineIds);
        }

        protected getSelectedGenericFilters(allFacets: GenericFacetDto[], filters: GenericFacetDto[], selectedIds: string[]): void {
            filters.length = 0;
            const selectedIdsCopy = selectedIds.slice();
            selectedIds.length = 0;

            if (allFacets != null && selectedIdsCopy != null){
                allFacets.forEach((facet:GenericFacetDto) => {
                    selectedIdsCopy.forEach((id:string) => {
                        if (facet.id === id && !filters.some((f) => f.id === facet.id)) {
                            filters.push(facet);
                            selectedIds.push(id); // rebuild in case any were removed
                        }
                    });
                });
            }
        }

        leftNavBreadCrumbs(): BreadCrumbModel[] {
            const list: BreadCrumbModel[] = [];
            for (let i = 1; i < this.breadCrumbs.length - 1; i++) {
                if (this.breadCrumbs[i].url) {
                    list.push(this.breadCrumbs[i]);
                }
            }
            return list;
        }

        searchWithinEntered(): void {
            if (!this.searchWithinInput) {
                return;
            }

            if (this.searchWithinTerms.every(o => o !== this.searchWithinInput)) {
                this.searchWithinTerms.push(this.searchWithinInput);
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated");
            }

            this.searchWithinInput = "";
        }

        clearSearchWithinItem(index: number): void {
            this.searchWithinTerms.splice(index, 1);
            this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated");
        }

        isCategoryFacetSelected(categoryFacet: CategoryFacetDto): boolean {
            return categoryFacet.selected;
        }

        isPriceFacetSelected(priceFacet: PriceFacetDto): boolean {
            return this.priceFilterMinimums.some((pfm) => pfm === priceFacet.minimumPrice.toString());
        }

        isAttributeValueFacetSelected(attributeValueFacet: AttributeValueFacetDto): boolean {
            return this.attributeValueIds.some((avi) => avi === attributeValueFacet.attributeValueId.toString());
        }

        getAttributeTypeAttributeValueLimit(attributeTypeFacet: AttributeTypeFacetDto): number {
            let attributeTypeAttributeValueLimit = this.attributeTypeAttributeValueLimits[`${attributeTypeFacet.attributeTypeId}`];

            if (!attributeTypeAttributeValueLimit) {
                attributeTypeAttributeValueLimit = 5;
            }

            return attributeTypeAttributeValueLimit;
        }

        showMoreAttributeValues(attributeTypeFacet: AttributeTypeFacetDto): void {
            this.attributeTypeAttributeValueLimits[`${attributeTypeFacet.attributeTypeId}`] = 999;
        }

        shouldShowMoreAttributeValues(attributeTypeFacet: AttributeTypeFacetDto): boolean {
            const attributeTypeAttributeValueLimit = this.getAttributeTypeAttributeValueLimit(attributeTypeFacet);

            return attributeTypeFacet.attributeValueFacets.length > attributeTypeAttributeValueLimit;
        }
    }

    angular
        .module("insite")
        .controller("CategoryLeftNavController", CategoryLeftNavController);
}