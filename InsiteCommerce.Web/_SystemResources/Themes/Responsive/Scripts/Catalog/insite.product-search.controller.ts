import ProductAutocompleteItemModel = Insite.Catalog.WebApi.V1.ApiModels.ProductAutocompleteItemModel;

module insite.catalog {
    "use strict";

    export class AutocompleteTypes {
        static searchHistory = "searchhistory";
        static product = "product";
        static category = "category";
        static content = "content";
        static brand = "brand";
    }

    export class ProductSearchController {
        criteria: string;
        products: ProductAutocompleteItemModel[] = [];
        autocomplete: any;
        autocompleteOptions: AutoCompleteOptions;
        autocompleteType: string;
        translations: Array<any>; // translations populated by ng-init in the template
        preventActions: boolean;
        autocompleteEnabled: boolean;
        autocompleteCanceled: boolean;
        searchHistoryEnabled: boolean;
        searchData: Array<any> = [];
        isVisibleSearchInput: boolean;
        isOneColumnSearchResult = true;

        static $inject = ["$element", "$filter", "coreService", "searchService", "settingsService", "$state", "queryString", "$scope", "$window"];

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
        }

        $onInit(): void {
            this.criteria = decodeURIComponent(this.queryString.get("criteria"));

            this.$scope.$on("$locationChangeStart", (event: ng.IAngularEvent, uri: string) => {
                this.onLocationChangeStart(event, uri);
            });

            this.initializeAutocomplete();

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            angular.element(window.document).bind("click", event => {
                if (this.isVisibleSearchInput) {
                    const searchArea = angular.element(".search-area");
                    if (searchArea.length > 0 && searchArea[0] !== event.target && searchArea.find(event.target).length === 0) {
                        this.hideSearchArea();
                        this.$scope.$apply();
                    }
                }
            });

            angular.element(window.document).bind("scroll", () => {
                angular.element("input.isc-searchAutoComplete").blur();
            });

            this.$scope.$watch(() => this.criteria, () => {
                this.products = [];
            });
        }

        protected onLocationChangeStart(event: ng.IAngularEvent, uri: string): void {
            let localCriteria = this.criteria;
            let encodedCriteria = `criteria=${encodeURIComponent(localCriteria)}`; // note: encodeURIComponent does not seem to work an an angular watched var like this.criteria
            if (encodedCriteria !== "" && uri.indexOf(encodedCriteria) === -1) {
                this.clearSearchTerm();
            }
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.autocompleteEnabled = settingsCollection.searchSettings.autocompleteEnabled;
            this.searchHistoryEnabled = settingsCollection.searchSettings.searchHistoryEnabled;
        }

        protected getSettingsFailed(error: any): void {
        }

