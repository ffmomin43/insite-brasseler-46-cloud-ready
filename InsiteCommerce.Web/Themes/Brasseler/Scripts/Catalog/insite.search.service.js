var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var SearchService = /** @class */ (function () {
            function SearchService($localStorage, $http, httpWrapperService) {
                this.$localStorage = $localStorage;
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.autocompleteServiceUri = "/api/v1/autocomplete/";
                this.searchHistoryCacheKey = "searchHistory";
                this.defaultSearchHistoryLimit = 10;
            }
            SearchService.prototype.autocompleteSearch = function (query, parameters) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.autocompleteServiceUri, params: this.autocompleteSearchParams(query, parameters) }), this.autocompleteSearchCompleted, this.autocompleteSearchFailed);
            };
            SearchService.prototype.autocompleteSearchParams = function (query, parameters) {
                if (parameters) {
                    parameters.query = query;
                    return parameters;
                }
                return { query: query };
            };
            SearchService.prototype.autocompleteSearchCompleted = function (response) {
            };
            SearchService.prototype.autocompleteSearchFailed = function (error) {
            };
            SearchService.prototype.addSearchHistory = function (query, limit, includeSuggestions) {
                if (!query || query.trim().length === 0) {
                    return;
                }
                query = query.trim();
                var searchHistory = this.getSearchHistory();
                var queryIndex = searchHistory.map(function (e) { return e.q; }).indexOf(query);
                if (queryIndex > -1) {
                    searchHistory.splice(queryIndex, 1);
                }
                searchHistory.splice(0, 0, { q: query, includeSuggestions: includeSuggestions });
                searchHistory = searchHistory.splice(0, limit || this.defaultSearchHistoryLimit);
                this.$localStorage.setObject(this.searchHistoryCacheKey, searchHistory);
            };
            SearchService.prototype.clearSearchHistory = function () {
                this.$localStorage.setObject(this.searchHistoryCacheKey, new Array());
            };
            SearchService.prototype.getSearchHistory = function () {
                return this.$localStorage.getObject(this.searchHistoryCacheKey, new Array()).filter(function (item) { return typeof item === "object"; });
            };
            SearchService.prototype.getProductAutocompleteTemplate = function (query, id) {
                return function (suggestion) {
                    var pattern = "(" + query().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ")";
                    suggestion.erpNumber = suggestion.erpNumber || "";
                    var erpNumber = suggestion.erpNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                    var shortDescription = suggestion.shortDescription.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                    return "<div class='image'><img src='" + suggestion.image + "' /></div><div><span id=\"" + id + suggestion.id + "\" class='shortDescription'>" + shortDescription + "</span><span class='name'>" + erpNumber + "</span></div>";
                };
            };
            SearchService.prototype.getProductAutocompleteOptions = function (query) {
                var _this = this;
                return {
                    height: 300,
                    filtering: function (event) { _this.onProductAutocompleteFiltering(event); },
                    dataTextField: "value",
                    dataSource: {
                        serverFiltering: true,
                        transport: {
                            read: function (options) {
                                _this.onProductAutocompleteRead(query(), options);
                            }
                        },
                        schema: {
                            data: function (autocompleteModel) {
                                return _this.onProductAutocompleteData(autocompleteModel);
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
            };
            SearchService.prototype.onProductAutocompleteFiltering = function (event) {
                if (!event.filter.value || event.filter.value.length < 3) {
                    event.preventDefault();
                    event.sender.close();
                }
            };
            SearchService.prototype.onProductAutocompleteRead = function (query, options) {
                this.autocompleteSearch(query, { productEnabled: true, categoryEnabled: false, contentEnabled: false }).then(function (autocompleteModel) {
                    if (options) {
                        options.success(autocompleteModel);
                    }
                });
            };
            SearchService.prototype.onProductAutocompleteData = function (autocompleteModel) {
                return autocompleteModel.products.map(function (p) { return ({
                    id: p.id,
                    erpNumber: p.erpNumber,
                    shortDescription: p.title,
                    image: p.image,
                    value: p.title,
                    brandName: p.brandName,
                    brandDetailPagePath: p.brandDetailPagePath
                }); });
            };
            SearchService.$inject = ["$localStorage", "$http", "httpWrapperService"];
            return SearchService;
        }());
        catalog.SearchService = SearchService;
        angular
            .module("insite")
            .service("searchService", SearchService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.search.service.js.map