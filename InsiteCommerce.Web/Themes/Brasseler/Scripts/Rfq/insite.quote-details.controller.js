var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteDetailsController = /** @class */ (function () {
            function QuoteDetailsController($rootScope, coreService, rfqService, cartService, quotePastExpirationDatePopupService, queryString, $scope, $window, settingsService, productService) {
                this.$rootScope = $rootScope;
                this.coreService = coreService;
                this.rfqService = rfqService;
                this.cartService = cartService;
                this.quotePastExpirationDatePopupService = quotePastExpirationDatePopupService;
                this.queryString = queryString;
                this.$scope = $scope;
                this.$window = $window;
                this.settingsService = settingsService;
                this.productService = productService;
                this.openLineNoteId = "";
                this.formValid = false;
                this.realTimePricing = false;
                this.failedToGetRealTimePrices = false;
            }
            QuoteDetailsController.prototype.$onInit = function () {
                var _this = this;
                this.quoteId = this.getQuoteId();
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
                this.validateForm();
                this.$scope.$on("submitQuote", function (event, url) {
                    _this.doSubmitQuote(url);
                });
            };
            QuoteDetailsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.realTimePricing = settingsCollection.productSettings.realTimePricing;
                this.getQuote();
            };
            QuoteDetailsController.prototype.getSettingsFailed = function (error) {
            };
            QuoteDetailsController.prototype.getCartCompleted = function (cart) {
                this.cart = cart;
                this.isCartEmpty = cart.lineCount === 0;
            };
            QuoteDetailsController.prototype.getCartFailed = function (error) {
            };
            QuoteDetailsController.prototype.getQuoteId = function () {
                return this.queryString.get("quoteId");
            };
            QuoteDetailsController.prototype.getQuote = function () {
                var _this = this;
                this.rfqService.getQuote(this.quoteId).then(function (quote) { _this.getQuoteCompleted(quote); }, function (error) { _this.getQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.getQuoteCompleted = function (quote) {
                var _this = this;
                this.quote = quote;
                if (this.quote && this.quote.calculationMethods && this.quote.calculationMethods.length > 0) {
                    this.calculationMethod = this.quote.calculationMethods[0];
                    this.changeCalculationMethod();
                }
                if (this.realTimePricing && this.quote.quoteLineCollection && this.quote.quoteLineCollection.length > 0) {
                    var products = this.quote.quoteLineCollection
                        .filter(function (o) { return !o.pricing || o.pricing && o.pricing.requiresRealTimePrice; })
                        .map(function (o) { return ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure }); });
                    if (products.length === 0) {
                        return;
                    }
                    this.productService.getProductRealTimePrices(products).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            QuoteDetailsController.prototype.getQuoteFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            QuoteDetailsController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
                var _this = this;
                realTimePricing.realTimePricingResults.forEach(function (productPrice) {
                    var quoteLine = _this.quote.quoteLineCollection.find(function (o) { return o.productId === productPrice.productId && o.unitOfMeasure === productPrice.unitOfMeasure; });
                    quoteLine.pricing = productPrice;
                });
            };
            QuoteDetailsController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
                this.quote.cartNotPriced = true;
            };
            QuoteDetailsController.prototype.acceptCheckout = function (url) {
                this.validateForm();
                if (!this.formValid) {
                    return;
                }
                if (!this.isCartEmpty) {
                    angular.element("#rfqPopupCartNotificationLink").trigger("click");
                }
                else {
                    this.continueCheckout(url);
                }
            };
            QuoteDetailsController.prototype.acceptJobQuote = function (url) {
                var _this = this;
                this.validateForm();
                if (!this.formValid) {
                    return;
                }
                if (!this.validateExpirationDateForm()) {
                    return;
                }
                var acceptQuote = {
                    quoteId: this.quoteId,
                    status: "JobAccepted",
                    expirationDate: this.quote.expirationDate
                };
                this.rfqService.updateQuote(acceptQuote).then(function (quote) { _this.acceptJobQuoteCompleted(quote, url); }, function (error) { _this.acceptJobQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.acceptJobQuoteCompleted = function (quote, url) {
                this.coreService.redirectToPath(url);
            };
            QuoteDetailsController.prototype.acceptJobQuoteFailed = function (error) {
            };
            QuoteDetailsController.prototype.continueCheckout = function (url) {
                url += this.quoteId;
                this.coreService.redirectToPath(url);
            };
            QuoteDetailsController.prototype.declineQuote = function (returnUrl) {
                var _this = this;
                var declineQoute = {
                    quoteId: this.quoteId,
                    status: "QuoteRejected",
                    expirationDate: this.quote.expirationDate
                };
                this.rfqService.updateQuote(declineQoute).then(function (quote) { _this.declineQuoteCompleted(quote, returnUrl); }, function (error) { _this.declineQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.declineQuoteCompleted = function (quote, returnUrl) {
                this.redirectToPathOrReturnBack(returnUrl);
            };
            QuoteDetailsController.prototype.declineQuoteFailed = function (error) {
            };
            QuoteDetailsController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            QuoteDetailsController.prototype.submitQuote = function (url) {
                if (!this.validateExpirationDateForm()) {
                    return;
                }
                if (this.expirationDateIsLessThanCurrentDate()) {
                    this.quotePastExpirationDatePopupService.display({ url: url });
                }
                else {
                    this.doSubmitQuote(url);
                }
            };
            QuoteDetailsController.prototype.doSubmitQuote = function (url) {
                var _this = this;
                var submitQuote = {
                    quoteId: this.quoteId,
                    status: "QuoteProposed",
                    expirationDate: this.quote.expirationDate
                };
                this.rfqService.updateQuote(submitQuote).then(function (quote) { _this.submitQuoteCompleted(quote, url); }, function (error) { _this.submitQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.submitQuoteCompleted = function (quote, url) {
                this.redirectToPathOrReturnBack(url);
            };
            QuoteDetailsController.prototype.submitQuoteFailed = function (error) {
            };
            QuoteDetailsController.prototype.applyQuote = function () {
                var _this = this;
                if (!this.validateQuoteCalculatorForm()) {
                    return;
                }
                var applyQuote = {
                    quoteId: this.quoteId,
                    calculationMethod: this.calculationMethod.name,
                    percent: this.percent,
                    expirationDate: this.quote.expirationDate
                };
                this.rfqService.updateQuote(applyQuote).then(function (quote) { _this.applyQuoteCompleted(quote); }, function (error) { _this.applyQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.applyQuoteCompleted = function (quote) {
                this.quote.quoteLineCollection = quote.quoteLineCollection;
                this.closeModal("#orderCalculator");
            };
            QuoteDetailsController.prototype.applyQuoteFailed = function (error) {
                if (error && error.message) {
                    var form = this.getQuoteCalculatorForm();
                    if (form && form.length !== 0) {
                        form.validate().showErrors({ "percent": error.message });
                    }
                }
            };
            QuoteDetailsController.prototype.deleteQuote = function (returnUrl) {
                var _this = this;
                this.rfqService.removeQuote(this.quoteId).then(function (quote) { _this.deleteQuoteCompleted(quote, returnUrl); }, function (error) { _this.deleteQuoteFailed(error); });
            };
            QuoteDetailsController.prototype.deleteQuoteCompleted = function (quote, returnUrl) {
                this.redirectToPathOrReturnBack(returnUrl);
            };
            QuoteDetailsController.prototype.deleteQuoteFailed = function (error) {
            };
            QuoteDetailsController.prototype.redirectToPathOrReturnBack = function (returnUrl) {
                // this will restore history state with filter and etc
                if (this.coreService.getReferringPath() === returnUrl) {
                    this.$window.history.back();
                }
                else {
                    this.coreService.redirectToPath(returnUrl);
                }
            };
            QuoteDetailsController.prototype.changeCalculationMethod = function () {
                this.maximumDiscount = this.calculationMethod.maximumDiscount > 0 ? this.calculationMethod.maximumDiscount : false;
                this.minimumMargin = 0;
                for (var i = 0; i < this.quote.quoteLineCollection.length; i++) {
                    var minLineMargin = 100 - (this.quote.quoteLineCollection[i].pricingRfq.unitCost * 100 / this.quote.quoteLineCollection[i].pricingRfq.minimumPriceAllowed);
                    this.minimumMargin = minLineMargin > this.minimumMargin ? minLineMargin : this.minimumMargin;
                }
                this.minimumMargin = this.calculationMethod.minimumMargin > 0 ? this.minimumMargin > this.calculationMethod.minimumMargin ? this.minimumMargin : this.calculationMethod.minimumMargin : 0;
                $("#rfqApplyOrderQuoteForm input").data("rule-min", this.minimumMargin);
                $("#rfqApplyOrderQuoteForm input").data("rule-max", this.maximumDiscount > 0 ? (this.maximumDiscount * 1) : "false");
            };
            QuoteDetailsController.prototype.openOrderLineCalculatorPopup = function (quoteLine) {
                this.$rootScope.$broadcast("openLineCalculator", quoteLine);
            };
            QuoteDetailsController.prototype.validateForm = function () {
                var form = angular.element("#quoteDetailsForm");
                if (form && form.length !== 0) {
                    this.formValid = form.validate().form();
                }
            };
            QuoteDetailsController.prototype.validateExpirationDateForm = function () {
                var form = angular.element("#updateExpirationDate");
                if (form && form.length !== 0) {
                    return form.validate().form();
                }
                return true;
            };
            QuoteDetailsController.prototype.getQuoteCalculatorForm = function () {
                return angular.element("#rfqApplyOrderQuoteForm");
            };
            QuoteDetailsController.prototype.validateQuoteCalculatorForm = function () {
                var form = this.getQuoteCalculatorForm();
                if (form && form.length !== 0) {
                    var validator = form.validate({
                        errorLabelContainer: "#rfqApplyOrderQuoteFormError"
                    });
                    validator.resetForm();
                    return form.validate().form();
                }
                return true;
            };
            QuoteDetailsController.prototype.expirationDateIsLessThanCurrentDate = function () {
                if (!this.quote) {
                    return true;
                }
                var expirationDate = new Date(this.quote.expirationDate.toString());
                var currentDate = new Date();
                expirationDate.setHours(0, 0, 0, 0);
                currentDate.setHours(0, 0, 0, 0);
                return expirationDate < currentDate;
            };
            QuoteDetailsController.prototype.resetValidationCalculatorForm = function () {
                var form = angular.element("#rfqApplyOrderQuoteForm");
                if (form && form.length !== 0) {
                    var validator = form.validate();
                    validator.resetForm();
                }
            };
            QuoteDetailsController.prototype.getPriceForJobQuote = function (priceBreaks, qtyOrdered) {
                return priceBreaks.slice().sort(function (a, b) { return b.startQty - a.startQty; }).filter(function (x) { return x.startQty <= qtyOrdered; })[0].priceDispaly;
            };
            QuoteDetailsController.$inject = [
                "$rootScope",
                "coreService",
                "rfqService",
                "cartService",
                "quotePastExpirationDatePopupService",
                "queryString",
                "$scope",
                "$window",
                "settingsService",
                "productService"
            ];
            return QuoteDetailsController;
        }());
        rfq.QuoteDetailsController = QuoteDetailsController;
        angular
            .module("insite")
            .controller("QuoteDetailsController", QuoteDetailsController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-details.controller.js.map