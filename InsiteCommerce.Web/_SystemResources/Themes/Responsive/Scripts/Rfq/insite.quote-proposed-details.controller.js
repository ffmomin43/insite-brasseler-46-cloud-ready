var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteProposedDetailsController = /** @class */ (function () {
            function QuoteProposedDetailsController(rfqService) {
                this.rfqService = rfqService;
                this.openLineNoteId = "";
            }
            QuoteProposedDetailsController.prototype.updateLine = function (quoteLine, refresh) {
                var _this = this;
                this.rfqService.updateQuoteLine(quoteLine).then(function (quoteLineResult) { _this.updateQuoteLineCompleted(quoteLineResult, quoteLine, refresh); }, function (error) { _this.updateQuoteLineFailed(error); });
            };
            QuoteProposedDetailsController.prototype.updateQuoteLineCompleted = function (quoteLineResult, quoteLine, refresh) {
                if (refresh) {
                    this.updateSubTotal();
                    quoteLine.pricing.unitNetPrice = quoteLineResult.pricing.unitNetPrice;
                    quoteLine.pricing.unitNetPriceDisplay = quoteLineResult.pricing.unitNetPriceDisplay;
                    quoteLine.pricing.extendedUnitNetPrice = quoteLineResult.pricing.extendedUnitNetPrice;
                    quoteLine.pricing.extendedUnitNetPriceDisplay = quoteLineResult.pricing.extendedUnitNetPriceDisplay;
                }
            };
            QuoteProposedDetailsController.prototype.updateQuoteLineFailed = function (error) {
            };
            QuoteProposedDetailsController.prototype.updateSubTotal = function () {
                var _this = this;
                this.rfqService.getQuote(this.quote.id).then(function (quote) { _this.getQuoteCompleted(quote); }, function (error) { _this.getQuoteFailed(error); });
            };
            QuoteProposedDetailsController.prototype.getQuoteCompleted = function (quote) {
                this.quote.orderSubTotal = quote.orderSubTotal;
                this.quote.orderSubTotalDisplay = quote.orderSubTotalDisplay;
                this.quote.quoteLineCollection = quote.quoteLineCollection;
            };
            QuoteProposedDetailsController.prototype.getQuoteFailed = function (error) {
            };
            QuoteProposedDetailsController.prototype.quantityBlur = function (event, quoteLine) {
                this.validateForm();
                var valid = $(event.target).valid();
                if (!valid) {
                    this.formValid = false;
                    return;
                }
                this.updateLine(quoteLine, true);
            };
            QuoteProposedDetailsController.prototype.quantityKeyPress = function (keyEvent, quoteLine) {
                this.validateForm();
                if (keyEvent.which === 13) {
                    var valid = $(keyEvent.target).valid();
                    if (!valid) {
                        this.formValid = false;
                        return;
                    }
                    this.updateLine(quoteLine, true);
                }
            };
            QuoteProposedDetailsController.prototype.notesKeyPress = function (keyEvent, quoteLine) {
                if (keyEvent.which === 13) {
                    this.updateLine(quoteLine, false);
                }
            };
            QuoteProposedDetailsController.prototype.notePanelClicked = function (lineId) {
                if (this.openLineNoteId === lineId) {
                    this.openLineNoteId = "";
                }
                else {
                    this.openLineNoteId = lineId;
                }
            };
            QuoteProposedDetailsController.prototype.validateForm = function () {
                var form = angular.element("#quoteDetailsForm");
                if (form && form.length !== 0) {
                    this.formValid = form.validate().form();
                }
            };
            QuoteProposedDetailsController.$inject = ["rfqService"];
            return QuoteProposedDetailsController;
        }());
        rfq.QuoteProposedDetailsController = QuoteProposedDetailsController;
        angular
            .module("insite")
            .controller("QuoteProposedDetailsController", QuoteProposedDetailsController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-proposed-details.controller.js.map