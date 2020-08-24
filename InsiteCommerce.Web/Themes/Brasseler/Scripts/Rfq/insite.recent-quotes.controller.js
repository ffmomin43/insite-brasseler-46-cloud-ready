var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var RecentQuotesController = /** @class */ (function () {
            function RecentQuotesController(rfqService, settingsService, cartService) {
                this.rfqService = rfqService;
                this.settingsService = settingsService;
                this.cartService = cartService;
            }
            RecentQuotesController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            RecentQuotesController.prototype.getSettingsCompleted = function (settingsCollection) {
                var _this = this;
                this.quoteSettings = settingsCollection.quoteSettings;
                this.cartService.getCart().then(function (cartModel) { _this.getCartCompleted(cartModel); }, function (error) { _this.getCartFailed(error); });
            };
            RecentQuotesController.prototype.getSettingsFailed = function (error) {
            };
            RecentQuotesController.prototype.getCartCompleted = function (cartModel) {
                if (cartModel.canRequestQuote) {
                    this.getQuotes();
                }
            };
            RecentQuotesController.prototype.getCartFailed = function (error) {
            };
            RecentQuotesController.prototype.getQuotes = function () {
                var _this = this;
                this.parameters = {};
                this.parameters.pageSize = 5;
                this.rfqService.getQuotes(this.parameters, null).then(function (quotes) { _this.getQuotesCompleted(quotes); }, function (error) { _this.getQuotesFailed(error); });
            };
            RecentQuotesController.prototype.getQuotesCompleted = function (quotes) {
                this.quotes = quotes.quotes;
            };
            RecentQuotesController.prototype.getQuotesFailed = function (error) {
            };
            RecentQuotesController.$inject = ["rfqService", "settingsService", "cartService"];
            return RecentQuotesController;
        }());
        rfq.RecentQuotesController = RecentQuotesController;
        angular
            .module("insite")
            .controller("RecentQuotesController", RecentQuotesController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.recent-quotes.controller.js.map