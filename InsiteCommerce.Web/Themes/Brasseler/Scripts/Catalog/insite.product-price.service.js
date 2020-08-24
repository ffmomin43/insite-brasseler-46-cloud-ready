var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductPriceService = /** @class */ (function () {
            function ProductPriceService() {
            }
            ProductPriceService.prototype.getUnitNetPrice = function (product) {
                if (product.pricing.requiresRealTimePrice) {
                    return { price: 0, priceDisplay: (product.currencySymbol ? product.currencySymbol : "") + "<span class='price-loading-spinner'></span>" };
                }
                if (product.isConfigured || product.isFixedConfiguration) {
                    var price_1 = this.getPrice(null, product.pricing.unitNetPrice, product.pricing.unitNetPriceDisplay, product.qtyOrdered);
                    return { price: price_1.price, priceDisplay: price_1.priceDisplay };
                }
                var price = this.getPrice(product.pricing.unitRegularBreakPrices, product.pricing.unitNetPrice, product.pricing.unitNetPriceDisplay, product.qtyOrdered);
                return { price: price.price, priceDisplay: price.priceDisplay };
            };
            ProductPriceService.prototype.getUnitListPrice = function (product) {
                var price = this.getPrice(product.pricing.unitListBreakPrices, product.pricing.unitListPrice, product.pricing.unitListPriceDisplay, product.qtyOrdered);
                return { price: price.price, priceDisplay: price.priceDisplay };
            };
            ProductPriceService.prototype.getPrice = function (breaks, price, priceToDisplay, qty) {
                qty = !qty || qty === "0" ? 1 : qty;
                if (this.conditionBreakPrice(breaks, qty)) {
                    return { price: price, priceDisplay: priceToDisplay };
                }
                var breakPrice = this.getBreakPrice(breaks, qty);
                if (breakPrice && (price < breakPrice.breakPrice)) {
                    return { price: price, priceDisplay: priceToDisplay };
                }
                return { price: breakPrice.breakPrice, priceDisplay: breakPrice.breakPriceDisplay };
            };
            ProductPriceService.prototype.conditionBreakPrice = function (breaks, count) {
                return !breaks || breaks.length === 0 || count === 0;
            };
            ProductPriceService.prototype.getBreakPrice = function (breaks, count) {
                if (!breaks) {
                    return null;
                }
                var copyBreaks = breaks.slice();
                copyBreaks.sort(function (a, b) { return b.breakQty - a.breakQty; });
                for (var i = 0; i < copyBreaks.length; i++) {
                    if (copyBreaks[i].breakQty <= count) {
                        return copyBreaks[i];
                    }
                }
                return copyBreaks[copyBreaks.length - 1];
            };
            return ProductPriceService;
        }());
        catalog.ProductPriceService = ProductPriceService;
        angular
            .module("insite")
            .service("productPriceService", ProductPriceService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-price.service.js.map