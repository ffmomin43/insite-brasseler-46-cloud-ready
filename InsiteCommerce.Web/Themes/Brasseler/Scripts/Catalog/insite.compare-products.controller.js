var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var CompareProductsController = /** @class */ (function () {
            function CompareProductsController(cartService, coreService, productService, compareProductsService, addToWishlistPopupService, settingsService, $localStorage) {
                this.cartService = cartService;
                this.coreService = coreService;
                this.productService = productService;
                this.compareProductsService = compareProductsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$localStorage = $localStorage;
                this.ready = false;
                this.addingToCart = false;
                this.carouselIncludesBrands = false;
            }
            CompareProductsController.prototype.$onInit = function () {
                var _this = this;
                this.productsToCompare = [];
                this.relevantAttributeTypes = [];
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            CompareProductsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.getProducts();
            };
            CompareProductsController.prototype.getSettingsFailed = function (error) {
            };
            CompareProductsController.prototype.getProducts = function () {
                var _this = this;
                var productsToCompare = this.compareProductsService.getProductIds();
                var expand = ["styledproducts", "attributes", "pricing", "brand"];
                var parameter = { productIds: productsToCompare };
                this.productService.getProducts(parameter, expand).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
            };
            CompareProductsController.prototype.getProductsCompleted = function (productCollection) {
                var _this = this;
                this.productsToCompare = productCollection.products;
                if (this.productsToCompare.length > 0) {
                    this.carouselIncludesBrands = this.productsToCompare.some(function (product) { return !!product.brand; });
                    var allAttributeTypes = lodash.chain(this.productsToCompare)
                        .pluck("attributeTypes")
                        .flatten(true)
                        .where({ "isComparable": true })
                        .sortBy("label")
                        .value();
                    this.relevantAttributeTypes = [];
                    allAttributeTypes.forEach(function (attributeType) {
                        if (!lodash.some(_this.relevantAttributeTypes, function (relevantAttributeType) {
                            return relevantAttributeType.id === attributeType.id;
                        })) {
                            _this.relevantAttributeTypes.push(attributeType);
                        }
                    });
                }
                if (this.productSettings.realTimePricing) {
                    this.productService.getProductRealTimePrices(this.productsToCompare).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
                if (!this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
                this.ready = true;
            };
            CompareProductsController.prototype.getProductsFailed = function (error) {
            };
            CompareProductsController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            CompareProductsController.prototype.getProductRealTimePricesFailed = function (error) {
                this.productsToCompare.forEach(function (product) {
                    if (product.pricing) {
                        product.pricing.failedToGetRealTimePrices = true;
                    }
                });
            };
            CompareProductsController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory && this.productsToCompare.length) {
                    this.productService.getProductRealTimeInventory(this.productsToCompare).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
            };
            CompareProductsController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory) {
            };
            CompareProductsController.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            // gets all attribute value display strings available for a given attribute type
            CompareProductsController.prototype.getAttributeTypeValuesForAllProducts = function (attributeTypeId) {
                if (!attributeTypeId) {
                    return [];
                }
                return lodash.chain(this.productsToCompare)
                    .pluck("attributeTypes")
                    .flatten(true)
                    .where({ "id": attributeTypeId })
                    .pluck("attributeValues")
                    .flatten(true)
                    .pluck("valueDisplay")
                    .value();
            };
            // returns all attribute value display strings belonging to products for a given attribute type
            CompareProductsController.prototype.getUniqueAttributeTypeValuesForAllProducts = function (attributeTypeId) {
                var _this = this;
                var attributeValues = [];
                this.productsToCompare.forEach(function (product) {
                    attributeValues = attributeValues.concat(_this.getAttributeValuesForProduct(product, attributeTypeId));
                });
                return lodash.uniq(attributeValues);
            };
            // returns the attribute value display string for a given product and attribute type
            CompareProductsController.prototype.getAttributeValuesForProduct = function (product, attributeTypeId) {
                if (!product || !attributeTypeId) {
                    return [];
                }
                return lodash.chain(product.attributeTypes)
                    .where({ "id": attributeTypeId })
                    .pluck("attributeValues")
                    .flatten(true)
                    .pluck("valueDisplay")
                    .value();
            };
            // returns a list of products with a given attribute value
            CompareProductsController.prototype.getProductsThatContainAttributeTypeIdAndAttributeValue = function (attributeTypeId, attributeValue) {
                var _this = this;
                if (!attributeTypeId || !attributeValue) {
                    return [];
                }
                var productsThatContainsAttributeTypeIdAndAttributeValue = [];
                this.productsToCompare.forEach(function (product) {
                    var attributeValues = _this.getAttributeValuesForProduct(product, attributeTypeId);
                    var hasAttributeTypeIdAndAttributeValue = attributeValues.length > 0 && lodash.indexOf(attributeValues, attributeValue) > -1;
                    if (hasAttributeTypeIdAndAttributeValue) {
                        productsThatContainsAttributeTypeIdAndAttributeValue.push(product);
                    }
                });
                return productsThatContainsAttributeTypeIdAndAttributeValue;
            };
            CompareProductsController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            CompareProductsController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            CompareProductsController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            CompareProductsController.prototype.removeComparedProduct = function (productId) {
                lodash.remove(this.productsToCompare, function (p) { return p.id === productId; });
                this.compareProductsService.removeProduct(productId);
            };
            CompareProductsController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            CompareProductsController.prototype.removeAllComparedProducts = function () {
                this.compareProductsService.removeAllProducts();
                this.productsToCompare = [];
                this.goBack();
            };
            CompareProductsController.prototype.goBack = function () {
                var returlUrl = this.$localStorage.get("compareReturnUrl");
                if (returlUrl) {
                    this.coreService.redirectToPath(returlUrl);
                }
            };
            CompareProductsController.$inject = [
                "cartService",
                "coreService",
                "productService",
                "compareProductsService",
                "addToWishlistPopupService",
                "settingsService",
                "$localStorage"
            ];
            return CompareProductsController;
        }());
        catalog.CompareProductsController = CompareProductsController;
        angular
            .module("insite")
            .controller("CompareProductsController", CompareProductsController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.compare-products.controller.js.map