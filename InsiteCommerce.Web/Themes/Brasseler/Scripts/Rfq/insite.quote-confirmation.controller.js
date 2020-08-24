var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteConfirmationController = /** @class */ (function () {
            function QuoteConfirmationController(rfqService, queryString, settingsService, productService) {
                this.rfqService = rfqService;
                this.queryString = queryString;
                this.settingsService = settingsService;
                this.productService = productService;
                this.realTimePricing = false;
                this.failedToGetRealTimePrices = false;
            }
            QuoteConfirmationController.prototype.$onInit = function () {
                var _this = this;
                this.rfqService.expand = "billTo";
                this.confirmedOrderId = this.getConfirmedOrderId();
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            QuoteConfirmationController.prototype.getConfirmedOrderId = function () {
                return this.queryString.get("cartid");
            };
            QuoteConfirmationController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.realTimePricing = settingsCollection.productSettings.realTimePricing;
                this.getQuote();
            };
            QuoteConfirmationController.prototype.getSettingsFailed = function (error) {
            };
            QuoteConfirmationController.prototype.getQuote = function () {
                var _this = this;
                this.rfqService.getQuote(this.confirmedOrderId).then(function (quote) { _this.getQuoteCompleted(quote); }, function (error) { _this.getQuoteFailed(error); });
            };
            QuoteConfirmationController.prototype.getQuoteCompleted = function (quote) {
                var _this = this;
                this.quote = quote;
                this.quote.cartLines = this.quote.quoteLineCollection;
                if (this.realTimePricing && this.quote.cartLines && this.quote.cartLines.length > 0) {
                    var products = this.quote.cartLines.map(function (o) { return ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure }); });
                    this.productService.getProductRealTimePrices(products).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            QuoteConfirmationController.prototype.getQuoteFailed = function (error) {
            };
            QuoteConfirmationController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
                var _this = this;
                realTimePricing.realTimePricingResults.forEach(function (productPrice) {
                    var quoteLine = _this.quote.cartLines.find(function (o) { return o.productId === productPrice.productId && o.unitOfMeasure === productPrice.unitOfMeasure; });
                    quoteLine.pricing = productPrice;
                });
            };
            QuoteConfirmationController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
                this.quote.cartNotPriced = true;
            };
            QuoteConfirmationController.$inject = ["rfqService", "queryString", "settingsService", "productService"];
            return QuoteConfirmationController;
        }());
        rfq.QuoteConfirmationController = QuoteConfirmationController;
        angular
            .module("insite")
            .controller("QuoteConfirmationController", QuoteConfirmationController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-confirmation.controller.js.map