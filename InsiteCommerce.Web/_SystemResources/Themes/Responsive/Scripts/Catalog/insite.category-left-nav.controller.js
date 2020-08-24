var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var CategoryLeftNavController = /** @class */ (function () {
            function CategoryLeftNavController($timeout, $window, $scope, $rootScope, sessionService) {
                this.$timeout = $timeout;
                this.$window = $window;
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.sessionService = sessionService;
                this.attributeValues = []; // private list of attributes for the ui to display
                this.priceFilters = []; // private list of price ranges for the ui to display
                this.brandFilters = [];
                this.productLineFilters = [];
                this.attributeTypeAttributeValueLimits = {}; // dictionary of attribute types and the number of attribute values to show
            }
            CategoryLeftNavController.prototype.$onInit = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.onGetSessionCompleted(session); }, function (error) { _this.onGetSessionFailed(error); });
                this.getAllSelectedFilters();
                this.$window.addEventListener("popstate", function () { _this.onPopState(); });
                this.$scope.$on("ProductListController-filterLoaded", function () { _this.onFilterLoaded(); });
            };
            CategoryLeftNavController.prototype.onGetSessionCompleted = function (session) {
                this.currencySymbol = session.currency.currencySymbol;
            };
            CategoryLeftNavController.prototype.onGetSessionFailed = function (error) {
            };
            CategoryLeftNavController.prototype.onPopState = function () {
                var _this = this;
                this.$timeout(function () {
                    _this.getAllSelectedFilters();
                }, 0);
            };
            CategoryLeftNavController.prototype.onFilterLoaded = function () {
                var _this = this;
                this.$timeout(function () {
                    _this.getAllSelectedFilters();
                }, 0);
            };
            CategoryLeftNavController.prototype.getAllSelectedFilters = function () {
                this.getSelectedFilters();
                this.getSelectedPriceFilters();
                this.getSelectedBrandFilters();
                this.getSelectedProductLineFilters();
            };
            CategoryLeftNavController.prototype.toggleFilter = function (attributeValueId) {
                this.changeArrayValue(attributeValueId, this.attributeValueIds);
                this.getSelectedFilters();
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "attribute");
            };
            CategoryLeftNavController.prototype.togglePreviouslyPurchasedProducts = function () {
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "previouslyPurchasedProducts");
            };
            CategoryLeftNavController.prototype.toggleStockedItemsOnly = function () {
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "stockedItemsOnly");
            };
            // removes or adds item to array
            CategoryLeftNavController.prototype.changeArrayValue = function (item, array) {
                if (this.products && this.products.attributeTypeFacets && this.products.attributeTypeFacets.some(function (atf) { return atf.attributeTypeId === item; })) {
                    var facet = this.products.attributeTypeFacets.filter(function (atf) { return atf.attributeTypeId === item; })[0];
                    facet.attributeValueFacets.forEach(function (av) {
                        if ($.inArray(av.attributeValueId, array) !== -1) {
                            array.splice(array.indexOf(av.attributeValueId.toString()), 1);
                        }
                    });
                    return;
                }
                if ($.inArray(item, array) !== -1) {
                    var facet = this.products.attributeTypeFacets.filter(function (atf) { return atf.attributeValueId === item; })[0];
                    if (facet) {
                        facet.attributeValueId = "";
                    }
                    array.splice(array.indexOf(item), 1);
                }
                else {
                    array.push(item);
                }
            };
            CategoryLeftNavController.prototype.toggleCategory = function (categoryFacet) {
                if (categoryFacet && !categoryFacet.selected) {
                    this.filterCategory.categoryId = categoryFacet.categoryId;
                    this.filterCategory.shortDescription = categoryFacet.shortDescription;
                }
                else {
                    this.filterCategory.categoryId = "";
                }
                categoryFacet.selected = !categoryFacet.selected;
                this.attributeValueIds.length = 0;
                this.priceFilterMinimums.length = 0;
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "category");
            };
            CategoryLeftNavController.prototype.toggleBrandId = function (brandId) {
                this.changeGenericArrayValue(brandId, this.brandIds);
                this.getSelectedBrandFilters();
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "brand");
            };
            CategoryLeftNavController.prototype.toggleProductLineId = function (productLineId) {
                this.changeGenericArrayValue(productLineId, this.productLineIds);
                this.getSelectedProductLineFilters();
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "product line");
            };
            CategoryLeftNavController.prototype.changeGenericArrayValue = function (id, array) {
                if (!id) {
                    array.length = 0;
                    return;
                }
                var index = array.indexOf(id);
                if (index > -1) {
                    array.splice(index, 1);
                }
                else {
                    array.push(id);
                }
            };
            CategoryLeftNavController.prototype.toggleCategoryId = function (categoryId) {
                var categoryFacet;
                this.products.categoryFacets.forEach(function (c) {
                    if (c.categoryId.toString() === categoryId) {
                        categoryFacet = c;
                    }
                });
                this.toggleCategory(categoryFacet);
            };
            CategoryLeftNavController.prototype.togglePriceFilter = function (minimumPrice) {
                this.changeArrayValue(minimumPrice, this.priceFilterMinimums);
                this.getSelectedPriceFilters();
                this.attributeValueIds.length = 0;
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "price");
            };
            CategoryLeftNavController.prototype.priceRangeDisplay = function (priceFacet) {
                return "" + this.currencySymbol + priceFacet.minimumPrice + " - " + this.currencySymbol + (priceFacet.maximumPrice > 10 ? priceFacet.maximumPrice - 1 : priceFacet.maximumPrice - .01);
            };
            CategoryLeftNavController.prototype.clearFilters = function () {
                // clear in place
                this.filterCategory.categoryId = "";
                this.attributeValueIds.length = 0;
                this.priceFilterMinimums.length = 0;
                if (this.showBrands) {
                    this.brandIds.length = 0;
                    this.filterBrandId = "";
                }
                if (this.showProductLines) {
                    this.productLineIds.length = 0;
                    this.filterProductLineId = "";
                }
                this.searchWithinTerms.length = 0;
                this.getAllSelectedFilters();
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "clear");
            };
            // builds attributeValues from the attributeValuesIds collection
            CategoryLeftNavController.prototype.getSelectedFilters = function () {
                var _this = this;
                this.attributeValues = [];
                var attributeValuesIdsCopy = this.attributeValueIds.slice();
                this.attributeValueIds.length = 0;
                if (this.products && this.products.attributeTypeFacets) {
                    this.products.attributeTypeFacets.forEach(function (attribute) {
                        attribute.attributeValueFacets.forEach(function (attributeValue) {
                            attributeValuesIdsCopy.forEach(function (attributeValueId) {
                                if (attributeValue.attributeValueId.toString() === attributeValueId &&
                                    !_this.attributeValues.some(function (av) { return av.attributeValueId === attributeValue.attributeValueId; })) {
                                    attributeValue.sectionNameDisplay = attribute.nameDisplay;
                                    attribute.selectedAttributeValueId = attributeValue.attributeValueId;
                                    _this.attributeValues.push(attributeValue);
                                    _this.attributeValueIds.push(attributeValueId); // rebuild this.attributeValueIds in case any were removed
                                }
                            });
                        });
                    });
                }
            };
            // builds this.priceFilters and this.priceFilterMinimums collections
            CategoryLeftNavController.prototype.getSelectedPriceFilters = function () {
                var _this = this;
                this.priceFilters = [];
                var priceRange = this.products.priceRange;
                var priceFiltersMinimumsCopy = this.priceFilterMinimums.slice();
                this.priceFilterMinimums.length = 0;
                if (priceRange != null && priceRange.priceFacets != null) {
                    priceRange.priceFacets.forEach(function (priceFacet) {
                        priceFiltersMinimumsCopy.forEach(function (priceFilter) {
                            if (priceFacet.minimumPrice.toString() === priceFilter && !_this.priceFilters.some(function (pf) { return pf.minimumPrice === priceFacet.minimumPrice; })) {
                                _this.priceFilters.push(priceFacet);
                                _this.priceFilterMinimums.push(priceFilter); // rebuild this.priceFilterMinimums in case any were removed
                            }
                        });
                    });
                }
            };
            CategoryLeftNavController.prototype.getSelectedBrandFilters = function () {
                this.getSelectedGenericFilters(this.products.brandFacets, this.brandFilters, this.brandIds);
            };
            CategoryLeftNavController.prototype.getSelectedProductLineFilters = function () {
                this.getSelectedGenericFilters(this.products.productLineFacets, this.productLineFilters, this.productLineIds);
            };
            CategoryLeftNavController.prototype.getSelectedGenericFilters = function (allFacets, filters, selectedIds) {
                filters.length = 0;
                var selectedIdsCopy = selectedIds.slice();
                selectedIds.length = 0;
                if (allFacets != null && selectedIdsCopy != null) {
                    allFacets.forEach(function (facet) {
                        selectedIdsCopy.forEach(function (id) {
                            if (facet.id === id && !filters.some(function (f) { return f.id === facet.id; })) {
                                filters.push(facet);
                                selectedIds.push(id); // rebuild in case any were removed
                            }
                        });
                    });
                }
            };
            CategoryLeftNavController.prototype.leftNavBreadCrumbs = function () {
                var list = [];
                for (var i = 1; i < this.breadCrumbs.length - 1; i++) {
                    if (this.breadCrumbs[i].url) {
                        list.push(this.breadCrumbs[i]);
                    }
                }
                return list;
            };
            CategoryLeftNavController.prototype.searchWithinEntered = function () {
                var _this = this;
                if (!this.searchWithinInput) {
                    return;
                }
                if (this.searchWithinTerms.every(function (o) { return o !== _this.searchWithinInput; })) {
                    this.searchWithinTerms.push(this.searchWithinInput);
                    this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated");
                }
                this.searchWithinInput = "";
            };
            CategoryLeftNavController.prototype.clearSearchWithinItem = function (index) {
                this.searchWithinTerms.splice(index, 1);
                this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated");
            };
            CategoryLeftNavController.prototype.isCategoryFacetSelected = function (categoryFacet) {
                return categoryFacet.selected;
            };
            CategoryLeftNavController.prototype.isPriceFacetSelected = function (priceFacet) {
                return this.priceFilterMinimums.some(function (pfm) { return pfm === priceFacet.minimumPrice.toString(); });
            };
            CategoryLeftNavController.prototype.isAttributeValueFacetSelected = function (attributeValueFacet) {
                return this.attributeValueIds.some(function (avi) { return avi === attributeValueFacet.attributeValueId.toString(); });
            };
            CategoryLeftNavController.prototype.getAttributeTypeAttributeValueLimit = function (attributeTypeFacet) {
                var attributeTypeAttributeValueLimit = this.attributeTypeAttributeValueLimits["" + attributeTypeFacet.attributeTypeId];
                if (!attributeTypeAttributeValueLimit) {
                    attributeTypeAttributeValueLimit = 5;
                }
                return attributeTypeAttributeValueLimit;
            };
            CategoryLeftNavController.prototype.showMoreAttributeValues = function (attributeTypeFacet) {
                this.attributeTypeAttributeValueLimits["" + attributeTypeFacet.attributeTypeId] = 999;
            };
            CategoryLeftNavController.prototype.shouldShowMoreAttributeValues = function (attributeTypeFacet) {
                var attributeTypeAttributeValueLimit = this.getAttributeTypeAttributeValueLimit(attributeTypeFacet);
                return attributeTypeFacet.attributeValueFacets.length > attributeTypeAttributeValueLimit;
            };
            CategoryLeftNavController.$inject = ["$timeout", "$window", "$scope", "$rootScope", "sessionService"];
            return CategoryLeftNavController;
        }());
        catalog.CategoryLeftNavController = CategoryLeftNavController;
        angular
            .module("insite")
            .controller("CategoryLeftNavController", CategoryLeftNavController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.category-left-nav.controller.js.map