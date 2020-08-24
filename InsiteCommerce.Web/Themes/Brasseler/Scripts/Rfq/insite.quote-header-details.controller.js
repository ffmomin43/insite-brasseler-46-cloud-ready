var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteHeaderDetailsController = /** @class */ (function () {
            function QuoteHeaderDetailsController(rfqService, settingsService) {
                this.rfqService = rfqService;
                this.settingsService = settingsService;
            }
            QuoteHeaderDetailsController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            QuoteHeaderDetailsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.quoteExpireDays = settingsCollection.quoteSettings.quoteExpireDays;
            };
            QuoteHeaderDetailsController.prototype.getSettingsFailed = function (error) {
            };
            QuoteHeaderDetailsController.$inject = ["rfqService", "settingsService"];
            return QuoteHeaderDetailsController;
        }());
        rfq.QuoteHeaderDetailsController = QuoteHeaderDetailsController;
        angular
            .module("insite")
            .controller("QuoteHeaderDetailsController", QuoteHeaderDetailsController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-header-details.controller.js.map