module insite.rfq {
    "use strict";

    export class QuoteProposedDetailsController {
        openLineNoteId = "";
        quote: QuoteModel;
        formValid: boolean;

        static $inject = ["rfqService"];

        constructor(protected rfqService: rfq.IRfqService) {
        }

        updateLine(quoteLine: QuoteLineModel, refresh?: boolean): void {
            this.rfqService.updateQuoteLine(quoteLine).then(
                (quoteLineResult: QuoteLineModel) => { this.updateQuoteLineCompleted(quoteLineResult, quoteLine, refresh); },
                (error: any) => { this.updateQuoteLineFailed(error); });
        }

        protected updateQuoteLineCompleted(quoteLineResult: QuoteLineModel, quoteLine: QuoteLineModel, refresh?: boolean): void {
            if (refresh) {
                this.updateSubTotal();
                quoteLine.pricing.unitNetPrice = quoteLineResult.pricing.unitNetPrice;
                quoteLine.pricing.unitNetPriceDisplay = quoteLineResult.pricing.unitNetPriceDisplay;
                quoteLine.pricing.extendedUnitNetPrice = quoteLineResult.pricing.extendedUnitNetPrice;
                quoteLine.pricing.extendedUnitNetPriceDisplay = quoteLineResult.pricing.extendedUnitNetPriceDisplay;
            }
        }

        protected updateQuoteLineFailed(error: any): void {
        }

        protected updateSubTotal(): void {
            this.rfqService.getQuote(this.quote.id).then(
                (quote: QuoteModel) => { this.getQuoteCompleted(quote); },
                (error: any) => { this.getQuoteFailed(error); });
        }

        protected getQuoteCompleted(quote: QuoteModel): void {
            this.quote.orderSubTotal = quote.orderSubTotal;
            this.quote.orderSubTotalDisplay = quote.orderSubTotalDisplay;
            this.quote.quoteLineCollection = quote.quoteLineCollection;
        }

        protected getQuoteFailed(error: any): void {
        }

        quantityBlur(event, quoteLine): void {
            this.validateForm();
            const valid = $(event.target).valid();
            if (!valid) {
                this.formValid = false;
                return;
            }
            this.updateLine(quoteLine, true);
        }

        quantityKeyPress(keyEvent, quoteLine): void {
            this.validateForm();
            if (keyEvent.which === 13) {
                const valid = $(keyEvent.target).valid();
                if (!valid) {
                    this.formValid = false;
                    return;
                }
                this.updateLine(quoteLine, true);
            }
        }

        notesKeyPress(keyEvent: KeyboardEvent, quoteLine: QuoteLineModel): void {
            if (keyEvent.which === 13) {
                this.updateLine(quoteLine, false);
            }
        }

        notePanelClicked(lineId: string): void {
            if (this.openLineNoteId === lineId) {
                this.openLineNoteId = "";
            } else {
                this.openLineNoteId = lineId;
            }
        }

        protected validateForm(): void {
            const form = angular.element("#quoteDetailsForm");
            if (form && form.length !== 0) {
                this.formValid = form.validate().form();
            }
        }
    }

    angular
        .module("insite")
        .controller("QuoteProposedDetailsController", QuoteProposedDetailsController);
}