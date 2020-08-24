var insite;
(function (insite) {
    var quickorder;
    (function (quickorder) {
        "use strict";
        var QuickOrderPageController = /** @class */ (function () {
            function QuickOrderPageController($scope, $filter, coreService, cartService, productService, searchService, settingsService, addToWishlistPopupService, selectVariantProductPopupService, $q) {
                this.$scope = $scope;
                this.$filter = $filter;
                this.coreService = coreService;
                this.cartService = cartService;
                this.productService = productService;
                this.searchService = searchService;
                this.settingsService = settingsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.selectVariantProductPopupService = selectVariantProductPopupService;
                this.$q = $q;
                this.canAddAllToList = false;
                this.product = { qtyOrdered: 1 };
            }
            QuickOrderPageController.prototype.$onInit = function () {
                var _this = this;
                this.products = [];
                this.getSettings();
                this.selectedUnitOfMeasure = "EA";
                this.initializeAutocomplete();
                this.initCanAddAllToList();
                this.$scope.$on("addProductToQuickOrderForm", function (event, product) {
                    _this.searchTerm = product.shortDescription;
                    _this.lookupAndAddProductById(product.id);
                });
            };
            QuickOrderPageController.prototype.initCanAddAllToList = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.products; }, function (newValue) {
                    _this.canAddAllToList = _this.products.every(function (l) { return l.canAddToWishlist; });
                }, true);
            };
            QuickOrderPageController.prototype.addAllToList = function () {
                var products = [];
                for (var i = this.products.length - 1; i >= 0; i--) {
                    if (!this.products[i].canAddToWishlist) {
                        continue;
                    }
                    products.push(this.products[i]);
                }
                this.addToWishlistPopupService.display(products);
            };
            QuickOrderPageController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.searchTerm; });
                this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(function () { return _this.searchTerm; }, "tst_quickOrder_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
                this.autocompleteOptions.open = this.onAutocompleteOptionsOpen();
            };
            QuickOrderPageController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (evt) {
                    var dataItem = evt.sender.dataItem(evt.item.index());
                    _this.lookupAndAddProductById(dataItem.id);
                };
            };
            QuickOrderPageController.prototype.onAutocompleteOptionsOpen = function () {
                var _this = this;
                return function (evt) {
                    if (!_this.searchTerm) {
                        evt.preventDefault();
                    }
                };
            };
            QuickOrderPageController.prototype.getSettings = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            QuickOrderPageController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
                this.orderSettings = settingsCollection.orderSettings;
                this.alternateUnitsOfMeasureFromSettings = settingsCollection.productSettings.alternateUnitsOfMeasure;
            };
            QuickOrderPageController.prototype.getSettingsFailed = function (error) {
            };
            QuickOrderPageController.prototype.onEnterKeyPressedInAutocomplete = function () {
                var autocomplete = $("#qo-search-view").data("kendoAutoComplete");
                if (autocomplete._last === kendo.keys.ENTER) {
                    if (!autocomplete.list.is(":visible") && this.product.id && this.product.qtyOrdered) {
                        this.addProduct(this.product);
                    }
                    else if (autocomplete.listView.selectedDataItems().length === 0) {
                        this.lookupAndAddProductBySearchTerm(this.searchTerm);
                    }
                }
            };
            QuickOrderPageController.prototype.lookupAndAddProductById = function (id) {
                var _this = this;
                var expandParameter = ["pricing", "brand", "styledproducts"];
                this.productService.getProduct(null, id, expandParameter).then(function (product) { _this.getProductCompleted(product); }, function (error) { _this.getProductFailed(error); });
            };
            QuickOrderPageController.prototype.getProductCompleted = function (product) {
                var _this = this;
                // TODO ISC-4519
                // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
                this.getRealTimeInventory(product.product).then(function () {
                    _this.validateAndSetProduct(product.product);
                });
            };
            QuickOrderPageController.prototype.getProductFailed = function (error) {
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderPageController.prototype.lookupAndAddProductBySearchTerm = function (searchTerm) {
                var _this = this;
                var parameter = { extendedNames: [searchTerm] };
                var expandParameter = ["pricing", "brand", "styledproducts"];
                this.productService.getProducts(parameter, expandParameter).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
            };
            QuickOrderPageController.prototype.getProductsCompleted = function (productCollection) {
                var _this = this;
                // TODO ISC-4519
                // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
                this.getRealTimeInventory(productCollection.products[0]).then(function () {
                    _this.validateAndSetProduct(productCollection.products[0]);
                });
            };
            QuickOrderPageController.prototype.getProductsFailed = function (error) {
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderPageController.prototype.validateAndSetProduct = function (product) {
                if (!this.canProductBeQuickOrdered(product)) {
                    return false;
                }
                product.qtyOrdered = Math.max(this.product.qtyOrdered || 1, product.minimumOrderQty || 1);
                this.product = product;
                this.errorMessage = "";
                return true;
            };
            QuickOrderPageController.prototype.addProduct = function (product) {
                var _this = this;
                if (!this.canProductBeQuickOrdered(product)) {
                    return;
                }
                this.product.qtyOrdered = parseFloat(this.product.qtyOrdered.toString());
                var productExists = false;
                for (var i = 0; i < this.products.length; i++) {
                    if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.unitOfMeasure) {
                        this.products[i].qtyOrdered = parseFloat(this.products[i].qtyOrdered.toString()) + this.product.qtyOrdered;
                        productExists = true;
                        if (this.settings.realTimePricing) {
                            this.showPriceSpinner(this.products[i]);
                            this.getRealtimePrices(this.products[i]);
                        }
                        else {
                            this.productService.getProductPrice(this.products[i]).then(function (productPrice) { _this.getProductPriceCompleted(productPrice); }, function (error) { _this.getProductPriceFailed(error); });
                        }
                        break;
                    }
                }
                this.searchTerm = "";
                this.errorMessage = "";
                angular.element("#qo-search-view").data("kendoAutoComplete").close(); // close autocomplete
                if (productExists) {
                    this.product = { qtyOrdered: 1 };
                    return;
                }
                product.uuid = guidHelper.generateGuid(); // tack on a guid to use as an id for the quantity break pricing tooltip
                if (!this.settings.realTimeInventory && !this.settings.realTimePricing) {
                    if (this.canProductBeQuickOrdered(product)) {
                        this.productService.getProductPrice(product);
                        this.products.unshift(product);
                        this.product = { qtyOrdered: 1 };
                    }
                    return;
                }
                if (this.settings.realTimePricing) {
                    this.getRealtimePrices(product);
                }
                if (this.canProductBeQuickOrdered(product)) {
                    this.products.unshift(product);
                    this.product = { qtyOrdered: 1 };
                }
            };
            QuickOrderPageController.prototype.getRealtimePrices = function (product) {
                var _this = this;
                if (product.quoteRequired) {
                    return;
                }
                if (!this.settings.realTimePricing) {
                    return;
                }
                this.productService.getProductRealTimePrices([product]).then(function (realTimePricing) { _this.getProductRealTimePricesCompleted(realTimePricing, product); }, function (error) { _this.getProductRealTimePricesFailed(error, product); });
            };
            QuickOrderPageController.prototype.canProductBeQuickOrdered = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    this.errorMessage = angular.element("#messageConfigurableProduct").val();
                    return false;
                }
                if (product.isStyleProductParent) {
                    this.selectVariantProductPopupService.display(product);
                    return false;
                }
                if (!product.canAddToCart) {
                    if (product.isDiscontinued && product.replacementProductId) {
                        this.lookupAndAddProductById(product.replacementProductId.toString());
                    }
                    else {
                        this.errorMessage = angular.element("#messageUnavailable").val();
                    }
                    return false;
                }
                return true;
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureInList = function (product) {
                var _this = this;
                if (!product.productUnitOfMeasures) {
                    return;
                }
                for (var i = 0; i < this.products.length; i++) {
                    if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.selectedUnitOfMeasure) {
                        product.qtyOrdered = parseFloat(product.qtyOrdered.toString()) + parseFloat(this.products[i].qtyOrdered.toString());
                        this.products.splice(i, 1);
                        break;
                    }
                }
                // this calls to get a new price and updates the product which updates the ui
                this.productService.changeUnitOfMeasure(product).then(function (productResult) { _this.changeUnitOfMeasureInListCompleted(productResult); }, function (error) { _this.changeUnitOfMeasureInListFailed(error); });
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureInListCompleted = function (product) {
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureInListFailed = function (error) {
            };
            QuickOrderPageController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                if (!product.productUnitOfMeasures) {
                    return;
                }
                product.selectedUnitOfMeasure = this.selectedUnitOfMeasure;
                // this calls to get a new price and updates the product which updates the ui
                this.productService.changeUnitOfMeasure(product).then(function (productResult) { _this.changeUnitOfMeasureCompleted(productResult); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            QuickOrderPageController.prototype.quantityInput = function (product) {
                var _this = this;
                if (this.settings.realTimePricing) {
                    this.showPriceSpinner(product);
                    this.getRealtimePrices(product);
                }
                else {
                    this.productService.getProductPrice(product).then(function (productPrice) { _this.getProductPriceCompleted(productPrice); }, function (error) { _this.getProductPriceFailed(error); });
                }
            };
            QuickOrderPageController.prototype.getProductRealTimePricesCompleted = function (realTimePricing, product) {
            };
            QuickOrderPageController.prototype.getProductRealTimePricesFailed = function (error, product) {
                this.products.forEach(function (p) { return p.pricing.failedToGetRealTimePrices = true; });
            };
            QuickOrderPageController.prototype.getProductPriceCompleted = function (productPrice) {
            };
            QuickOrderPageController.prototype.getProductPriceFailed = function (error) {
            };
            QuickOrderPageController.prototype.showPriceSpinner = function (product) {
                if (product.pricing === null) {
                    product.pricing = {
                        requiresRealTimePrice: true
                    };
                }
                else {
                    product.pricing.requiresRealTimePrice = true;
                }
            };
            QuickOrderPageController.prototype.addAllToCart = function (redirectUrl) {
                var _this = this;
                this.cartService.addLineCollectionFromProducts(this.products.slice().reverse(), true).then(function (cartLines) { _this.addAllToCartCompleted(cartLines, redirectUrl); }, function (error) { _this.addAllToCartFailed(error); });
            };
            QuickOrderPageController.prototype.addAllToCartCompleted = function (cartLines, redirectUrl) {
                this.coreService.redirectToPath(redirectUrl);
            };
            QuickOrderPageController.prototype.addAllToCartFailed = function (error) {
            };
            QuickOrderPageController.prototype.allQtysIsValid = function () {
                return this.products.every(function (product) {
                    return product.qtyOrdered && parseFloat(product.qtyOrdered.toString()) > 0;
                });
            };
            QuickOrderPageController.prototype.removeProduct = function (product) {
                this.products.splice(this.products.indexOf(product), 1);
            };
            QuickOrderPageController.prototype.getTotal = function () {
                var total = 0;
                angular.forEach(this.products, function (product) {
                    if (!product.quoteRequired) {
                        total += product.pricing.extendedUnitNetPrice;
                    }
                });
                return total;
            };
            QuickOrderPageController.prototype.getCurrencySymbol = function () {
                var currencySymbol = "";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false });
                if (productsWithPricing.length) {
                    currencySymbol = productsWithPricing[0].currencySymbol;
                }
                return currencySymbol;
            };
            QuickOrderPageController.prototype.getDecimalSymbol = function () {
                var decimalSymbol = ".";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null } });
                if (productsWithPricing.length) {
                    var productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                    decimalSymbol = productPriceDisplay[productPriceDisplay.length - 3];
                }
                return decimalSymbol;
            };
            QuickOrderPageController.prototype.getDelimiterSymbol = function () {
                var delimiterSymbol = ".";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null } });
                if (productsWithPricing.length) {
                    var productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                    var matches = productPriceDisplay.substring(1, productPriceDisplay.length - 3).match(/[\D]/g);
                    if (matches && matches.length > 0) {
                        delimiterSymbol = matches[0] !== String.fromCharCode(160) ? matches[0] : " ";
                    }
                }
                return delimiterSymbol;
            };
            // returns the grand total of all lines prices, in the same currency format
            QuickOrderPageController.prototype.grandTotal = function () {
                var total = this.getTotal();
                var currencySymbol = this.getCurrencySymbol();
                var decimalSymbol = this.getDecimalSymbol();
                var delimiterSymbol = this.getDelimiterSymbol();
                var formattedTotal = currencySymbol + total.toFixed(2);
                if (decimalSymbol === ".") {
                    formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\.)/g, delimiterSymbol !== " " ? "$1," : "$1 ");
                }
                else {
                    formattedTotal = formattedTotal.replace(".", ",");
                    formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\,)/g, delimiterSymbol !== " " ? "$1." : "$1 ");
                }
                return formattedTotal;
            };
            QuickOrderPageController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            QuickOrderPageController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            QuickOrderPageController.prototype.quantityKeyPress = function (keyEvent, product) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                }
            };
            QuickOrderPageController.prototype.getRealTimeInventory = function (product) {
                var _this = this;
                var deferred = this.$q.defer();
                if (this.settings.realTimeInventory) {
                    this.productService.getProductRealTimeInventory([product]).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory, deferred); }, function (error) { return _this.getProductRealTimeInventoryFailed(error, deferred); });
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            };
            QuickOrderPageController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory, deferred) {
                deferred.resolve();
            };
            QuickOrderPageController.prototype.getProductRealTimeInventoryFailed = function (error, deferred) {
                deferred.resolve();
            };
            QuickOrderPageController.$inject = ["$scope", "$filter", "coreService", "cartService", "productService", "searchService", "settingsService", "addToWishlistPopupService", "selectVariantProductPopupService", "$q"];
            return QuickOrderPageController;
        }());
        quickorder.QuickOrderPageController = QuickOrderPageController;
        angular
            .module("insite")
            .controller("QuickOrderPageController", QuickOrderPageController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quick-order-page.controller.js.map