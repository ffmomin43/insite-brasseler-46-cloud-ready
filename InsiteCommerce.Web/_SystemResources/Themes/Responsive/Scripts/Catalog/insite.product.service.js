var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductService = /** @class */ (function () {
            function ProductService($http, $rootScope, $q, coreService, settingsService, httpWrapperService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.httpWrapperService = httpWrapperService;
                this.productServiceUri = "/api/v1/products/";
                this.categoryServiceUri = "/api/v1/categories";
                this.catalogPageServiceUri = "/api/v1/catalogpages";
                this.webCrossSellUri = "/api/v1/websites/current/crosssells";
                this.productSettingsUri = "/api/v1/settings/products";
                this.realTimePricingUri = "/api/v1/realtimepricing";
                this.realTimeInventoryUri = "/api/v1/realtimeinventory";
                this.init();
            }
            ProductService.prototype.init = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            ProductService.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
            };
            ProductService.prototype.getSettingsFailed = function (error) {
            };
            ProductService.prototype.changeUnitOfMeasure = function (product, refreshPrice) {
                var _this = this;
                if (refreshPrice === void 0) { refreshPrice = true; }
                product.unitOfMeasure = product.selectedUnitOfMeasure;
                var selectedUnitOfMeasure = this.coreService.getObjectByPropertyValue(product.productUnitOfMeasures, { unitOfMeasure: product.selectedUnitOfMeasure });
                var deferred = this.$q.defer();
                if (!product.quoteRequired && refreshPrice) {
                    if (this.productSettings.realTimePricing) {
                        product.pricing.requiresRealTimePrice = true;
                        this.getProductRealTimePrices([product]).then(function (realTimePrice) {
                            _this.changeUnitOfMeasureGetProductRealTimePriceCompleted(product, selectedUnitOfMeasure, realTimePrice, deferred);
                        });
                    }
                    else {
                        this.getProductPrice(product).finally(function () {
                            _this.changeUnitOfMeasureGetProductPriceCompleted(product, selectedUnitOfMeasure, null, deferred);
                        });
                    }
                }
                else {
                    product.unitOfMeasureDisplay = selectedUnitOfMeasure.unitOfMeasureDisplay;
                    product.unitOfMeasureDescription = selectedUnitOfMeasure.description;
                    deferred.resolve(product);
                }
                return deferred.promise;
            };
            ProductService.prototype.changeUnitOfMeasureGetProductRealTimePriceCompleted = function (product, unitOfMeasure, realTimePrice, deferred) {
                product.unitOfMeasureDisplay = unitOfMeasure.unitOfMeasureDisplay;
                product.unitOfMeasureDescription = unitOfMeasure.description;
                deferred.resolve(product);
            };
            ProductService.prototype.changeUnitOfMeasureGetProductPriceCompleted = function (product, unitOfMeasure, productPrice, deferred) {
                if (!unitOfMeasure) {
                    deferred.reject();
                }
                product.unitOfMeasureDisplay = unitOfMeasure.unitOfMeasureDisplay;
                product.unitOfMeasureDescription = unitOfMeasure.description;
                deferred.resolve(product);
            };
            ProductService.prototype.updateAvailability = function (product) {
                if (product && !product.isStyleProductParent && product.productUnitOfMeasures && product.selectedUnitOfMeasure) {
                    var productUnitOfMeasure = product.productUnitOfMeasures.find(function (uom) { return uom.unitOfMeasure === product.selectedUnitOfMeasure; });
                    if (productUnitOfMeasure && productUnitOfMeasure.availability) {
                        product.availability = productUnitOfMeasure.availability;
                    }
                }
            };
            // updates the pricing on a product object based on the qtyOrdered, selectedUnitOfMeasure and array of configuration guids
            ProductService.prototype.getProductPrice = function (product, configuration) {
                var _this = this;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: "" + this.productServiceUri + product.id + "/price", params: this.getProductPriceParams(product, configuration), bypassErrorInterceptor: true }), function (response) { _this.getProductPriceCompleted(response, product); }, this.getProductPriceFailed);
            };
            ProductService.prototype.getProductPriceParams = function (product, configuration) {
                return {
                    unitOfMeasure: product.selectedUnitOfMeasure,
                    qtyOrdered: product.qtyOrdered,
                    configuration: configuration
                };
            };
            ProductService.prototype.getProductPriceCompleted = function (response, product) {
                product.pricing = response.data;
            };
            ProductService.prototype.getProductPriceFailed = function (error) {
            };
            ProductService.prototype.getProductAvailability = function (product, configuration) {
                var _this = this;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: "" + this.productServiceUri + product.id + "/availability", params: this.getProductAvailabilityParams(product, configuration), bypassErrorInterceptor: true }), function (response) { _this.getProductAvailabilityCompleted(response, product); }, this.getProductAvailabilityFailed);
            };
            ProductService.prototype.getProductAvailabilityParams = function (product, configuration) {
                return {
                    configuration: configuration
                };
            };
            ProductService.prototype.getProductAvailabilityCompleted = function (response, product) {
                product.availability = response.data.availability;
            };
            ProductService.prototype.getProductAvailabilityFailed = function (error) {
            };
            // updates the pricing with real time (external) prices. only id, selectedUnitOfMeasure, and qtyOrdered are used
            ProductService.prototype.getProductRealTimePrices = function (products) {
                var _this = this;
                if (!this.productSettings.canSeePrices) {
                    var deferred = this.$q.defer();
                    deferred.resolve(null);
                    return deferred.promise;
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.realTimePricingUri, data: this.getProductRealTimePricesParams(products), bypassErrorInterceptor: true }), function (response) { _this.getProductRealTimePricesCompleted(response, products); }, this.getProductRealTimePricesFailed);
            };
            ProductService.prototype.getProductRealTimePricesParams = function (products) {
                return {
                    productPriceParameters: products.map(function (product) {
                        return {
                            productId: product.id,
                            unitOfMeasure: product.selectedUnitOfMeasure,
                            qtyOrdered: product.qtyOrdered
                        };
                    })
                };
            };
            ProductService.prototype.getProductRealTimePricesCompleted = function (response, products) {
                response.data.realTimePricingResults.forEach(function (productPrice) {
                    var product = products.find(function (p) { return p.id === productPrice.productId; });
                    if (product) {
                        product.pricing = productPrice;
                    }
                });
            };
            ProductService.prototype.getProductRealTimePricesFailed = function (error) {
            };
            ProductService.prototype.getProductRealTimePrice = function (product, configuration) {
                var _this = this;
                if (!this.productSettings.canSeePrices) {
                    var deferred = this.$q.defer();
                    deferred.resolve(null);
                    return deferred.promise;
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.realTimePricingUri, data: this.getProductRealTimePriceParams(product, configuration), bypassErrorInterceptor: true }), function (response) { _this.getProductRealTimePriceCompleted(response, product); }, this.getProductRealTimePriceFailed);
            };
            ProductService.prototype.getProductRealTimePriceParams = function (product, configuration) {
                return {
                    productPriceParameters: [
                        {
                            productId: product.id,
                            unitOfMeasure: product.selectedUnitOfMeasure,
                            qtyOrdered: product.qtyOrdered,
                            configuration: configuration
                        }
                    ]
                };
            };
            ProductService.prototype.getProductRealTimePriceCompleted = function (response, product) {
                response.data.realTimePricingResults.forEach(function (productPrice) {
                    if (product.id === productPrice.productId) {
                        product.pricing = productPrice;
                    }
                });
            };
            ProductService.prototype.getProductRealTimePriceFailed = function (error) {
            };
            ProductService.prototype.getProductRealTimeInventory = function (products, expand, configuration) {
                var _this = this;
                if (!this.productSettings.showInventoryAvailability) {
                    var deferred = this.$q.defer();
                    deferred.resolve(null);
                    return deferred.promise;
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.realTimeInventoryUri + (expand ? "?expand=" + expand.join() : ""), data: this.getProductRealTimeInventoryParams(products, configuration), bypassErrorInterceptor: true }), function (response) { _this.getProductRealTimeInventoryCompleted(response, products); }, this.getProductRealTimeInventoryFailed);
            };
            ProductService.prototype.getProductRealTimeInventoryParams = function (products, configurations) {
                var productIds = new Array();
                products.forEach(function (product) {
                    if (productIds.indexOf(product.id) === -1) {
                        productIds.push(product.id);
                    }
                });
                return {
                    productIds: productIds,
                    configurations: configurations
                };
            };
            ProductService.prototype.getProductRealTimeInventoryCompleted = function (response, products) {
                var _this = this;
                response.data.realTimeInventoryResults.forEach(function (productInventory) {
                    products.forEach(function (product) {
                        if (!product || product.id !== productInventory.productId) {
                            return;
                        }
                        product.qtyOnHand = productInventory.qtyOnHand;
                        var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(function (o) { return o.unitOfMeasure === product.unitOfMeasure; });
                        if (inventoryAvailability) {
                            product.availability = inventoryAvailability.availability;
                        }
                        else {
                            product.availability = { messageType: 0 };
                        }
                        product.productUnitOfMeasures.forEach(function (productUnitOfMeasure) {
                            var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(function (o) { return o.unitOfMeasure === productUnitOfMeasure.unitOfMeasure; });
                            if (inventoryAvailability) {
                                productUnitOfMeasure.availability = inventoryAvailability.availability;
                            }
                            else {
                                productUnitOfMeasure.availability = { messageType: 0 };
                            }
                        });
                        _this.updateAvailability(product);
                        if (product.canAddToCart && !product.canBackOrder && product.trackInventory && product.qtyOnHand <= 0) {
                            product.canAddToCart = false;
                            product.canEnterQuantity = product.canAddToCart;
                            product.canViewDetails = !product.canAddToCart;
                        }
                    });
                });
            };
            ProductService.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            ProductService.prototype.getCatalogPage = function (path) {
                // check for server side data
                if (catalog.catalogPageGlobal) {
                    var deferred = this.$q.defer();
                    deferred.resolve(catalog.catalogPageGlobal);
                    return deferred.promise;
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.catalogPageServiceUri, params: this.getCatalogPageParams(path) }), this.getCatalogPageCompleted, this.getCatalogPageFailed);
            };
            ProductService.prototype.getCatalogPageParams = function (path) {
                return { path: path };
            };
            ProductService.prototype.getCatalogPageCompleted = function (response) {
            };
            ProductService.prototype.getCatalogPageFailed = function (error) {
            };
            ProductService.prototype.getCategoryTree = function (startCategoryId, maxDepth) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.categoryServiceUri, params: this.getCategoryTreeParams(startCategoryId, maxDepth) }), this.getCategoryTreeCompleted, this.getCategoryTreeFailed);
            };
            ProductService.prototype.getCategoryTreeParams = function (startCategoryId, maxDepth) {
                var params = {};
                if (startCategoryId) {
                    params.startCategoryId = startCategoryId;
                }
                if (maxDepth) {
                    params.maxDepth = maxDepth;
                }
                return params;
            };
            ProductService.prototype.getCategoryTreeCompleted = function (response) {
            };
            ProductService.prototype.getCategoryTreeFailed = function (error) {
            };
            ProductService.prototype.getCategory = function (categoryId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.categoryServiceUri + "/" + categoryId, params: this.getCategoryParams() }), this.getCategoryCompleted, this.getCategoryFailed);
            };
            ProductService.prototype.getCategoryParams = function () {
                return {};
            };
            ProductService.prototype.getCategoryCompleted = function (response) {
            };
            ProductService.prototype.getCategoryFailed = function (error) {
            };
            ProductService.prototype.getProducts = function (parameters, expand, filter) {
                var _this = this;
                var deferred = this.$q.defer();
                this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.productServiceUri, params: this.getProductsParams(parameters, expand, filter), timeout: deferred.promise }), function (response) { _this.getProductsCompleted(response, deferred); }, function (error) { _this.getProductsFailed(error, deferred); });
                deferred.promise.cancel = function () {
                    deferred.resolve("cancelled");
                };
                return deferred.promise;
            };
            ProductService.prototype.getProductsParams = function (parameters, expand, filter) {
                var params = parameters;
                if (expand) {
                    params.expand = expand.join();
                }
                if (filter) {
                    params.filter = filter.join();
                }
                return params;
            };
            ProductService.prototype.getProductsCompleted = function (response, deferred) {
                deferred.resolve(response.data);
            };
            ProductService.prototype.getProductsFailed = function (error, deferred) {
                deferred.reject(error);
            };
            ProductService.prototype.getProduct = function (categoryId, productId, expand, addToRecentlyViewed, applyPersonalization, includeAttributes, includeAlternateInventory, configuration, replaceProducts) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: "" + this.productServiceUri + productId, params: this.getProductParams(categoryId, expand, addToRecentlyViewed, applyPersonalization, includeAttributes, includeAlternateInventory, configuration, replaceProducts) }), this.getProductCompleted, this.getProductFailed);
            };
            ProductService.prototype.getProductParams = function (categoryId, expand, addToRecentlyViewed, applyPersonalization, includeAttributes, includeAlternateInventory, configuration, replaceProducts) {
                var params = {};
                if (expand) {
                    params.expand = expand.join();
                }
                if (categoryId) {
                    params.categoryId = categoryId;
                }
                if (addToRecentlyViewed) {
                    params.addToRecentlyViewed = true;
                }
                if (applyPersonalization) {
                    params.applyPersonalization = applyPersonalization;
                }
                if (includeAttributes) {
                    params.includeAttributes = includeAttributes;
                }
                if (typeof (includeAlternateInventory) !== "undefined") {
                    params.includeAlternateInventory = includeAlternateInventory;
                }
                if (typeof (configuration) !== "undefined") {
                    params.configuration = configuration;
                }
                if (typeof (replaceProducts) !== "undefined") {
                    params.replaceProducts = replaceProducts;
                }
                return params;
            };
            ProductService.prototype.getProductByParameters = function (parameters) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: "" + this.productServiceUri + parameters.productId, params: parameters }), this.getProductCompleted, this.getProductFailed);
            };
            ProductService.prototype.getProductCompleted = function (response) {
                this.$rootScope.$broadcast("productLoaded", response.data.product);
            };
            ProductService.prototype.getProductFailed = function (error) {
            };
            ProductService.prototype.getProductSettings = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.productSettingsUri), this.getProductSettingsCompleted, this.getProductSettingsFailed);
            };
            ProductService.prototype.getProductSettingsCompleted = function (response) {
            };
            ProductService.prototype.getProductSettingsFailed = function (error) {
            };
            // get cross sells for a product or pass no parameter to get web cross sells
            ProductService.prototype.getCrossSells = function (productId) {
                var uri = this.webCrossSellUri;
                if (productId) {
                    uri = "" + this.productServiceUri + productId + "/crosssells";
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(uri), this.getCrossSellsCompleted, this.getCrossSellsFailed);
            };
            ProductService.prototype.getCrossSellsCompleted = function (response) {
            };
            ProductService.prototype.getCrossSellsFailed = function (error) {
            };
            ProductService.prototype.batchGet = function (extendedNames) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.productServiceUri + "/batchget", { extendedNames: extendedNames }), this.bulkSearchCompleted, this.bulkSearchFailed);
            };
            ProductService.prototype.bulkSearchCompleted = function (response) {
            };
            ProductService.prototype.bulkSearchFailed = function (error) {
            };
            ProductService.$inject = ["$http", "$rootScope", "$q", "coreService", "settingsService", "httpWrapperService"];
            return ProductService;
        }());
        catalog.ProductService = ProductService;
        angular
            .module("insite")
            .service("productService", ProductService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product.service.js.map