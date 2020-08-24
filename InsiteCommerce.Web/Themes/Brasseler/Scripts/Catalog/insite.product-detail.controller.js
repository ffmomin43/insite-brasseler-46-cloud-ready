var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductDetailController = /** @class */ (function () {
            function ProductDetailController($scope, coreService, cartService, productService, addToWishlistPopupService, productSubscriptionPopupService, settingsService, $stateParams, sessionService, spinnerService, queryString, tellAFriendPopupService) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.cartService = cartService;
                this.productService = productService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.productSubscriptionPopupService = productSubscriptionPopupService;
                this.settingsService = settingsService;
                this.$stateParams = $stateParams;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.queryString = queryString;
                this.tellAFriendPopupService = tellAFriendPopupService;
                this.configurationSelection = [];
                this.configurationCompleted = false;
                this.styleSelection = [];
                this.styleSelectionCompleted = false;
                this.parentProduct = null;
                this.initialStyleTraits = [];
                this.initialStyledProducts = [];
                this.styleTraitFiltered = [];
                this.showUnitError = false;
                this.failedToGetRealTimePrices = false;
                this.failedToGetRealTimeInventory = false;
                this.addingToCart = false;
                this.configuration = [];
            }
            ProductDetailController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("updateProductSubscription", function (event, productSubscription, product, cartLine) {
                    _this.onUpdateProductSubscription(event, productSubscription, product, cartLine);
                });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
                this.$scope.$on("$locationChangeSuccess", function () {
                    if (_this.product && _this.product.styleTraits) {
                        _this.initStyleSelection(_this.product.styleTraits);
                    }
                });
            };
            ProductDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                var context = this.sessionService.getContext();
                this.languageId = context.languageId;
                this.resolvePageOnInit();
            };
            ProductDetailController.prototype.getSettingsFailed = function (error) {
            };
            ProductDetailController.prototype.onUpdateProductSubscription = function (event, productSubscription, product, cartLine) {
                this.productSubscription = productSubscription;
            };
            ProductDetailController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.resolvePageOnInit();
            };
            ProductDetailController.prototype.getSessionFailed = function (error) {
            };
            ProductDetailController.prototype.onSessionUpdated = function (session) {
                this.session = session;
                this.resolvePage();
            };
            ProductDetailController.prototype.resolvePageOnInit = function () {
                if (this.session && this.settings && !this.initResolvePageCalled) {
                    this.initResolvePageCalled = true;
                    this.resolvePage();
                }
            };
            ProductDetailController.prototype.resolvePage = function () {
                var _this = this;
                this.spinnerService.show();
                var path = this.$stateParams.path || window.location.pathname;
                this.productService.getCatalogPage(path).then(function (catalogPage) { _this.getCatalogPageCompleted(catalogPage); }, function (error) { _this.getCatalogPageFailed(error); });
            };
            ProductDetailController.prototype.getCatalogPageCompleted = function (catalogPage) {
                var productId = catalogPage.productId; // this url is already known to map to a single product so productId should always be non null.
                this.category = catalogPage.category;
                this.breadCrumbs = catalogPage.breadCrumbs;
                this.getProductData(productId.toString());
            };
            ProductDetailController.prototype.getCatalogPageFailed = function (error) {
            };
            ProductDetailController.prototype.getProductData = function (productId) {
                var _this = this;
                this.spinnerService.show();
                var expand = ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing", "relatedproducts", "brand"];
                var includeAlternateInventory = !this.enableWarehousePickup || this.session.fulfillmentMethod !== "PickUp";
                this.productService.getProduct(null, productId, expand, true, true, "IncludeOnProduct", includeAlternateInventory, this.configuration, false).then(function (productModel) { _this.getProductCompleted(productModel); }, function (error) { _this.getProductFailed(error); });
            };
            ProductDetailController.prototype.getProductCompleted = function (productModel) {
                var productWasAlreadyLoaded = !!this.product;
                this.product = productModel.product;
                this.product.qtyOrdered = this.product.minimumOrderQty || 1;
                if (!productWasAlreadyLoaded && this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                    this.initConfigurationSelection(this.product.configurationDto.sections);
                }
                if (this.product.styleTraits.length > 0) {
                    this.initialStyledProducts = this.product.styledProducts.slice();
                    this.styleTraitFiltered = this.product.styleTraits.slice();
                    this.initialStyleTraits = this.product.styleTraits.slice();
                    if (this.product.isStyleProductParent) {
                        this.parentProduct = angular.copy(this.product);
                    }
                    if (!productWasAlreadyLoaded) {
                        this.initStyleSelection(this.product.styleTraits);
                    }
                }
                if (productWasAlreadyLoaded && this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                    this.configurationCompleted = false;
                    this.configChanged();
                }
                else {
                    this.getRealTimePrices();
                    if (!this.settings.inventoryIncludedWithPricing) {
                        this.getRealTimeInventory();
                    }
                }
                this.setTabs();
            };
            ProductDetailController.prototype.setTabs = function () {
                setTimeout(function () {
                    $(".easy-resp-tabs").easyResponsiveTabs();
                }, 10);
            };
            ProductDetailController.prototype.getProductFailed = function (error) {
            };
            ProductDetailController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.product.quoteRequired) {
                    return;
                }
                if (this.settings.realTimePricing) {
                    var priceProducts_1 = [this.product];
                    if (this.product.styledProducts != null && this.product.styledProducts.length > 0) {
                        this.product.styledProducts.forEach(function (s) {
                            s.id = s.productId;
                            priceProducts_1.push(s);
                        });
                    }
                    this.product.pricing.requiresRealTimePrice = true;
                    this.productService.getProductRealTimePrices(priceProducts_1).then(function (realTimePrice) { return _this.getProductRealTimePricesCompleted(realTimePrice); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            ProductDetailController.prototype.getProductRealTimePricesCompleted = function (realTimePrice) {
                // product.pricing is already updated
                if (this.product.isStyleProductParent) {
                    this.parentProduct = angular.copy(this.product);
                }
                if (this.settings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            ProductDetailController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
                if (this.settings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            ProductDetailController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.settings.realTimeInventory) {
                    var inventoryProducts_1 = [this.product];
                    if (this.product.styledProducts != null && this.product.styledProducts.length > 0) {
                        this.product.styledProducts.forEach(function (s) {
                            s.id = s.productId;
                            inventoryProducts_1.push(s);
                        });
                    }
                    this.productService.getProductRealTimeInventory(inventoryProducts_1).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
            };
            ProductDetailController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory) {
                // product inventory is already updated
                if (this.product.isStyleProductParent) {
                    this.parentProduct = angular.copy(this.product);
                    this.styleChange();
                }
                if (this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                    this.configurationCompleted = this.isConfigurationCompleted();
                }
            };
            ProductDetailController.prototype.getProductRealTimeInventoryFailed = function (error) {
                this.failedToGetRealTimeInventory = true;
            };
            ProductDetailController.prototype.initConfigurationSelection = function (sections) {
                var _this = this;
                this.configurationSelection = [];
                angular.forEach(sections, function (section) {
                    var result = _this.coreService.getObjectByPropertyValue(section.options, { selected: true });
                    _this.configurationSelection.push(result);
                });
                this.configurationCompleted = this.isConfigurationCompleted();
            };
            ProductDetailController.prototype.initStyleSelection = function (styleTraits) {
                var _this = this;
                // from autocomplete we are using option, from search user will be redirected with criteria
                var styledOption = this.queryString.get("option") || this.queryString.get("criteria");
                var styledOptionLowerCase = styledOption ? styledOption.toLowerCase() : "";
                var styledProduct;
                if (styledOptionLowerCase && this.product.styledProducts) {
                    styledProduct = this.product.styledProducts.filter(function (o) { return o.erpNumber.toLowerCase() === styledOptionLowerCase; })[0];
                }
                this.styleSelection = [];
                angular.forEach(styleTraits.sort(function (a, b) { return a.sortOrder - b.sortOrder; }), function (styleTrait) {
                    var result = null;
                    if (styledProduct) {
                        for (var _i = 0, _a = styledProduct.styleValues; _i < _a.length; _i++) {
                            var styleValue = _a[_i];
                            result = _this.coreService.getObjectByPropertyValue(styleTrait.styleValues, { styleTraitId: styleValue.styleTraitId, styleTraitValueId: styleValue.styleTraitValueId });
                            if (result) {
                                break;
                            }
                        }
                    }
                    if (!result) {
                        result = _this.coreService.getObjectByPropertyValue(styleTrait.styleValues, { isDefault: true });
                    }
                    _this.styleSelection.push(result);
                });
                if (styledProduct) {
                    this.product.qtyOrdered = styledProduct.minimumOrderQty || 1;
                }
                this.styleChange();
            };
            ProductDetailController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                var sectionOptions = null;
                if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                    sectionOptions = this.configurationSelection;
                }
                this.cartService.addLineFromProduct(product, sectionOptions, this.productSubscription, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            ProductDetailController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            ProductDetailController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            ProductDetailController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            ProductDetailController.prototype.openProductSubscriptionPopup = function (product) {
                this.productSubscriptionPopupService.display({ product: product, cartLine: null, productSubscription: this.productSubscription });
            };
            ProductDetailController.prototype.openSharePopup = function (product) {
                this.tellAFriendPopupService.display({ product: product });
            };
            ProductDetailController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.showUnitError = false;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            ProductDetailController.prototype.changeUnitOfMeasureCompleted = function (product) {
                this.product = product;
                this.productService.updateAvailability(product);
                if (this.parentProduct) {
                    this.parentProduct.selectedUnitOfMeasure = product.selectedUnitOfMeasure;
                    this.parentProduct.unitOfMeasureDisplay = product.unitOfMeasureDisplay;
                }
            };
            ProductDetailController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            ProductDetailController.prototype.styleChange = function () {
                var _this = this;
                this.showUnitError = false;
                var styledProductsFiltered = [];
                angular.copy(this.initialStyleTraits, this.styleTraitFiltered); // init styleTraitFiltered to display
                // loop trough every trait and compose values
                this.styleTraitFiltered.forEach(function (styleTrait) {
                    if (styleTrait) {
                        styledProductsFiltered = _this.initialStyledProducts.slice();
                        // iteratively filter products for selected traits (except current)
                        _this.styleSelection.forEach(function (styleValue) {
                            if (styleValue && styleValue.styleTraitId !== styleTrait.styleTraitId) { // skip current
                                styledProductsFiltered = _this.getProductsByStyleTraitValueId(styledProductsFiltered, styleValue.styleTraitValueId);
                            }
                        });
                        // for current trait get all distinct values in filtered products
                        var filteredValues_1 = [];
                        styledProductsFiltered.forEach(function (product) {
                            var currentProduct = _this.coreService.getObjectByPropertyValue(product.styleValues, { styleTraitId: styleTrait.styleTraitId }); // get values for current product
                            var isProductInFilteredList = currentProduct && filteredValues_1.some(function (item) { return (item.styleTraitValueId === currentProduct.styleTraitValueId); }); // check if value already selected
                            if (currentProduct && !isProductInFilteredList) {
                                filteredValues_1.push(currentProduct);
                            }
                        });
                        styleTrait.styleValues = filteredValues_1.slice();
                    }
                });
                this.styleSelectionCompleted = this.isStyleSelectionCompleted();
                if (this.styleSelectionCompleted) {
                    var selectedProduct = this.getSelectedStyleProduct(styledProductsFiltered);
                    if (selectedProduct) {
                        this.selectStyledProduct(selectedProduct);
                        this.product.isStyleProductParent = false;
                    }
                }
                else {
                    if (!this.product.isStyleProductParent) {
                        // displaying parent product when style selection is not completed and completed product was displayed
                        if (this.parentProduct.productUnitOfMeasures && this.parentProduct.productUnitOfMeasures.length > 0 && !this.parentProduct.canConfigure) {
                            if (this.parentProduct.productUnitOfMeasures.every(function (elem) { return elem.unitOfMeasure !== _this.product.selectedUnitOfMeasure; })) {
                                this.parentProduct.selectedUnitOfMeasure = this.getDefaultValue(this.parentProduct.productUnitOfMeasures);
                                this.changeUnitOfMeasure(this.parentProduct);
                            }
                            if (!this.settings.realTimePricing) {
                                this.productService.getProductPrice(this.parentProduct).then(function (productPrice) { _this.styleChangeGetProductPriceCompleted(productPrice); }, function (error) { _this.styleChangeGetProductPriceFailed(error); });
                            }
                            else {
                                this.product = angular.copy(this.parentProduct);
                                this.setTabs();
                            }
                        }
                        else {
                            this.product = angular.copy(this.parentProduct);
                            this.product.unitOfMeasureDisplay = "";
                            this.setTabs();
                        }
                    }
                }
            };
            ProductDetailController.prototype.styleChangeGetProductPriceCompleted = function (productPrice) {
                this.product = angular.copy(this.parentProduct);
                this.setTabs();
            };
            ProductDetailController.prototype.styleChangeGetProductPriceFailed = function (error) {
            };
            ProductDetailController.prototype.getSelectedStyleProduct = function (styledProducts) {
                var _this = this;
                this.styleSelection.forEach(function (styleValue) {
                    styledProducts = _this.getProductsByStyleTraitValueId(styledProducts, styleValue.styleTraitValueId);
                });
                return (styledProducts && styledProducts.length > 0) ? styledProducts[0] : null;
            };
            ProductDetailController.prototype.getProductsByStyleTraitValueId = function (styledProducts, styleTraitValueId) {
                return styledProducts.filter(function (product) { return product.styleValues.some(function (value) { return value.styleTraitValueId === styleTraitValueId; }); });
            };
            ProductDetailController.prototype.selectStyledProduct = function (styledProduct) {
                var _this = this;
                this.product.erpNumber = styledProduct.erpNumber;
                this.product.smallImagePath = styledProduct.smallImagePath;
                this.product.mediumImagePath = styledProduct.mediumImagePath;
                this.product.largeImagePath = styledProduct.largeImagePath;
                this.product.name = styledProduct.name;
                this.product.id = styledProduct.productId;
                this.product.qtyOnHand = styledProduct.qtyOnHand;
                this.product.quoteRequired = styledProduct.quoteRequired;
                this.product.shortDescription = styledProduct.shortDescription;
                this.product.availability = styledProduct.availability;
                this.product.productUnitOfMeasures = styledProduct.productUnitOfMeasures;
                this.product.productImages = styledProduct.productImages;
                this.product.trackInventory = styledProduct.trackInventory;
                this.product.minimumOrderQty = styledProduct.minimumOrderQty;
                this.product.productDetailUrl = styledProduct.productDetailUrl;
                if (this.product.qtyOrdered < this.product.minimumOrderQty) {
                    this.product.qtyOrdered = this.product.minimumOrderQty;
                }
                if (this.product.productUnitOfMeasures && this.product.productUnitOfMeasures.length > 1) {
                    this.productService.getProductPrice(this.product).then(function (productPrice) { _this.selectStyleProductGetProductPriceCompleted(productPrice); }, function (error) { _this.selectStyleProductGetProductPriceFailed(error); });
                    if (!this.product.selectedUnitOfMeasure) {
                        this.product.selectedUnitOfMeasure = this.getDefaultValue(this.product.productUnitOfMeasures);
                        this.changeUnitOfMeasure(this.product);
                    }
                    else if (this.product.productUnitOfMeasures.every(function (elem) { return elem.unitOfMeasure !== _this.product.selectedUnitOfMeasure; })) {
                        this.product.unitOfMeasureDisplay = "";
                        this.showUnitError = true;
                    }
                }
                else {
                    if (this.product.productUnitOfMeasures && this.product.productUnitOfMeasures.length === 1) {
                        this.product.selectedUnitOfMeasure = this.getDefaultValue(this.product.productUnitOfMeasures);
                        this.changeUnitOfMeasure(this.product);
                    }
                    else {
                        this.product.unitOfMeasureDisplay = "";
                    }
                    this.product.pricing = styledProduct.pricing;
                    this.product.quoteRequired = styledProduct.quoteRequired;
                }
            };
            ProductDetailController.prototype.selectStyleProductGetProductPriceCompleted = function (productPrice) {
            };
            ProductDetailController.prototype.selectStyleProductGetProductPriceFailed = function (error) {
            };
            ProductDetailController.prototype.isStyleSelectionCompleted = function () {
                if (!this.product.styleTraits) {
                    return true;
                }
                return this.styleSelection.every(function (item) { return (item != null); });
            };
            ProductDetailController.prototype.isConfigurationCompleted = function () {
                if (!this.product.isConfigured) {
                    return true;
                }
                return this.configurationSelection.every(function (item) { return (item != null); });
            };
            ProductDetailController.prototype.configChanged = function () {
                var _this = this;
                this.spinnerService.show();
                this.configuration = [];
                angular.forEach(this.configurationSelection, function (selection) {
                    _this.configuration.push(selection ? selection.sectionOptionId.toString() : guidHelper.emptyGuid());
                });
                this.getConfigurablePrice(this.product);
                this.getConfigurableAvailability(this.product);
            };
            ProductDetailController.prototype.getConfigurablePrice = function (product) {
                var _this = this;
                if (this.settings.realTimePricing) {
                    this.productService.getProductRealTimePrice(product, this.configuration).then(function (realTimePrice) { return _this.getProductRealTimePricesCompleted(realTimePrice); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
                else {
                    this.productService.getProductPrice(product, this.configuration).then(function (productPrice) { _this.getConfigurablePriceCompleted(productPrice); }, function (error) { _this.getConfigurablePriceFailed(error); });
                }
            };
            ProductDetailController.prototype.getConfigurablePriceCompleted = function (productPrice) {
            };
            ProductDetailController.prototype.getConfigurablePriceFailed = function (error) {
            };
            ProductDetailController.prototype.getConfigurableAvailability = function (product) {
                var _this = this;
                if (this.settings.realTimeInventory) {
                    var configurations = {};
                    configurations["" + product.id] = this.configuration;
                    this.productService.getProductRealTimeInventory([product], null, configurations).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
                else {
                    this.productService.getProductAvailability(product, this.configuration).then(function (productAvailability) { _this.getProductAvailabilityCompleted(productAvailability); }, function (error) { _this.getProductAvailabilityFailed(error); });
                }
            };
            ProductDetailController.prototype.getProductAvailabilityCompleted = function (productAvailability) {
                this.configurationCompleted = this.isConfigurationCompleted();
            };
            ProductDetailController.prototype.getProductAvailabilityFailed = function (error) {
            };
            ProductDetailController.prototype.getDefaultValue = function (unitOfMeasures) {
                var defaultMeasures = unitOfMeasures.filter(function (value) {
                    return value.isDefault;
                });
                if (defaultMeasures.length > 0) {
                    return defaultMeasures[0].unitOfMeasure;
                }
                else {
                    return unitOfMeasures[0].unitOfMeasure;
                }
            };
            ProductDetailController.prototype.isAddToCartVisible = function () {
                return this.product && this.product.allowedAddToCart &&
                    (this.product.canAddToCart ||
                        ((this.styleSelectionCompleted || this.configurationCompleted)
                            && (this.settings.allowBackOrder || this.product.availability.messageType !== 2))
                            && !this.product.canConfigure);
            };
            ProductDetailController.$inject = [
                "$scope",
                "coreService",
                "cartService",
                "productService",
                "addToWishlistPopupService",
                "productSubscriptionPopupService",
                "settingsService",
                "$stateParams",
                "sessionService",
                "spinnerService",
                "queryString",
                "tellAFriendPopupService"
            ];
            return ProductDetailController;
        }());
        catalog.ProductDetailController = ProductDetailController;
        angular
            .module("insite")
            .controller("ProductDetailController", ProductDetailController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-detail.controller.js.map