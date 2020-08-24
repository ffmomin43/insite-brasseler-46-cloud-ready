var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var RecentlyPurchasedController = /** @class */ (function () {
            function RecentlyPurchasedController(settingsService, productService, cartService, $scope) {
                this.settingsService = settingsService;
                this.productService = productService;
                this.cartService = cartService;
                this.$scope = $scope;
                this.products = [];
                this.addingToCart = false;
                this.realTimePricing = false;
                this.failedToGetRealTimePrices = false;
            }
            RecentlyPurchasedController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("fulfillmentMethodChanged", function () {
                    _this.products = [];
                    if (_this.showOrders) {
                        _this.getRecentlyPurchasedItems();
                    }
                });
            };
            RecentlyPurchasedController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.showOrders = settingsCollection.orderSettings.showOrders;
                this.realTimePricing = settingsCollection.productSettings.realTimePricing;
                if (this.showOrders) {
                    this.getRecentlyPurchasedItems();
                }
            };
            RecentlyPurchasedController.prototype.getSettingsFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.getRecentlyPurchasedItems = function (page) {
                var _this = this;
                if (page === void 0) { page = 1; }
                this.productService.getProducts({}, ["recentlypurchased", "pricing"]).then(function (productCollection) { _this.getRecentlyPurchasedItemsCompleted(productCollection); }, function (error) { _this.getRecentlyPurchasedItemsFailed(error); });
            };
            RecentlyPurchasedController.prototype.getRecentlyPurchasedItemsCompleted = function (productCollection) {
                var _this = this;
                this.products = productCollection.products;
                for (var i = 0; i < this.products.length; i++) {
                    this.products[i].qtyOrdered = this.products[i].minimumOrderQty || 1;
                }
                if (this.realTimePricing && this.products && this.products.length > 0) {
                    this.productService.getProductRealTimePrices(this.products).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            RecentlyPurchasedController.prototype.getRecentlyPurchasedItemsFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
                var _this = this;
                realTimePricing.realTimePricingResults.forEach(function (productPrice) {
                    var product = _this.products.find(function (p) { return p.id === productPrice.productId && p.unitOfMeasure === productPrice.unitOfMeasure; });
                    product.pricing = productPrice;
                });
            };
            RecentlyPurchasedController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            RecentlyPurchasedController.prototype.showUnitOfMeasureLabel = function (product) {
                return product !== null && product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            RecentlyPurchasedController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            RecentlyPurchasedController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            RecentlyPurchasedController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            RecentlyPurchasedController.$inject = ["settingsService", "productService", "cartService", "$scope"];
            return RecentlyPurchasedController;
        }());
        order.RecentlyPurchasedController = RecentlyPurchasedController;
        angular
            .module("insite")
            .controller("RecentlyPurchasedController", RecentlyPurchasedController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.recently-purchased.controller.js.map