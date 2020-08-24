module insite.catalog {
    import CategoryFacetDto = Insite.Core.Plugins.Search.Dtos.CategoryFacetDto;
    import AttributeValueFacetDto = Insite.Core.Plugins.Search.Dtos.AttributeValueFacetDto;
    import PriceFacetDto = Insite.Core.Plugins.Search.Dtos.PriceFacetDto;
    "use strict";

    export class BrasselerCategoryLeftNavController extends CategoryLeftNavController {
        // shared scope
        products: Insite.Catalog.WebApi.V1.ApiModels.ProductCollectionModel; // full product collection model from the last rest api call
        breadCrumbs: Insite.Catalog.WebApi.V1.ApiModels.BreadCrumbModel[];
        attributeValueIds: string[]; // a list of selected atributes, used by productlist to request data
        filterCategory: CategoryFacetDto; // category selected by user, used by productlist to request data
        priceFilterMinimums: string[]; // a list of the prices selected by the user, used by productlist to request data
        searchWithinTerms: any[]; // search within search terms
        updateProductData: () => void;
        category: Insite.Catalog.WebApi.V1.ApiModels.CategoryModel; // category if this is a category page

        originalAttributes: Insite.Core.Plugins.Search.Dtos.AttributeTypeFacetDto[] = [];
        selectedAttributeValueIds: string[] = [];

        // local collections
        attributeValues: AttributeValueFacetDto[] = []; // private list of attributes for the ui to display
        priceFilters: PriceFacetDto[] = []; // private list of price ranges for the ui to display
        searchWithinInput: string;
        session: any;

        static $inject = ["$timeout", "$window", "$scope", "$rootScope", "sessionService"];

        constructor(
            protected $timeout: ng.ITimeoutService,
            protected $window: ng.IWindowService,
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected sessionService: account.ISessionService
            ) {
            super($timeout, $window, $scope, $rootScope, sessionService);
            // Changes For BUSA-335 Starts
            this.clearFilters();
            // Changes For BUSA-335 Ends
            this.brasselerInit();
        }

        brasselerInit() {
            super.$onInit();
            this.originalAttributes = this.products.attributeTypeFacets;
        }

        isAuthenticated(): boolean {
            return this.session && this.session.isAuthenticated;
        }

        toggleFilter(attributeValueId: string): void {
            this.updateOriginalArrayItems(attributeValueId, this.selectedAttributeValueIds);
            this.changeArrayValue(attributeValueId, this.attributeValueIds);
            //this.getSelectedFilters();
            //this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "attribute");
            this.updateProductData();
        }

        updateOriginalArrayItems(attributeValueId: string, array: string[]) {
            // iterate over original array attribute values
            this.originalAttributes.forEach((attrType) => {
                //check whether the values contain the selected id
                if (attrType.attributeValueFacets.some(attrVal => attrVal.attributeValueId === attributeValueId)) {
                    // iterate over the attribute values to add or remove them
                    attrType.attributeValueFacets.forEach((attrVal) => {
                        if (attrVal.attributeValueId.toString() === attributeValueId) {
                            if ($.inArray(attrVal, this.attributeValues) !== -1) {
                                this.attributeValues.splice(this.attributeValues
                                    .indexOf(attrVal),
                                    1);
                            } else {
                                (<any>attrVal).sectionNameDisplay = attrType.nameDisplay;
                                this.attributeValues.push(attrVal);
                            }
                            attrVal.selected = !attrVal.selected;
                        }
                    });
                }
            });
        }

        changeArrayValue(item: string, array: string[]) {
            if (this.products.attributeTypeFacets.some(atf => atf.attributeTypeId === item)) {
                var facet = this.products.attributeTypeFacets.filter(atf => atf.attributeTypeId === item)[0];
                facet.attributeValueFacets.forEach((av) => {
                    if ($.inArray(av.attributeValueId, array) !== -1) {
                        array.splice(array.indexOf(av.attributeValueId.toString()), 1);
                    }
                });
                return;
            }
            if ($.inArray(item, array) === -1) {
                array.push(item);
            } else {
                array.splice(array.indexOf(item), 1);
            }
        }

        getSelectedFilters() {
            this.attributeValues = [];
            var attributeValuesIdsCopy = this.attributeValueIds.slice();
            this.attributeValueIds.length = 0;
            if (!(typeof this.originalAttributes == "undefined")) {
                this.originalAttributes.forEach((attr) => {
                    attr.attributeValueFacets.forEach((attrVal) => {
                        attributeValuesIdsCopy.forEach((attrValId) => {
                            if (attrVal.attributeValueId.toString() === attrValId) {
                                (<any>attrVal).sectionNameDisplay = attr.nameDisplay;
                                (<any>attr).selectedAttributeValueId = attrVal.attributeValueId;
                                this.attributeValues.push(attrVal);
                                this.attributeValueIds.push(attrValId);
                            }
                        });
                    });
                });
            }
        }
    }

    angular
        .module("insite")
        .controller("CategoryLeftNavController", BrasselerCategoryLeftNavController);
}