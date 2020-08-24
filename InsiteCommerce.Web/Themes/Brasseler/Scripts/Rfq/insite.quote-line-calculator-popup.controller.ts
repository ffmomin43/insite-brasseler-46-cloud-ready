import BreakPriceRfqModel = Insite.Rfq.WebApi.V1.ApiModels.BreakPriceRfqModel;

module insite.rfq {
    "use strict";

    export class QuoteLineCalculatorPopupController {
        quote: QuoteModel;
        maxPriceBreaks = 5;
        quoteLine: QuoteLineModel;
        showCalculator = false;
        hasCalculationMethods = false;
        currentCalculatorLineIndex: number;
        initialBreakPricesState: BreakPriceRfqModel[];
        calculationMethod: any;
        displayMaxQty = "0";
        priceRequired = false;
        invalidPrice = false;
        invalidPercent = false;
        invalidQty = false;
        disableSubmit: boolean;

        static $inject = ["$scope", "coreService", "rfqService"];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected rfqService: rfq.IRfqService) {
        }

        $onInit(): void {
            this.$scope.$on("openLineCalculator", (event, data) => { this.onOpenLineCalculator(event, data); });
        }

        protected onOpenLineCalculator(event: ng.IAngularEvent, data: any): void {
            if (this.quoteLine && this.quoteLine.id !== data.id) {
                this.priceRequired = false;
                this.invalidPrice = false;
                this.invalidPercent = false;
            }
            this.quoteLine = data;
            this.getCurentMaxQty();
            this.initialize();
            this.showPopup();
        }

        protected initialize(): void {
            this.disableSubmit = false;
            this.showCalculator = false;
            this.currentCalculatorLineIndex = null;
            this.initialBreakPricesState = angular.copy(this.quoteLine.pricingRfq.priceBreaks);
            this.hasCalculationMethods = this.quoteLine.pricingRfq.calculationMethods &&
                this.quoteLine.pricingRfq.calculationMethods.length > 0;
        }

        protected showPopup(): void {
            this.coreService.displayModal(angular.element("#popup-quote-item"));
        }

        protected getCurentMaxQty(): void {
            const count = this.quoteLine.pricingRfq.priceBreaks.length;
            if (count !== 0) {
                const lastBreakPrice = this.quoteLine.pricingRfq.priceBreaks[count - 1];
                if (lastBreakPrice.endQty > 0) {
                    this.displayMaxQty = lastBreakPrice.endQtyDisplay;
                } else {
                    this.displayMaxQty = "Max";
                }
            }
        }

        openCalculator(index: number): void {
            if (this.quote && this.quote.calculationMethods) {
                this.calculationMethod = this.quote.calculationMethods[0];
            }
            this.showCalculator = true;
            this.currentCalculatorLineIndex = index;
        }

        cancelCalculator(index: number): void {
            this.showCalculator = false;
            this.currentCalculatorLineIndex = null;
        }

