var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var FrequentlyPurchasedController = /** @class */ (function () {
            function FrequentlyPurchasedController(settingsService, productService, cartService) {
                this.settingsService = settingsService;
                this.productService = productService;
                this.cartService = cartService;
                this.productItems = [];
                this.addingToCart = false;
                this.realTimePricing = false;
                this.failedToGetRealTimePrices = false;
            }
            FrequentlyPurchasedController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            FrequentlyPurchasedController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.realTimePricing = settingsCollection.productSettings.realTimePricing;
                this.getProducts();
            };
            FrequentlyPurchasedController.prototype.getSettingsFailed = function (error) {
            };
            FrequentlyPurchasedController.prototype.getProducts = function () {
                var _this = this;
                this.productService.getProducts({}, ["pricing", "frequentlypurchased", "brand"]).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
            };
            FrequentlyPurchasedController.prototype.getProductsCompleted = function (productCollection) {
                var _this = this;
                var products = productCollection.products;
                for (var index = 0; index < products.length; index++) {
                    var product = products[index];
                    product.qtyOrdered = product.minimumOrderQty || 1;
                    this.productItems.push({ id: product.id, unitOfMeasure: product.unitOfMeasure, product: product });
                }
                if (this.realTimePricing && this.productItems && this.productItems.length > 0) {
                    this.productService.getProductRealTimePrices(this.productItems.map(function (o) { return o.product; })).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            FrequentlyPurchasedController.prototype.getProductsFailed = function (error) {
            };
            FrequentlyPurchasedController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            FrequentlyPurchasedController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            FrequentlyPurchasedController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            FrequentlyPurchasedController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            FrequentlyPurchasedController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            FrequentlyPurchasedController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            FrequentlyPurchasedController.$inject = ["settingsService", "productService", "cartService"];
            return FrequentlyPurchasedController;
        }());
        order.FrequentlyPurchasedController = FrequentlyPurchasedController;
        angular
            .module("insite")
            .controller("FrequentlyPurchasedController", FrequentlyPurchasedController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.frequently-purchased.controller.js.map