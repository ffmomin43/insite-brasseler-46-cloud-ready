var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductPriceSavingController = /** @class */ (function () {
            function ProductPriceSavingController(productPriceService, settingsService) {
                this.productPriceService = productPriceService;
                this.settingsService = settingsService;
            }
            ProductPriceSavingController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            ProductPriceSavingController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.showSavingsAmount = settingsCollection.productSettings.showSavingsAmount;
                this.showSavingsPercent = settingsCollection.productSettings.showSavingsPercent;
            };
            ProductPriceSavingController.prototype.getSettingsFailed = function (error) {
            };
            ProductPriceSavingController.prototype.showPriceSaving = function (product) {
                var unitNetPrice = this.productPriceService.getUnitNetPrice(product);
                this.unitNetPrice = unitNetPrice.price;
                this.unitNetPriceDisplay = unitNetPrice.priceDisplay;
                var unitListPrice = this.productPriceService.getUnitListPrice(product);
                this.unitListPrice = unitListPrice.price;
                this.unitListPriceDisplay = unitListPrice.priceDisplay;
                return this.unitNetPrice < this.unitListPrice;
            };
            ProductPriceSavingController.prototype.showPriceSavingForOrderHistory = function (orderLine) {
                if (orderLine === null)
                    return false;
                this.unitNetPrice = orderLine.unitNetPrice;
                this.unitNetPriceDisplay = orderLine.unitNetPriceDisplay;
                this.unitListPrice = orderLine.unitListPrice;
                this.unitListPriceDisplay = orderLine.unitListPriceDisplay;
                return this.unitNetPrice < this.unitListPrice;
            };
            ProductPriceSavingController.prototype.getSavingsAmount = function () {
                return this.unitListPrice - this.unitNetPrice;
            };
            ProductPriceSavingController.prototype.getSavingsPercent = function () {
                return Math.round((this.unitListPrice - this.unitNetPrice) / this.unitListPrice * 100);
            };
            ProductPriceSavingController.$inject = ["productPriceService", "settingsService"];
            return ProductPriceSavingController;
        }());
        catalog.ProductPriceSavingController = ProductPriceSavingController;
        ;
        angular
            .module("insite")
            .controller("ProductPriceSavingController", ProductPriceSavingController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-price-saving.controller.js.map