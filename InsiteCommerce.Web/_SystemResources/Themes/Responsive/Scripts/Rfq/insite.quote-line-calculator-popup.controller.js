var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteLineCalculatorPopupController = /** @class */ (function () {
            function QuoteLineCalculatorPopupController($scope, coreService, rfqService) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.rfqService = rfqService;
                this.maxPriceBreaks = 5;
                this.showCalculator = false;
                this.hasCalculationMethods = false;
                this.displayMaxQty = "0";
                this.priceRequired = false;
                this.invalidPrice = false;
                this.invalidPercent = false;
                this.invalidQty = false;
            }
            QuoteLineCalculatorPopupController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("openLineCalculator", function (event, data) { _this.onOpenLineCalculator(event, data); });
            };
            QuoteLineCalculatorPopupController.prototype.onOpenLineCalculator = function (event, data) {
                if (this.quoteLine && this.quoteLine.id !== data.id) {
                    this.priceRequired = false;
                    this.invalidPrice = false;
                    this.invalidPercent = false;
                }
                this.quoteLine = data;
                this.getCurentMaxQty();
                this.initialize();
                this.showPopup();
            };
            QuoteLineCalculatorPopupController.prototype.initialize = function () {
                this.disableSubmit = false;
                this.showCalculator = false;
                this.currentCalculatorLineIndex = null;
                this.initialBreakPricesState = angular.copy(this.quoteLine.pricingRfq.priceBreaks);
                this.hasCalculationMethods = this.quoteLine.pricingRfq.calculationMethods &&
                    this.quoteLine.pricingRfq.calculationMethods.length > 0;
            };
            QuoteLineCalculatorPopupController.prototype.showPopup = function () {
                this.coreService.displayModal(angular.element("#popup-quote-item"));
            };
            QuoteLineCalculatorPopupController.prototype.getCurentMaxQty = function () {
                var count = this.quoteLine.pricingRfq.priceBreaks.length;
                if (count !== 0) {
                    var lastBreakPrice = this.quoteLine.pricingRfq.priceBreaks[count - 1];
                    if (lastBreakPrice.endQty > 0) {
                        this.displayMaxQty = lastBreakPrice.endQtyDisplay;
                    }
                    else {
                        this.displayMaxQty = "Max";
                    }
                }
            };
            QuoteLineCalculatorPopupController.prototype.openCalculator = function (index) {
                if (this.quote && this.quote.calculationMethods) {
                    this.calculationMethod = this.quote.calculationMethods[0];
                }
                this.showCalculator = true;
                this.currentCalculatorLineIndex = index;
            };
            QuoteLineCalculatorPopupController.prototype.cancelCalculator = function (index) {
                this.showCalculator = false;
                this.currentCalculatorLineIndex = null;
            };
            QuoteLineCalculatorPopupController.prototype.applyBreakDiscount = function (index) {
                var breakPrice = this.quoteLine.pricingRfq.priceBreaks[index];
                if (breakPrice.percent != null && breakPrice.percent > 0) {
                    // List, Customer, Margin
                    var basePrice = void 0;
                    if (this.calculationMethod.value === "List") {
                        basePrice = this.quoteLine.pricingRfq.listPrice;
                        breakPrice.price = basePrice - ((breakPrice.percent / 100) * basePrice);
                    }
                    if (this.calculationMethod.value === "Customer") {
                        basePrice = this.quoteLine.pricingRfq.customerPrice;
                        breakPrice.price = basePrice - ((breakPrice.percent / 100) * basePrice);
                    }
                    if (this.calculationMethod.value === "Margin") {
                        basePrice = this.quoteLine.pricingRfq.unitCost;
                        breakPrice.price = basePrice === 0 ? -1 : basePrice / (1 - breakPrice.percent / 100);
                    }
                    breakPrice.calculationMethod = this.calculationMethod.value;
                    breakPrice.price = parseFloat(breakPrice.price.toFixed(2));
                    this.validateQuoteLineCalculatorForm();
                }
            };
            QuoteLineCalculatorPopupController.prototype.addPriceBreak = function () {
                if (!this.validateQuoteLineCalculatorForm()) {
                    return;
                }
                var newBreakPrice = {};
                if (this.quoteLine.pricingRfq.priceBreaks.length !== 0) {
                    var index = this.quoteLine.pricingRfq.priceBreaks.length - 1;
                    var lastBreak = this.quoteLine.pricingRfq.priceBreaks[index];
                    newBreakPrice.endQty = this.quoteLine.maxQty;
                    if (lastBreak.endQty === 0) {
                        lastBreak.endQty = lastBreak.startQty;
                    }
                    else {
                        lastBreak.endQty = Math.round(lastBreak.endQty);
                    }
                    newBreakPrice.startQty = lastBreak.endQty + 1;
                    lastBreak.endQtyDisplay = lastBreak.endQty.toString();
                }
                else {
                    newBreakPrice.startQty = 1;
                    newBreakPrice.endQty = this.quoteLine.maxQty;
                }
                newBreakPrice.endQtyDisplay = newBreakPrice.endQty.toString();
                this.quoteLine.pricingRfq.priceBreaks.push(newBreakPrice);
                this.getCurentMaxQty();
            };
            QuoteLineCalculatorPopupController.prototype.clearBreaks = function () {
                this.quoteLine.pricingRfq.priceBreaks = angular.copy(this.initialBreakPricesState);
                this.validateQuoteLineCalculatorForm();
            };
            QuoteLineCalculatorPopupController.prototype.qtyEndKeyPress = function (keyEvent, index) {
                if (keyEvent.which === 13) {
                    this.updateMaxQty(keyEvent, index);
                }
            };
            QuoteLineCalculatorPopupController.prototype.updateMaxQty = function (keyEvent, index) {
                this.formatEndQty(index);
                if (!this.validateQuoteLineCalculatorForm()) {
                    return;
                }
                var maxQty = 0;
                if (this.displayMaxQty !== "Max") {
                    maxQty = Math.round(Number(this.displayMaxQty));
                    if (isNaN(maxQty)) {
                        maxQty = 0;
                    }
                }
                var lastBreak = this.quoteLine.pricingRfq.priceBreaks[index];
                if (maxQty && maxQty > 0) {
                    if (maxQty < lastBreak.startQty) {
                        maxQty = lastBreak.startQty;
                    }
                    lastBreak.endQty = maxQty;
                    lastBreak.endQtyDisplay = maxQty.toString();
                    this.displayMaxQty = lastBreak.endQtyDisplay;
                }
                else {
                    if (keyEvent) {
                        this.displayMaxQty = keyEvent.target.attributes["data-attr-name"].value;
                        lastBreak.endQty = maxQty;
                        lastBreak.endQtyDisplay = maxQty.toString();
                    }
                }
            };
            QuoteLineCalculatorPopupController.prototype.formatStartQty = function (index) {
                var numValue = Math.round(Number(this.quoteLine.pricingRfq.priceBreaks[index].startQty));
                if (isNaN(numValue)) {
                    numValue = 0;
                }
                if (index > 0 && numValue > 0) {
                    this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty = numValue - 1;
                    this.quoteLine.pricingRfq.priceBreaks[index - 1].endQtyDisplay = this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty.toString();
                }
                this.quoteLine.pricingRfq.priceBreaks[index].startQty = numValue;
            };
            QuoteLineCalculatorPopupController.prototype.formatEndQty = function (index) {
                var numValue = Math.round(Number(this.displayMaxQty));
                if (isNaN(numValue)) {
                    numValue = 0;
                }
                this.quoteLine.pricingRfq.priceBreaks[index].endQty = numValue;
                this.displayMaxQty = numValue !== 0 ? numValue.toString() : "Max";
                this.quoteLine.pricingRfq.priceBreaks[index].endQtyDisplay = this.displayMaxQty;
            };
            QuoteLineCalculatorPopupController.prototype.startQtyChanged = function (index) {
                this.formatStartQty(index);
                if (!this.validateQuoteLineCalculatorForm()) {
                    return;
                }
            };
            QuoteLineCalculatorPopupController.prototype.removeLine = function (index) {
                if (index === this.currentCalculatorLineIndex) {
                    this.cancelCalculator(index);
                }
                if (index !== 0) {
                    this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty = this.quoteLine.pricingRfq.priceBreaks[index].endQty;
                    this.quoteLine.pricingRfq.priceBreaks[index - 1].endQtyDisplay = this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty.toString();
                }
                this.quoteLine.pricingRfq.priceBreaks.splice(index, 1);
                this.validateQuoteLineCalculatorForm();
            };
            QuoteLineCalculatorPopupController.prototype.applyQuoteBreaks = function () {
                var _this = this;
                if (!this.validateQuoteLineCalculatorForm()) {
                    return;
                }
                this.disableSubmit = true;
                var quoteLine = {};
                quoteLine.id = this.quoteLine.id;
                quoteLine.uri = this.quoteLine.uri;
                quoteLine.pricingRfq = this.quoteLine.pricingRfq;
                if (this.quote.isJobQuote) {
                    this.setPriceBreaksForJobQuote(quoteLine);
                }
                this.rfqService.updateQuoteLine(quoteLine).then(function (result) { _this.updateQuoteLineCompleted(result); }, function (error) { _this.updateQuoteLineFailed(error); });
            };
            QuoteLineCalculatorPopupController.prototype.updateQuoteLineCompleted = function (quoteLineModel) {
                var index = this.quote.quoteLineCollection.indexOf(this.quoteLine);
                this.quote.quoteLineCollection[index].pricing = quoteLineModel.pricing;
                this.quote.quoteLineCollection[index].pricingRfq = quoteLineModel.pricingRfq;
                this.quote.quoteLineCollection[index].maxQty = quoteLineModel.maxQty;
                this.coreService.closeModal("#popup-quote-item");
            };
            QuoteLineCalculatorPopupController.prototype.updateQuoteLineFailed = function (error) {
                this.disableSubmit = false;
            };
            QuoteLineCalculatorPopupController.prototype.setPriceBreaksForJobQuote = function (quoteLine) {
                var _this = this;
                quoteLine.pricingRfq.priceBreaks = this.quoteLine.pricingRfq.priceBreaks.filter(function (x) { return _this.shouldShowPriceBreak(x); });
            };
            QuoteLineCalculatorPopupController.prototype.priceIsValid = function (index) {
                if (typeof (this.quoteLine.pricingRfq.priceBreaks[index].price) === "undefined" || this.quoteLine.pricingRfq.priceBreaks[index].price.toString() === "" || isNaN(this.quoteLine.pricingRfq.priceBreaks[index].price)) {
                    this.priceRequired = true;
                    return false;
                }
                if (this.quoteLine.pricingRfq.minimumPriceAllowed > 0 && this.quoteLine.pricingRfq.priceBreaks[index].price < this.quoteLine.pricingRfq.minimumPriceAllowed
                    || this.quoteLine.pricingRfq.priceBreaks[index].price < 0) {
                    this.invalidPrice = true;
                    return false;
                }
                return true;
            };
            QuoteLineCalculatorPopupController.prototype.percentIsValid = function (index) {
                if (this.quoteLine.pricingRfq.priceBreaks[index].percent && this.quoteLine.pricingRfq.priceBreaks[index] && this.calculationMethod.maximumDiscount > 0
                    && this.quoteLine.pricingRfq.priceBreaks[index].percent * 1 > this.calculationMethod.maximumDiscount
                    || this.calculationMethod && this.quoteLine.pricingRfq.priceBreaks[index].percent * 1 < this.calculationMethod.minimumMargin) {
                    this.invalidPercent = true;
                    return false;
                }
                return true;
            };
            QuoteLineCalculatorPopupController.prototype.startQtyIsValid = function (index) {
                var result = true;
                if (index === 0) {
                    if (!isNaN(this.quoteLine.pricingRfq.priceBreaks[0].startQty)
                        && this.quoteLine.pricingRfq.priceBreaks[0].startQty !== 1) {
                        this.invalidQty = true;
                        result = false;
                    }
                }
                else {
                    if (this.quoteLine.pricingRfq.priceBreaks[index].startQty <= this.quoteLine.pricingRfq.priceBreaks[index - 1].startQty
                        || this.quoteLine.pricingRfq.priceBreaks[index].startQty < this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty) {
                        this.invalidQty = true;
                        result = false;
                    }
                    if ((index === this.quoteLine.pricingRfq.priceBreaks.length - 1)
                        && !isNaN(this.quoteLine.pricingRfq.priceBreaks[this.quoteLine.pricingRfq.priceBreaks.length - 1].startQty)
                        && Number(this.displayMaxQty) < this.quoteLine.pricingRfq.priceBreaks[this.quoteLine.pricingRfq.priceBreaks.length - 1].startQty) {
                        this.invalidQty = true;
                        result = false;
                    }
                }
                return result;
            };
            QuoteLineCalculatorPopupController.prototype.endQtyIsValid = function (index) {
                var result = true;
                if ((index === this.quoteLine.pricingRfq.priceBreaks.length - 1)
                    && !isNaN(Number(this.displayMaxQty))
                    && Number(this.displayMaxQty) < this.quoteLine.pricingRfq.priceBreaks[this.quoteLine.pricingRfq.priceBreaks.length - 1].startQty) {
                    this.invalidQty = true;
                    result = false;
                }
                return result;
            };
            QuoteLineCalculatorPopupController.prototype.validateQuoteLineCalculatorForm = function () {
                this.priceRequired = false;
                this.invalidPrice = false;
                this.invalidPercent = false;
                this.invalidQty = false;
                if (this.quoteLine) {
                    for (var i = 0; i < this.quoteLine.pricingRfq.priceBreaks.length; i++) {
                        if (!this.shouldShowPriceBreak(this.quoteLine.pricingRfq.priceBreaks[i])) {
                            continue;
                        }
                        this.priceIsValid(i);
                        this.percentIsValid(i);
                        if (!this.quote.isJobQuote) {
                            this.startQtyIsValid(i);
                        }
                    }
                }
                return !this.priceRequired && !this.invalidPrice && !this.invalidPercent && !this.invalidQty;
            };
            QuoteLineCalculatorPopupController.prototype.shouldShowPriceBreak = function (priceBreak) {
                var _this = this;
                if (!this.quote || !this.quoteLine) {
                    return false;
                }
                if (this.quote.isJobQuote) {
                    return this.quoteLine.pricingRfq.priceBreaks.slice().sort(function (a, b) { return b.startQty - a.startQty; }).filter(function (x) { return x.startQty <= _this.quoteLine.qtyOrdered; })[0].startQty === priceBreak.startQty;
                }
                return true;
            };
            QuoteLineCalculatorPopupController.prototype.closeModal = function (selector) {
                this.quoteLine.pricingRfq.priceBreaks = angular.copy(this.initialBreakPricesState);
                this.coreService.closeModal(selector);
            };
            QuoteLineCalculatorPopupController.$inject = ["$scope", "coreService", "rfqService"];
            return QuoteLineCalculatorPopupController;
        }());
        rfq.QuoteLineCalculatorPopupController = QuoteLineCalculatorPopupController;
        angular
            .module("insite")
            .controller("QuoteLineCalculatorPopupController", QuoteLineCalculatorPopupController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-line-calculator-popup.controller.js.map