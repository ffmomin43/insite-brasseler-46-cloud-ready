import AutocompleteModel = Insite.Catalog.WebApi.V1.ApiModels.AutocompleteModel;
import AutoCompleteOptions = kendo.ui.AutoCompleteOptions;

module insite.catalog {
    "use strict";

    export interface ISearchService {
        autocompleteSearch(query: string, parameters?: any): ng.IPromise<AutocompleteModel>;
        addSearchHistory(query: string, limit?: number, includeSuggestions?: boolean): void;
        clearSearchHistory(): void;
        getSearchHistory(): Array<Object>;
        getProductAutocompleteTemplate(query: Function, id: string): Function;
        getProductAutocompleteOptions(query: Function): AutoCompleteOptions;
    }

    export class SearchService implements ISearchService {
        autocompleteServiceUri = "/api/v1/autocomplete/";
        searchHistoryCacheKey = "searchHistory";
        defaultSearchHistoryLimit = 10;

        static $inject = ["$localStorage", "$http", "httpWrapperService"];

        constructor(
            protected $localStorage: common.IWindowStorage,
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        autocompleteSearch(query: string, parameters?: any): ng.IPromise<AutocompleteModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.autocompleteServiceUri, params: this.autocompleteSearchParams(query, parameters) }),
                this.autocompleteSearchCompleted,
                this.autocompleteSearchFailed
            );
        }

        protected autocompleteSearchParams(query: string, parameters?: any): any {
            if (parameters) {
                parameters.query = query;
                return parameters;
            }

            return { query: query };
        }

        protected autocompleteSearchCompleted(response: ng.IHttpPromiseCallbackArg<AutocompleteModel>): void {
        }

        protected autocompleteSearchFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        addSearchHistory(query: string, limit?: number, includeSuggestions?: boolean): void {
            if (!query || query.trim().length === 0) {
                return;
            }

            query = query.trim();

            let searchHistory = this.getSearchHistory();
            const queryIndex = searchHistory.map((e: any) => { return e.q; }).indexOf(query);
            if (queryIndex > -1) {
                searchHistory.splice(queryIndex, 1);
            }

            searchHistory.splice(0, 0, { q: query, includeSuggestions: includeSuggestions });
            searchHistory = searchHistory.splice(0, limit || this.defaultSearchHistoryLimit);

            this.$localStorage.setObject(this.searchHistoryCacheKey, searchHistory);
        }

        clearSearchHistory(): void {
            this.$localStorage.setObject(this.searchHistoryCacheKey, new Array());
        }

        getSearchHistory(): Array<Object> {
            return this.$localStorage.getObject(this.searchHistoryCacheKey, new Array()).filter(item => typeof item === "object");
        }

        getProductAutocompleteTemplate(query: Function, id: string): Function {
            return (suggestion: any) => {
                const pattern = `(${query().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")})`;

                suggestion.erpNumber = suggestion.erpNumber || "";

                const erpNumber = suggestion.erpNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                const shortDescription = suggestion.shortDescription.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                return `<div class='image'><img src='${suggestion.image}' /></div><div><span id="${id}${suggestion.id}" class='shortDescription'>${shortDescription}</span><span class='name'>${erpNumber}</span></div>`;
            };
        }

        getProductAutocompleteOptions(query: Function): AutoCompleteOptions {
            return {
                height: 300,
                filtering: (event: kendo.ui.AutoCompleteFilteringEvent) => { this.onProductAutocompleteFiltering(event); },
                dataTextField: "value",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => {
                            this.onProductAutocompleteRead(query(), options);
                        }
                    },
                    schema: {
                        data: (autocompleteModel: AutocompleteModel) => {
                            return this.onProductAutocompleteData(autocompleteModel);
                        }
                    }
                },
                popup: {
                    position: "top left",
                    origin: "bottom left"
                },
                animation: {
                    open: {
                        effects: "slideIn:down"
                    }
                }
            };
        }

        protected onProductAutocompleteFiltering(event: kendo.ui.AutoCompleteFilteringEvent): void {
            if (!event.filter.value || event.filter.value.length < 3) {
                event.preventDefault();
                event.sender.close();
            }
        }

        protected onProductAutocompleteRead(query: string, options: kendo.data.DataSourceTransportReadOptions): void {
            this.autocompleteSearch(query, { productEnabled: true, categoryEnabled: false, contentEnabled: false }).then(
                (autocompleteModel: AutocompleteModel) => {
                    if (options) {
                        options.success(autocompleteModel);
                    }
                });
        }

        protected onProductAutocompleteData(autocompleteModel: AutocompleteModel): any[] {
            return autocompleteModel.products.map(p => ({
                id: p.id,
                erpNumber: p.erpNumber,
                shortDescription: p.title,
                image: p.image,
                value: p.title,
                brandName: p.brandName,
                brandDetailPagePath: p.brandDetailPagePath
            } as any));
        }
    }

    angular
        .module("insite")
        .service("searchService", SearchService);
}