        applyBreakDiscount(index: number): void {
            const breakPrice = this.quoteLine.pricingRfq.priceBreaks[index];
            if (breakPrice.percent != null && breakPrice.percent > 0) {
                // List, Customer, Margin
                let basePrice: number;
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
        }

        addPriceBreak(): void {
            if (!this.validateQuoteLineCalculatorForm()) {
                return;
            }

            const newBreakPrice = <BreakPriceRfqModel>{};
            if (this.quoteLine.pricingRfq.priceBreaks.length !== 0) {
                const index = this.quoteLine.pricingRfq.priceBreaks.length - 1;
                const lastBreak = this.quoteLine.pricingRfq.priceBreaks[index];
                newBreakPrice.endQty = this.quoteLine.maxQty;
                if (lastBreak.endQty === 0) {
                    lastBreak.endQty = lastBreak.startQty;
                } else {
                    lastBreak.endQty = Math.round(lastBreak.endQty);
                }
                newBreakPrice.startQty = lastBreak.endQty + 1;

                lastBreak.endQtyDisplay = lastBreak.endQty.toString();
            } else {
                newBreakPrice.startQty = 1;
                newBreakPrice.endQty = this.quoteLine.maxQty;
            }

            newBreakPrice.endQtyDisplay = newBreakPrice.endQty.toString();
            this.quoteLine.pricingRfq.priceBreaks.push(newBreakPrice);
            this.getCurentMaxQty();
        }

        clearBreaks(): void {
            this.quoteLine.pricingRfq.priceBreaks = angular.copy(this.initialBreakPricesState);
            this.validateQuoteLineCalculatorForm();
        }

        qtyEndKeyPress(keyEvent, index): void {
            if (keyEvent.which === 13) {
                this.updateMaxQty(keyEvent, index);
            }
        }

        updateMaxQty(keyEvent, index): void {
            this.formatEndQty(index);

            if (!this.validateQuoteLineCalculatorForm()) {
                return;
            }

            let maxQty = 0;

            if (this.displayMaxQty !== "Max") {
                maxQty = Math.round(Number(this.displayMaxQty));

                if (isNaN(maxQty)) {
                    maxQty = 0;
                }
            }

            const lastBreak = this.quoteLine.pricingRfq.priceBreaks[index];
            if (maxQty && maxQty > 0) {

                if (maxQty < lastBreak.startQty) {
                    maxQty = lastBreak.startQty;
                }

                lastBreak.endQty = maxQty;
                lastBreak.endQtyDisplay = maxQty.toString();
                this.displayMaxQty = lastBreak.endQtyDisplay;
            } else {
                if (keyEvent) {
                    this.displayMaxQty = keyEvent.target.attributes["data-attr-name"].value;
                    lastBreak.endQty = maxQty;
                    lastBreak.endQtyDisplay = maxQty.toString();
                }
            }
        }

        protected formatStartQty(index): void {
            let numValue = Math.round(Number(this.quoteLine.pricingRfq.priceBreaks[index].startQty));

            if (isNaN(numValue)) {
                numValue = 0;
            }

            if (index > 0 && numValue > 0) {
                this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty = numValue - 1;
                this.quoteLine.pricingRfq.priceBreaks[index - 1].endQtyDisplay = this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty.toString();
            }

            this.quoteLine.pricingRfq.priceBreaks[index].startQty = numValue;
        }

        protected formatEndQty(index): void {
            let numValue = Math.round(Number(this.displayMaxQty));

            if (isNaN(numValue)) {
                numValue = 0;
            }

            this.quoteLine.pricingRfq.priceBreaks[index].endQty = numValue;
            this.displayMaxQty = numValue !== 0 ? numValue.toString() : "Max";
            this.quoteLine.pricingRfq.priceBreaks[index].endQtyDisplay = this.displayMaxQty;
        }

        startQtyChanged(index): void {
            this.formatStartQty(index);

            if (!this.validateQuoteLineCalculatorForm()) {
                return;
            }
        }

        removeLine(index): void {
            if (index === this.currentCalculatorLineIndex) {
                this.cancelCalculator(index);
            }

            if (index !== 0) {
                this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty = this.quoteLine.pricingRfq.priceBreaks[index].endQty;
                this.quoteLine.pricingRfq.priceBreaks[index - 1].endQtyDisplay = this.quoteLine.pricingRfq.priceBreaks[index - 1].endQty.toString();
            }

            this.quoteLine.pricingRfq.priceBreaks.splice(index, 1);
            this.validateQuoteLineCalculatorForm();
        }

        applyQuoteBreaks(): void {
            if (!this.validateQuoteLineCalculatorForm()) {
                return;
            }
            this.disableSubmit = true;
            const quoteLine = {} as QuoteLineModel;
            quoteLine.id = this.quoteLine.id;
            quoteLine.uri = this.quoteLine.uri;
            quoteLine.pricingRfq = this.quoteLine.pricingRfq;
            if (this.quote.isJobQuote) {
                this.setPriceBreaksForJobQuote(quoteLine);
            }
            this.rfqService.updateQuoteLine(quoteLine).then(
                (result: QuoteLineModel) => { this.updateQuoteLineCompleted(result); },
                (error: any) => { this.updateQuoteLineFailed(error); });
        }

        protected updateQuoteLineCompleted(quoteLineModel: QuoteLineModel): void {
            const index = this.quote.quoteLineCollection.indexOf(this.quoteLine);
            this.quote.quoteLineCollection[index].pricing = quoteLineModel.pricing;
            this.quote.quoteLineCollection[index].pricingRfq = quoteLineModel.pricingRfq;
            this.quote.quoteLineCollection[index].maxQty = quoteLineModel.maxQty;
            this.coreService.closeModal("#popup-quote-item");
        }

        protected updateQuoteLineFailed(error: any): void {
            this.disableSubmit = false;
        }

        protected setPriceBreaksForJobQuote(quoteLine: QuoteLineModel): void {
            quoteLine.pricingRfq.priceBreaks = this.quoteLine.pricingRfq.priceBreaks.filter(x => this.shouldShowPriceBreak(x));
        }

        priceIsValid(index: number): boolean {
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
        }

        percentIsValid(index: number): boolean {
            if (this.quoteLine.pricingRfq.priceBreaks[index].percent && this.quoteLine.pricingRfq.priceBreaks[index] && this.calculationMethod.maximumDiscount > 0
                && this.quoteLine.pricingRfq.priceBreaks[index].percent * 1 > this.calculationMethod.maximumDiscount
                || this.calculationMethod && this.quoteLine.pricingRfq.priceBreaks[index].percent * 1 < this.calculationMethod.minimumMargin) {
                this.invalidPercent = true;
                return false;
            }

            return true;
        }

        startQtyIsValid(index: number): boolean {
            let result = true;

            if (index === 0) {
                if (!isNaN(this.quoteLine.pricingRfq.priceBreaks[0].startQty)
                    && this.quoteLine.pricingRfq.priceBreaks[0].startQty !== 1) {
                    this.invalidQty = true;
                    result = false;
                }
            } else {
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
        }

        endQtyIsValid(index: number): boolean {
            let result = true;

            if ((index === this.quoteLine.pricingRfq.priceBreaks.length - 1)
                && !isNaN(Number(this.displayMaxQty))
                && Number(this.displayMaxQty) < this.quoteLine.pricingRfq.priceBreaks[this.quoteLine.pricingRfq.priceBreaks.length - 1].startQty) {
                this.invalidQty = true;
                result = false;
            }

            return result;
        }

        validateQuoteLineCalculatorForm(): boolean {
            this.priceRequired = false;
            this.invalidPrice = false;
            this.invalidPercent = false;
            this.invalidQty = false;

            if (this.quoteLine) {
                for (let i = 0; i < this.quoteLine.pricingRfq.priceBreaks.length; i++) {
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
        }

        shouldShowPriceBreak(priceBreak): boolean {
            if (!this.quote || !this.quoteLine) {
                return false;
            }

            if (this.quote.isJobQuote) {
                return this.quoteLine.pricingRfq.priceBreaks.slice().sort((a, b) => b.startQty - a.startQty).filter(x => x.startQty <= this.quoteLine.qtyOrdered)[0].startQty === priceBreak.startQty;
            }

            return true;
        }

        closeModal(selector: string): void {
            this.quoteLine.pricingRfq.priceBreaks = angular.copy(this.initialBreakPricesState);
            this.coreService.closeModal(selector);
        }
    }

    angular
        .module("insite")
        .controller("QuoteLineCalculatorPopupController", QuoteLineCalculatorPopupController);
}