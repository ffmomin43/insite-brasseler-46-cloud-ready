var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var AutocompleteTypes = /** @class */ (function () {
            function AutocompleteTypes() {
            }
            AutocompleteTypes.searchHistory = "searchhistory";
            AutocompleteTypes.product = "product";
            AutocompleteTypes.category = "category";
            AutocompleteTypes.content = "content";
            AutocompleteTypes.brand = "brand";
            return AutocompleteTypes;
        }());
        catalog.AutocompleteTypes = AutocompleteTypes;
        var ProductSearchController = /** @class */ (function () {
            function ProductSearchController($element, $filter, coreService, searchService, settingsService, $state, queryString, $scope, $window) {
                this.$element = $element;
                this.$filter = $filter;
                this.coreService = coreService;
                this.searchService = searchService;
                this.settingsService = settingsService;
                this.$state = $state;
                this.queryString = queryString;
                this.$scope = $scope;
                this.$window = $window;
                this.products = [];
                this.searchData = [];
                this.isOneColumnSearchResult = true;
            }
            ProductSearchController.prototype.$onInit = function () {
                var _this = this;
                this.criteria = decodeURIComponent(this.queryString.get("criteria"));
                this.$scope.$on("$locationChangeStart", function (event, uri) {
                    _this.onLocationChangeStart(event, uri);
                });
                this.initializeAutocomplete();
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                angular.element(window.document).bind("click", function (event) {
                    if (_this.isVisibleSearchInput) {
                        var searchArea = angular.element(".search-area");
                        if (searchArea.length > 0 && searchArea[0] !== event.target && searchArea.find(event.target).length === 0) {
                            _this.hideSearchArea();
                            _this.$scope.$apply();
                        }
                    }
                });
                angular.element(window.document).bind("scroll", function () {
                    angular.element("input.isc-searchAutoComplete").blur();
                });
                this.$scope.$watch(function () { return _this.criteria; }, function () {
                    _this.products = [];
                });
            };
            ProductSearchController.prototype.onLocationChangeStart = function (event, uri) {
                var localCriteria = this.criteria;
                var encodedCriteria = "criteria=" + encodeURIComponent(localCriteria); // note: encodeURIComponent does not seem to work an an angular watched var like this.criteria
                if (encodedCriteria !== "" && uri.indexOf(encodedCriteria) === -1) {
                    this.clearSearchTerm();
                }
            };
            ProductSearchController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.autocompleteEnabled = settingsCollection.searchSettings.autocompleteEnabled;
                this.searchHistoryEnabled = settingsCollection.searchSettings.searchHistoryEnabled;
            };
            ProductSearchController.prototype.getSettingsFailed = function (error) {
            };
            ProductSearchController.prototype.initializeAutocomplete = function () {
                var _this = this;
                var appliedOnce = false;
                this.autocompleteOptions = {
                    height: 600,
                    filtering: function (event) {
                        _this.onAutocompleteFiltering(event, appliedOnce);
                        appliedOnce = true;
                    },
                    dataTextField: "title",
                    dataSource: {
                        serverFiltering: true,
                        transport: {
                            read: function (options) { _this.onAutocompleteRead(options); }
                        }
                    },
                    popup: {
                        position: "top left",
                        origin: "bottom left"
                    },
                    animation: false,
                    template: function (suggestion) { return _this.getAutocompleteTemplate(suggestion); },
                    select: function (event) { _this.onAutocompleteSelect(event); },
                    dataBound: function (event) { _this.onAutocompleteDataBound(event); },
                    open: function (event) { _this.refreshAutocompletePopup(); }
                };
            };
            ProductSearchController.prototype.onAutocompleteFiltering = function (event, appliedOnce) {
                if (!appliedOnce) {
                    var list = this.getAutocomplete().list;
                    list.addClass("search-autocomplete-list");
                    list.prepend(this.$element.find(".search-history-label"));
                    list.append(this.$element.find(".clear-search-history"));
                }
                this.enableSearch();
                if (this.autocompleteCanceled) {
                    this.autocompleteCanceled = false;
                    event.preventDefault();
                    this.getAutocomplete().close();
                    return;
                }
                if (!event.filter.value) {
                    this.autocompleteType = AutocompleteTypes.searchHistory;
                }
                else if (event.filter.value.length >= 3) {
                    this.autocompleteType = AutocompleteTypes.product;
                }
                else {
                    event.preventDefault();
                    this.getAutocomplete().close();
                    return;
                }
                this.getAutocomplete().list.toggleClass("autocomplete-type-" + AutocompleteTypes.searchHistory, this.autocompleteType === AutocompleteTypes.searchHistory);
                this.getAutocomplete().list.toggleClass("autocomplete-type-" + AutocompleteTypes.product, this.autocompleteType === AutocompleteTypes.product);
            };
            ProductSearchController.prototype.onAutocompleteRead = function (options) {
                var _this = this;
                var data = new Array();
                if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                    if (this.searchHistoryEnabled) {
                        data = this.searchService.getSearchHistory();
                        data.forEach(function (p) { return p.type = ""; });
                    }
                    options.success(data);
                }
                else {
                    if (this.autocompleteEnabled) {
                        this.searchService.autocompleteSearch(this.criteria).then(function (autocompleteModel) { _this.autocompleteSearchCompleted(autocompleteModel, options, data); }, function (error) { _this.autocompleteSearchFailed(error, options); });
                    }
                    else {
                        options.success(data);
                    }
                }
            };
            ProductSearchController.prototype.autocompleteSearchCompleted = function (autocompleteModel, options, data) {
                this.products = autocompleteModel.products;
                this.products.forEach(function (p) { return p.type = AutocompleteTypes.product; });
                var categories = autocompleteModel.categories;
                categories.forEach(function (p) { return p.type = AutocompleteTypes.category; });
                var content = autocompleteModel.content;
                content.forEach(function (p) { return p.type = AutocompleteTypes.content; });
                var brands = autocompleteModel.brands;
                brands.forEach(function (p) { return p.type = AutocompleteTypes.brand; });
                this.searchData = data.concat(categories, brands, content, this.products);
                options.success(this.searchData);
            };
            ProductSearchController.prototype.autocompleteSearchFailed = function (error, options) {
                options.error(error);
            };
            ProductSearchController.prototype.onAutocompleteSelect = function (event) {
                var _this = this;
                this.disableSearch();
                var dataItem = this.getAutocomplete().dataItem(event.item.index(".k-item"));
                if (!dataItem) {
                    this.enableSearch();
                    event.preventDefault();
                    return false;
                }
                if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                    this.search(dataItem.q, dataItem.includeSuggestions);
                }
                else {
                    setTimeout(function () {
                        _this.coreService.redirectToPath(dataItem.url);
                        _this.$scope.$apply();
                    }, 0);
                }
            };
            ProductSearchController.prototype.onAutocompleteDataBound = function (event) {
                var _this = this;
                if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                    return;
                }
                var list = this.getAutocomplete().list;
                var groupKeys = this.searchData.map(function (item) { return item.type; });
                var leftColumn = $("<li>");
                var leftColumnContainer = $("<ul>");
                leftColumn.append(leftColumnContainer);
                var rightColumn = $("<li class='products'>");
                var rightColumnContainer = $("<ul>");
                rightColumn.append(rightColumnContainer);
                this.getAutocomplete().ul.append(leftColumn);
                this.getAutocomplete().ul.append(rightColumn);
                groupKeys = this.$filter("unique")(groupKeys);
                groupKeys.forEach(function (groupKey) {
                    switch (groupKey) {
                        case AutocompleteTypes.category:
                        case AutocompleteTypes.content:
                        case AutocompleteTypes.brand:
                            list.find(".group-" + groupKey).parent().each(function (index, item) { return leftColumnContainer.append(item); });
                            break;
                        case AutocompleteTypes.product:
                            list.find(".group-" + groupKey).parent().each(function (index, item) { return rightColumnContainer.append(item); });
                            break;
                    }
                    var translation = _this.getTranslation(groupKey);
                    if (translation) {
                        list.find(".group-" + groupKey).eq(0).closest("li").before("<li class='header " + groupKey + "'>" + translation + "</li>");
                    }
                });
                var leftColumnChildrenCount = leftColumnContainer.find("li").length;
                var rightColumnChildrenCount = rightColumnContainer.find("li").length;
                if (leftColumnChildrenCount === 0) {
                    leftColumn.remove();
                    rightColumn.addClass("products--full-width");
                }
                if (rightColumnChildrenCount === 0) {
                    rightColumn.remove();
                    leftColumn.addClass("products--full-width");
                }
                if (leftColumnChildrenCount > 0
                    && rightColumnChildrenCount > 0) {
                    this.getAutocomplete().popup.element.addClass("search-autocomplete-list--large");
                }
                else {
                    this.getAutocomplete().popup.element.removeClass("search-autocomplete-list--large");
                }
                list.find(".header").on("click", function () {
                    return false;
                });
            };
            ProductSearchController.prototype.refreshAutocompletePopup = function () {
                var _this = this;
                var isOneColumnCurrentSearchResult = this.searchData.length === this.products.length;
                if (this.isOneColumnSearchResult === isOneColumnCurrentSearchResult) {
                    return;
                }
                this.isOneColumnSearchResult = isOneColumnCurrentSearchResult;
                // need to re-open popup at first time for fixing position
                setTimeout(function () {
                    _this.getAutocomplete().popup.close();
                    _this.getAutocomplete().popup.open();
                }, 250);
            };
            ProductSearchController.prototype.getAutocompleteTemplate = function (suggestion) {
                if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                    return this.getAutocompleteSearchHistoryTemplate(suggestion);
                }
                var template = null;
                var pattern = "(" + this.criteria.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ")";
                this.refreshAutocompletePopup();
                switch (suggestion.type) {
                    case AutocompleteTypes.category:
                        template = this.getAutocompleteCategoryTemplate(suggestion, pattern);
                        break;
                    case AutocompleteTypes.content:
                        template = this.getAutocompleteContentTemplate(suggestion, pattern);
                        break;
                    case AutocompleteTypes.brand:
                        template = this.getAutocompleteBrandTemplate(suggestion, pattern);
                        break;
                    default:
                        template = this.getAutocompleteProductTemplate(suggestion, pattern);
                }
                this.refreshAutocompletePopup();
                return template;
            };
            ProductSearchController.prototype.getAutocompleteSearchHistoryTemplate = function (suggestion) {
                return "<div class=\"group-" + suggestion.type + "\">" + suggestion.q.replace(/</g, "&lt").replace(/>/g, "&gt") + "</div>";
            };
            ProductSearchController.prototype.getAutocompleteCategoryTemplate = function (suggestion, pattern) {
                var suggestionParentHTML = this.getSuggestionParentHTML(suggestion.subtitle);
                var highlightedSuggestionHTML = this.getPatternHighlightedInTextHTML(suggestion.title, pattern);
                return "<div class=\"group group-" + suggestion.type + "\"><span class=\"group__title\">" + highlightedSuggestionHTML + "</span>" + suggestionParentHTML + "</div>";
            };
            ProductSearchController.prototype.getAutocompleteContentTemplate = function (suggestion, pattern) {
                return "<div class=\"group-" + suggestion.type + " tst_autocomplete_content_" + suggestion.url.replace("/", "-") + "\">" + suggestion.title + "</div>";
            };
            ProductSearchController.prototype.getAutocompleteBrandTemplate = function (suggestion, pattern) {
                var suggestionParentHTML = this.getSuggestionParentHTML(suggestion.productLineName ? suggestion.title : "");
                var highlightedSuggestionHTML = this.getPatternHighlightedInTextHTML(suggestion.productLineName || suggestion.title, pattern);
                return "<div class=\"group group-" + suggestion.type + " tst_autocomplete_brand_" + suggestion.id + "\"><span class=\"group__title\">" + highlightedSuggestionHTML + "</span>" + suggestionParentHTML + "</div>";
            };
            ProductSearchController.prototype.getSuggestionParentHTML = function (parentText) {
                return parentText ? "<span class=\"parent-category\">in " + parentText + "</span>" : "";
            };
            ProductSearchController.prototype.getPatternHighlightedInTextHTML = function (text, patternInText) {
                return text.replace(new RegExp(patternInText, "gi"), "<strong>$1<\/strong>");
            };
            ProductSearchController.prototype.getAutocompleteProductTemplate = function (suggestion, pattern) {
                var shortDescription = this.getPatternHighlightedInTextHTML(suggestion.title, pattern);
                var additionalInfo = "";
                if (suggestion.title) {
                    var partNumberLabel = void 0;
                    var partNumber = void 0;
                    if (suggestion.isNameCustomerOverride) {
                        partNumberLabel = this.getTranslation("customerPartNumber") || "";
                        partNumber = suggestion.name || "";
                    }
                    else {
                        partNumberLabel = this.getTranslation("partNumber") || "";
                        partNumber = suggestion.erpNumber || "";
                    }
                    partNumber = this.getPatternHighlightedInTextHTML(partNumber, pattern);
                    additionalInfo += "<span class='name'><span class='label'>" + partNumberLabel + "</span><span class='value tst_autocomplete_product_" + suggestion.id + "_number'>" + partNumber + "</span></span>";
                }
                if (suggestion.manufacturerItemNumber) {
                    var manufacturerItemNumber = this.getPatternHighlightedInTextHTML(suggestion.manufacturerItemNumber, pattern);
                    var manufacturerItemNumberLabel = this.getTranslation("manufacturerItemNumber") || "";
                    additionalInfo += "<span class='manufacturer-item-number'><span class='label'>" + manufacturerItemNumberLabel + "</span><span class='value'>" + manufacturerItemNumber + "</span></span>";
                }
                return "<div class=\"group-" + suggestion.type + " tst_autocomplete_product_" + suggestion.id + "\"><div class=\"image\"><img src='" + suggestion.image + "' /></div><div><div class='shortDescription'>" + shortDescription + "</div>" + additionalInfo + "</div></div>";
            };
            ProductSearchController.prototype.onEnter = function () {
                if (this.getAutocomplete()._last === kendo.keys.ENTER && this.isSearchEnabled()) {
                    this.search();
                    this.getAutocomplete().element.blur();
                }
            };
            ProductSearchController.prototype.getAutocomplete = function () {
                if (!this.autocomplete) {
                    this.autocomplete = this.$element.find("input.isc-searchAutoComplete").data("kendoAutoComplete");
                }
                return this.autocomplete;
            };
            ProductSearchController.prototype.clearSearchHistory = function () {
                this.searchService.clearSearchHistory();
                this.autocomplete.close();
            };
            ProductSearchController.prototype.search = function (query, includeSuggestions) {
                this.disableSearch();
                var searchTerm = this.getSearchTerm(query);
                if (this.isSearchTermEmpty(searchTerm)) {
                    this.enableSearch();
                    return;
                }
                // prevent filtering results so popup isnt visible when next page loads
                this.stopAutocomplete();
                if (this.onlyOneProductInAutocomplete()) {
                    this.startAutocomplete();
                    this.enableSearch();
                    this.addSearchResultEvent(searchTerm);
                    this.navigateToFirstProductInAutocomplete();
                    return;
                }
                this.criteria = searchTerm;
                this.redirectToSearchPage(searchTerm, includeSuggestions);
            };
            ProductSearchController.prototype.addSearchResultEvent = function (searchTerm) {
                if (this.$window.dataLayer && searchTerm) {
                    this.$window.dataLayer.push({
                        'event': 'searchResults',
                        'searchQuery': searchTerm,
                        'correctedQuery': null,
                        'numSearchResults': 1
                    });
                }
            };
            ProductSearchController.prototype.disableSearch = function () {
                this.preventActions = true;
            };
            ProductSearchController.prototype.enableSearch = function () {
                this.preventActions = false;
            };
            ProductSearchController.prototype.isSearchEnabled = function () {
                return !this.preventActions;
            };
            ProductSearchController.prototype.getSearchTerm = function (query) {
                return query || this.criteria.trim();
            };
            ProductSearchController.prototype.clearSearchTerm = function () {
                this.criteria = "";
            };
            ProductSearchController.prototype.isSearchTermEmpty = function (searchTerm) {
                return !searchTerm;
            };
            ProductSearchController.prototype.stopAutocomplete = function () {
                this.autocompleteCanceled = true;
            };
            ProductSearchController.prototype.startAutocomplete = function () {
                this.autocompleteCanceled = false;
            };
            ProductSearchController.prototype.onlyOneProductInAutocomplete = function () {
                return this.products && this.products.length === 1;
            };
            ProductSearchController.prototype.navigateToFirstProductInAutocomplete = function () {
                this.coreService.redirectToPath(this.products[0].url);
            };
            ProductSearchController.prototype.redirectToSearchPage = function (searchTerm, includeSuggestions) {
                var _this = this;
                var url = "/search?criteria=" + encodeURIComponent(searchTerm);
                if (includeSuggestions === false) {
                    url = url + "&includeSuggestions=false";
                }
                if (insiteMicrositeUriPrefix) {
                    url = "" + insiteMicrositeUriPrefix + url;
                }
                setTimeout(function () {
                    _this.coreService.redirectToPath(url);
                    _this.$scope.$apply();
                }, 0);
            };
            ProductSearchController.prototype.getTranslation = function (key) {
                var translationMatches = this.translations.filter(function (item) { return item.key === key; });
                if (translationMatches.length > 0) {
                    return translationMatches[0].text;
                }
                return null;
            };
            ProductSearchController.prototype.hideSearchArea = function () {
                this.isVisibleSearchInput = false;
                this.clearSearchTerm();
            };
            ProductSearchController.$inject = ["$element", "$filter", "coreService", "searchService", "settingsService", "$state", "queryString", "$scope", "$window"];
            return ProductSearchController;
        }());
        catalog.ProductSearchController = ProductSearchController;
        angular
            .module("insite")
            .controller("ProductSearchController", ProductSearchController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
// Overriding kendo's autocomplete keydown event to allow support for our two column autocomplete
kendo.ui.AutoComplete.prototype._keydown = function (e) {
    var that = this;
    var keys = kendo.keys;
    var itemSelector = "li.k-item";
    var ul = $(that.ul[0]);
    var key = e.keyCode;
    var focusClass = "k-state-focused";
    var items = ul.find(itemSelector);
    var currentIndex = -1;
    items.each(function (idx, i) {
        if ($(i).hasClass(focusClass)) {
            currentIndex = idx;
        }
    });
    var current = currentIndex >= 0 && currentIndex < items.length ? $(items[currentIndex]) : null;
    var visible = that.popup.visible();
    that._last = key;
    if (key === keys.DOWN) {
        if (visible) {
            if (current) {
                current.removeClass(focusClass);
            }
            if (currentIndex < 0) {
                current = items.first();
                current.addClass(focusClass);
            }
            else if (currentIndex < (items.length - 1)) {
                current = $(items[currentIndex + 1]);
                current.addClass(focusClass);
            }
        }
        e.preventDefault();
        return false;
    }
    else if (key === keys.UP) {
        if (visible) {
            if (current) {
                current.removeClass(focusClass);
            }
            if (currentIndex < 0) {
                current = items.last();
                current.addClass(focusClass);
            }
            else if (currentIndex > 0) {
                current = $(items[currentIndex - 1]);
                current.addClass(focusClass);
            }
        }
        e.preventDefault();
        return false;
    }
    else if (key === keys.ENTER || key === keys.TAB) {
        if (key === keys.ENTER && visible) {
            e.preventDefault();
        }
        if (visible && current) {
            if (that.trigger("select", { item: current })) {
                return;
            }
            this._select(current);
        }
        this._blur();
    }
    else if (key === keys.ESC) {
        if (that.popup.visible()) {
            e.preventDefault();
        }
        that.close();
    }
    else {
        that._search();
    }
};
//# sourceMappingURL=insite.product-search.controller.js.map