        initializeAutocomplete(): void {
            let appliedOnce = false;

            this.autocompleteOptions = {
                height: 600,
                filtering: (event: kendo.ui.AutoCompleteFilteringEvent) => {
                    this.onAutocompleteFiltering(event, appliedOnce);
                    appliedOnce = true;
                },
                dataTextField: "title",
                dataSource: {
                    serverFiltering: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => { this.onAutocompleteRead(options); }
                    }
                },
                popup: {
                    position: "top left",
                    origin: "bottom left"
                },
                animation: false as any,
                template: (suggestion: any) => { return this.getAutocompleteTemplate(suggestion); },
                select: (event: kendo.ui.AutoCompleteSelectEvent) => { this.onAutocompleteSelect(event); },
                dataBound: (event: kendo.ui.AutoCompleteDataBoundEvent) => { this.onAutocompleteDataBound(event); },
                open: (event: kendo.ui.AutoCompleteOpenEvent) => { this.refreshAutocompletePopup(); }
            };
        }

        protected onAutocompleteFiltering(event: kendo.ui.AutoCompleteFilteringEvent, appliedOnce: boolean): void {
            if (!appliedOnce) {
                const list = this.getAutocomplete().list;
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
            } else if (event.filter.value.length >= 3) {
                this.autocompleteType = AutocompleteTypes.product;
            } else {
                event.preventDefault();
                this.getAutocomplete().close();
                return;
            }

            this.getAutocomplete().list.toggleClass(`autocomplete-type-${AutocompleteTypes.searchHistory}`, this.autocompleteType === AutocompleteTypes.searchHistory);
            this.getAutocomplete().list.toggleClass(`autocomplete-type-${AutocompleteTypes.product}`, this.autocompleteType === AutocompleteTypes.product);
        }

        protected onAutocompleteRead(options: kendo.data.DataSourceTransportReadOptions): void {
            let data = new Array();
            if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                if (this.searchHistoryEnabled) {
                    data = this.searchService.getSearchHistory();
                    data.forEach((p: any) => p.type = "");
                }
                options.success(data);
            } else {
                if (this.autocompleteEnabled) {
                    this.searchService.autocompleteSearch(this.criteria).then(
                        (autocompleteModel: AutocompleteModel) => { this.autocompleteSearchCompleted(autocompleteModel, options, data); },
                        (error: any) => { this.autocompleteSearchFailed(error, options); });
                } else {
                    options.success(data);
                }
            }
        }

        protected autocompleteSearchCompleted(autocompleteModel: AutocompleteModel, options: kendo.data.DataSourceTransportReadOptions, data: Array<any>): void {
            this.products = autocompleteModel.products;
            this.products.forEach((p: any) => p.type = AutocompleteTypes.product);

            const categories = autocompleteModel.categories;
            categories.forEach((p: any) => p.type = AutocompleteTypes.category);

            const content = autocompleteModel.content;
            content.forEach((p: any) => p.type = AutocompleteTypes.content);

            const brands = autocompleteModel.brands;
            brands.forEach((p: any) => p.type = AutocompleteTypes.brand);

            this.searchData = data.concat(categories, brands, content, this.products);
            options.success(this.searchData);
        }

        protected autocompleteSearchFailed(error: any, options: kendo.data.DataSourceTransportReadOptions): void {
            options.error(error);
        }

        protected onAutocompleteSelect(event: kendo.ui.AutoCompleteSelectEvent): boolean {
            this.disableSearch();

            const dataItem = this.getAutocomplete().dataItem(event.item.index(".k-item"));
            if (!dataItem) {
                this.enableSearch();
                event.preventDefault();
                return false;
            }

            if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                this.search(dataItem.q, dataItem.includeSuggestions);
            } else {
                setTimeout(() => {
                    this.coreService.redirectToPath(dataItem.url);
                    this.$scope.$apply();
                }, 0);
            }
        }

        protected onAutocompleteDataBound(event: kendo.ui.AutoCompleteDataBoundEvent): void {
            if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                return;
            }

            const list = this.getAutocomplete().list;
            let groupKeys = this.searchData.map(item => { return item.type; });

            const leftColumn = $("<li>");
            const leftColumnContainer = $("<ul>");
            leftColumn.append(leftColumnContainer);

            const rightColumn = $("<li class='products'>");
            const rightColumnContainer = $("<ul>");
            rightColumn.append(rightColumnContainer);

            this.getAutocomplete().ul.append(leftColumn);
            this.getAutocomplete().ul.append(rightColumn);

            groupKeys = this.$filter("unique")(groupKeys);
            groupKeys.forEach(groupKey => {
                switch (groupKey) {
                    case AutocompleteTypes.category:
                    case AutocompleteTypes.content:
                    case AutocompleteTypes.brand:
                        list.find(`.group-${groupKey}`).parent().each((index, item) => leftColumnContainer.append(item));
                        break;
                    case AutocompleteTypes.product:
                        list.find(`.group-${groupKey}`).parent().each((index, item) => rightColumnContainer.append(item));
                        break;
                }

                const translation = this.getTranslation(groupKey);
                if (translation) {
                    list.find(`.group-${groupKey}`).eq(0).closest("li").before(`<li class='header ${groupKey}'>${translation}</li>`);
                }
            });

            const leftColumnChildrenCount = leftColumnContainer.find("li").length;
            const rightColumnChildrenCount = rightColumnContainer.find("li").length;

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
            } else {
                this.getAutocomplete().popup.element.removeClass("search-autocomplete-list--large");
            }

            list.find(".header").on("click", () => {
                return false;
            });
        }

        protected refreshAutocompletePopup(): void {
            const isOneColumnCurrentSearchResult = this.searchData.length === this.products.length;
            if (this.isOneColumnSearchResult === isOneColumnCurrentSearchResult) {
                return;
            }

            this.isOneColumnSearchResult = isOneColumnCurrentSearchResult;

            // need to re-open popup at first time for fixing position
            setTimeout(() => {
                this.getAutocomplete().popup.close();
                this.getAutocomplete().popup.open();
            }, 250);
        }

        protected getAutocompleteTemplate(suggestion: any): string {
            if (this.autocompleteType === AutocompleteTypes.searchHistory) {
                return this.getAutocompleteSearchHistoryTemplate(suggestion);
            }
            var template = null;
            const pattern = `(${this.criteria.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")})`;
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
        }

        protected getAutocompleteSearchHistoryTemplate(suggestion: any): string {
            return `<div class="group-${suggestion.type}">${suggestion.q.replace(/</g, "&lt").replace(/>/g, "&gt")}</div>`;
        }

        protected getAutocompleteCategoryTemplate(suggestion: any, pattern: string): string {
            const suggestionParentHTML = this.getSuggestionParentHTML(suggestion.subtitle);
            const highlightedSuggestionHTML = this.getPatternHighlightedInTextHTML(suggestion.title, pattern);
            return `<div class="group group-${suggestion.type}"><span class="group__title">${highlightedSuggestionHTML}</span>${suggestionParentHTML}</div>`;
        }

        protected getAutocompleteContentTemplate(suggestion: any, pattern: string): string {
            return `<div class="group-${suggestion.type} tst_autocomplete_content_${suggestion.url.replace("/", "-")}">${suggestion.title}</div>`;
        }

        protected getAutocompleteBrandTemplate(suggestion: any, pattern: string): string {
            const suggestionParentHTML = this.getSuggestionParentHTML(suggestion.productLineName ? suggestion.title : "");
            const highlightedSuggestionHTML = this.getPatternHighlightedInTextHTML(suggestion.productLineName || suggestion.title, pattern);
            return `<div class="group group-${suggestion.type} tst_autocomplete_brand_${suggestion.id}"><span class="group__title">${highlightedSuggestionHTML}</span>${suggestionParentHTML}</div>`;
        }

        private getSuggestionParentHTML(parentText: string): string {
            return parentText ? `<span class="parent-category">in ${parentText}</span>` : "";
        }

        private getPatternHighlightedInTextHTML(text: string, patternInText: string): string {
            return text.replace(new RegExp(patternInText, "gi"), "<strong>$1<\/strong>");
        }

        protected getAutocompleteProductTemplate(suggestion: any, pattern: string): string {
            const shortDescription = this.getPatternHighlightedInTextHTML(suggestion.title, pattern);

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

                partNumber = this.getPatternHighlightedInTextHTML(partNumber, pattern);

                additionalInfo += `<span class='name'><span class='label'>${partNumberLabel}</span><span class='value tst_autocomplete_product_${suggestion.id}_number'>${partNumber}</span></span>`;
            }

            if (suggestion.manufacturerItemNumber) {
                const manufacturerItemNumber = this.getPatternHighlightedInTextHTML(suggestion.manufacturerItemNumber, pattern);
                const manufacturerItemNumberLabel = this.getTranslation("manufacturerItemNumber") || "";
                additionalInfo += `<span class='manufacturer-item-number'><span class='label'>${manufacturerItemNumberLabel}</span><span class='value'>${manufacturerItemNumber}</span></span>`;
            }

            return `<div class="group-${suggestion.type} tst_autocomplete_product_${suggestion.id}"><div class="image"><img src='${suggestion.image}' /></div><div><div class='shortDescription'>${shortDescription}</div>${additionalInfo}</div></div>`;
        }

        onEnter(): void {
            if (this.getAutocomplete()._last === kendo.keys.ENTER && this.isSearchEnabled()) {
                this.search();
                this.getAutocomplete().element.blur();
            }
        }

        getAutocomplete(): any {
            if (!this.autocomplete) {
                this.autocomplete = this.$element.find("input.isc-searchAutoComplete").data("kendoAutoComplete");
            }

            return this.autocomplete;
        }

        clearSearchHistory(): void {
            this.searchService.clearSearchHistory();
            this.autocomplete.close();
        }

        search(query?: string, includeSuggestions?: boolean): void {
            this.disableSearch();

            const searchTerm = this.getSearchTerm(query);

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
        }

        protected addSearchResultEvent(searchTerm: string): void{
            if (this.$window.dataLayer && searchTerm) {
                this.$window.dataLayer.push({
                    'event': 'searchResults',
                    'searchQuery': searchTerm,
                    'correctedQuery': null,
                    'numSearchResults': 1
                });
            }
        }

        protected disableSearch(): void {
            this.preventActions = true;
        }

        protected enableSearch(): void {
            this.preventActions = false;
        }

        protected isSearchEnabled(): boolean {
            return !this.preventActions;
        }

        private getSearchTerm(query?: string): string {
            return query || this.criteria.trim();
        }

        private clearSearchTerm(): void {
            this.criteria = "";
        }

        private isSearchTermEmpty(searchTerm: string): boolean {
            return !searchTerm;
        }

        private stopAutocomplete(): void {
            this.autocompleteCanceled = true;
        }

        private startAutocomplete(): void {
            this.autocompleteCanceled = false;
        }

        private onlyOneProductInAutocomplete(): boolean {
            return this.products && this.products.length === 1;
        }

        private navigateToFirstProductInAutocomplete(): void {
            this.coreService.redirectToPath(this.products[0].url);
        }

        protected redirectToSearchPage(searchTerm: string, includeSuggestions?: boolean): void {
            let url = `/search?criteria=${encodeURIComponent(searchTerm)}`;

            if (includeSuggestions === false) {
                url = `${url}&includeSuggestions=false`;
            }

            if (insiteMicrositeUriPrefix) {
                url = `${insiteMicrositeUriPrefix}${url}`;
            }

            setTimeout(() => {
                this.coreService.redirectToPath(url);
                this.$scope.$apply();
            }, 0);
        }

        getTranslation(key: string): string {
            const translationMatches = this.translations.filter(item => item.key === key);
            if (translationMatches.length > 0) {
                return translationMatches[0].text;
            }

            return null;
        }

        hideSearchArea() {
            this.isVisibleSearchInput = false;
            this.clearSearchTerm();
        }
    }

    angular
        .module("insite")
        .controller("ProductSearchController", ProductSearchController);
}

