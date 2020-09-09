module insite.catalog {
    "use strict";

    export class BrasselerProductSearchController extends ProductSearchController {

        static $inject = ["$element",
            "$filter",
            "coreService",
            "searchService",
            "settingsService",
            "$state",
            "queryString",
            "$scope",
            "$window"
        ];

        constructor(
            protected $element: ng.IRootElementService,
            protected $filter: ng.IFilterService,
            protected coreService: core.ICoreService,
            protected searchService: ISearchService,
            protected settingsService: core.ISettingsService,
            protected $state: angular.ui.IStateService,
            protected queryString: common.IQueryStringService,
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService) {
            super($element, $filter, coreService, searchService, settingsService, $state, queryString, $scope, $window);
            // TODO 2.1.1this.brasselerInit();
        }

        $onInit() {
            super.$onInit();
        }

        protected getAutocompleteProductTemplate(suggestion: any, pattern: string): string {
            const shortDescription = suggestion.title.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");

            let additionalInfo = "";

            if (suggestion.title) {
                let partNumberLabel: string;
                let partNumber: string;
                if (suggestion.isNameCustomerOverride) {
                    partNumberLabel = this.getTranslation("customerPartNumber") || "";
                    partNumber = suggestion.name || "";
                } else {
                    partNumberLabel = this.getTranslation("partNumber") || "";
                    partNumber = suggestion.erpNumber || "";
                }

                partNumber = partNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");

                additionalInfo += `<span class='name'><span class='label'>${partNumberLabel}</span><span class='value tst_autocomplete_product_${suggestion.id}_number'>${partNumber}</span></span>`;
            }

            if (suggestion.properties != null && suggestion.properties.unspsc) {
                if (suggestion.properties != null) {
                    var unspsc = suggestion.properties.unspsc.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                    var unspscLabel = this.getTranslation("UNSPSC") || "";
                    additionalInfo += `<span class='name'><span class='label'>${unspscLabel}</span><span class='value'>${unspsc}</span></span>`;
                }
            }
            //if (suggestion.manufacturerItemNumber) {
            //    const manufacturerItemNumber = suggestion.manufacturerItemNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
            //    const manufacturerItemNumberLabel = this.getTranslation("manufacturerItemNumber") || "";
            //    additionalInfo += `<span class='manufacturer-item-number'><span class='label'>${manufacturerItemNumberLabel}</span><span class='value'>${manufacturerItemNumber}</span></span>`;
            //}

            return `<div class="group-${suggestion.type} tst_autocomplete_product_${suggestion.id}"><div class="image"><img src='${suggestion.image}' /></div><div><div class='shortDescription'>${shortDescription}</div>${additionalInfo}</div></div>`;
        }
    }
    angular
        .module("insite")
        .controller("ProductSearchController", BrasselerProductSearchController);
}