// Overriding kendo's autocomplete keydown event to allow support for our two column autocomplete
(kendo.ui.AutoComplete.prototype as any)._keydown = function (e) {
    let that = this;
    let keys = kendo.keys;
    let itemSelector = "li.k-item";
    let ul = $(that.ul[0]);
    let key = e.keyCode;
    let focusClass = "k-state-focused";
    let items = ul.find(itemSelector) as any;

    let currentIndex = -1;
    items.each((idx, i) => {
        if ($(i).hasClass(focusClass)) {
            currentIndex = idx;
        }
    });

    let current = currentIndex >= 0 && currentIndex < items.length ? $(items[currentIndex]) : null;
    let visible = that.popup.visible();

    that._last = key;

    if (key === keys.DOWN) {
        if (visible) {
            if (current) {
                current.removeClass(focusClass);
            }

            if (currentIndex < 0) {
                current = items.first();
                current.addClass(focusClass);
            } else if (currentIndex < (items.length - 1)) {
                current = $(items[currentIndex + 1]);
                current.addClass(focusClass);
            }
        }
        e.preventDefault();
        return false;
    } else if (key === keys.UP) {
        if (visible) {
            if (current) {
                current.removeClass(focusClass);
            }

            if (currentIndex < 0) {
                current = items.last();
                current.addClass(focusClass);
            } else if (currentIndex > 0) {
                current = $(items[currentIndex - 1]);
                current.addClass(focusClass);
            }
        }
        e.preventDefault();
        return false;
    } else if (key === keys.ENTER || key === keys.TAB) {
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
    } else if (key === keys.ESC) {
        if (that.popup.visible()) {
            e.preventDefault();
        }
        that.close();
    } else {
        that._search();
    }
};