module insite.rfq {
    "use strict";

    export class QuoteDetailsController {
        quoteId: string;
        openLineNoteId = "";
        cart: CartModel;
        isCartEmpty: boolean;
        quote: QuoteModel;
        formValid = false;
        calculationMethod: any;
        percent: number;
        minimumMargin: number;
        maximumDiscount: any;
        validationMessage: string;
        realTimePricing = false;
        failedToGetRealTimePrices = false;

        static $inject = [
            "$rootScope",
            "coreService",
            "rfqService",
            "cartService",
            "quotePastExpirationDatePopupService",
            "queryString",
            "$scope",
            "$window",
            "settingsService",
            "productService"];

        constructor(
            protected $rootScope: ng.IScope,
            protected coreService: core.ICoreService,
            protected rfqService: rfq.IRfqService,
            protected cartService: cart.ICartService,
            protected quotePastExpirationDatePopupService: rfq.QuotePastExpirationDatePopupService,
            protected queryString: common.IQueryStringService,
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected settingsService: core.ISettingsService,
            protected productService: catalog.IProductService) {
        }

        $onInit(): void {
            this.quoteId = this.getQuoteId();

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });

            this.validateForm();

            this.$scope.$on("submitQuote", (event, url: string) => {
                this.doSubmitQuote(url);
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.realTimePricing = settingsCollection.productSettings.realTimePricing;
            this.getQuote();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cart = cart;
            this.isCartEmpty = cart.lineCount === 0;
        }

        protected getCartFailed(error: any): void {
        }

        protected getQuoteId(): string {
            return this.queryString.get("quoteId");
        }

        protected getQuote(): void {
            this.rfqService.getQuote(this.quoteId).then(
                (quote: QuoteModel) => { this.getQuoteCompleted(quote); },
                (error: any) => { this.getQuoteFailed(error); });
        }

        protected getQuoteCompleted(quote: QuoteModel): void {
            this.quote = quote;
            if (this.quote && this.quote.calculationMethods && this.quote.calculationMethods.length > 0) {
                this.calculationMethod = this.quote.calculationMethods[0];
                this.changeCalculationMethod();
            }

            if (this.realTimePricing && this.quote.quoteLineCollection && this.quote.quoteLineCollection.length > 0) {
                var products = this.quote.quoteLineCollection
                    .filter(o => !o.pricing || o.pricing && o.pricing.requiresRealTimePrice)
                    .map(o => ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure })) as any;

                if (products.length === 0) {
                    return;
                }

                this.productService.getProductRealTimePrices(products).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getQuoteFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
            realTimePricing.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const quoteLine = this.quote.quoteLineCollection.find((o: QuoteLineModel) => o.productId === productPrice.productId && o.unitOfMeasure === productPrice.unitOfMeasure);
                quoteLine.pricing = productPrice;
            });
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
            this.quote.cartNotPriced = true;
        }

        acceptCheckout(url: string): void {
            this.validateForm();
            if (!this.formValid) {
                return;
            }
            if (!this.isCartEmpty) {
                angular.element("#rfqPopupCartNotificationLink").trigger("click");
            } else {
                this.continueCheckout(url);
            }
        }

        acceptJobQuote(url: string): void {
            this.validateForm();
            if (!this.formValid) {
                return;
            }

            if (!this.validateExpirationDateForm()) {
                return;
            }

            const acceptQuote = {
                quoteId: this.quoteId,
                status: "JobAccepted",
                expirationDate: this.quote.expirationDate
            } as QuoteParameter;

            this.rfqService.updateQuote(acceptQuote).then(
                (quote: QuoteModel) => { this.acceptJobQuoteCompleted(quote, url); },
                (error: any) => { this.acceptJobQuoteFailed(error); });
        }

        protected acceptJobQuoteCompleted(quote: QuoteModel, url: string): void {
            this.coreService.redirectToPath(url);
        }

        protected acceptJobQuoteFailed(error: any): void {
        }

        continueCheckout(url: string): void {
            url += this.quoteId;
            this.coreService.redirectToPath(url);
        }

        declineQuote(returnUrl: string): void {
            const declineQoute = {
                quoteId: this.quoteId,
                status: "QuoteRejected",
                expirationDate: this.quote.expirationDate
            } as QuoteParameter;

            this.rfqService.updateQuote(declineQoute).then(
                (quote: QuoteModel) => { this.declineQuoteCompleted(quote, returnUrl); },
                (error: any) => { this.declineQuoteFailed(error); });
        }

        protected declineQuoteCompleted(quote: QuoteModel, returnUrl: string): void {
            this.redirectToPathOrReturnBack(returnUrl);
        }

        protected declineQuoteFailed(error: any): void {
        }

        closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        submitQuote(url: string): void {
            if (!this.validateExpirationDateForm()) {
                return;
            }

            if (this.expirationDateIsLessThanCurrentDate()) {
                this.quotePastExpirationDatePopupService.display({ url: url });
            } else {
                this.doSubmitQuote(url);
            }
        }

        doSubmitQuote(url: string): void {
            const submitQuote = {
                quoteId: this.quoteId,
                status: "QuoteProposed",
                expirationDate: this.quote.expirationDate
            } as QuoteParameter;

            this.rfqService.updateQuote(submitQuote).then(
                (quote: QuoteModel) => { this.submitQuoteCompleted(quote, url); },
                (error: any) => { this.submitQuoteFailed(error); });
        }

        protected submitQuoteCompleted(quote: QuoteModel, url: string): void {
            this.redirectToPathOrReturnBack(url);
        }

        protected submitQuoteFailed(error: any): void {
        }

        applyQuote(): void {
            if (!this.validateQuoteCalculatorForm()) {
                return;
            }

            const applyQuote = {
                quoteId: this.quoteId,
                calculationMethod: this.calculationMethod.name,
                percent: this.percent,
                expirationDate: this.quote.expirationDate
            } as QuoteParameter;

            this.rfqService.updateQuote(applyQuote).then(
                (quote: QuoteModel) => { this.applyQuoteCompleted(quote); },
                (error: any) => { this.applyQuoteFailed(error); });
        }

        protected applyQuoteCompleted(quote: QuoteModel): void {
            this.quote.quoteLineCollection = quote.quoteLineCollection;
            this.closeModal("#orderCalculator");
        }

        protected applyQuoteFailed(error: any): void {
            if (error && error.message) {
                const form = this.getQuoteCalculatorForm();
                if (form && form.length !== 0) {
                    form.validate().showErrors({ "percent" : error.message });
                }
            }
        }

        deleteQuote(returnUrl: string): void {
            this.rfqService.removeQuote(this.quoteId).then(
                (quote: QuoteModel) => { this.deleteQuoteCompleted(quote, returnUrl); },
                (error: any) => { this.deleteQuoteFailed(error); });
        }

        protected deleteQuoteCompleted(quote: QuoteModel, returnUrl: string): void {
            this.redirectToPathOrReturnBack(returnUrl);
        }

        protected deleteQuoteFailed(error: any): void {
        }

        protected redirectToPathOrReturnBack(returnUrl: string): void {
            // this will restore history state with filter and etc
            if (this.coreService.getReferringPath() === returnUrl) {
                this.$window.history.back();
            } else {
                this.coreService.redirectToPath(returnUrl);
            }
        }

        changeCalculationMethod(): void {
            this.maximumDiscount = this.calculationMethod.maximumDiscount > 0 ? this.calculationMethod.maximumDiscount : false;
            this.minimumMargin = 0;
            for (let i = 0; i < this.quote.quoteLineCollection.length; i++) {
                const minLineMargin = 100 - (this.quote.quoteLineCollection[i].pricingRfq.unitCost * 100 / this.quote.quoteLineCollection[i].pricingRfq.minimumPriceAllowed);
                this.minimumMargin = minLineMargin > this.minimumMargin ? minLineMargin : this.minimumMargin;
            }
            this.minimumMargin = this.calculationMethod.minimumMargin > 0 ? this.minimumMargin > this.calculationMethod.minimumMargin ? this.minimumMargin : this.calculationMethod.minimumMargin : 0;

            $("#rfqApplyOrderQuoteForm input").data("rule-min", this.minimumMargin);
            $("#rfqApplyOrderQuoteForm input").data("rule-max", this.maximumDiscount > 0 ? (this.maximumDiscount * 1) : "false");
        }

        openOrderLineCalculatorPopup(quoteLine: any): void {
            this.$rootScope.$broadcast("openLineCalculator", quoteLine);
        }

        protected validateForm(): void {
            const form = angular.element("#quoteDetailsForm");
            if (form && form.length !== 0) {
                this.formValid = form.validate().form();
            }
        }

        protected validateExpirationDateForm(): boolean {
            const form = angular.element("#updateExpirationDate");
            if (form && form.length !== 0) {
                return form.validate().form();
            }
            return true;
        }

        protected getQuoteCalculatorForm(): ng.IAugmentedJQuery {
            return angular.element("#rfqApplyOrderQuoteForm");
        }

        protected validateQuoteCalculatorForm(): boolean {
            const form = this.getQuoteCalculatorForm();
            if (form && form.length !== 0) {
                const validator = form.validate({
                    errorLabelContainer: "#rfqApplyOrderQuoteFormError"
                });
                validator.resetForm();
                return form.validate().form();
            }
            return true;
        }

        protected expirationDateIsLessThanCurrentDate(): boolean {
            if (!this.quote) {
                return true;
            }

            let expirationDate = new Date(this.quote.expirationDate.toString());
            let currentDate = new Date();

            expirationDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);

            return expirationDate < currentDate;
        }

        protected resetValidationCalculatorForm(): void {
            const form = angular.element("#rfqApplyOrderQuoteForm");
            if (form && form.length !== 0) {
                const validator = form.validate();
                validator.resetForm();
            }
        }

        getPriceForJobQuote(priceBreaks: any[], qtyOrdered: number): any {
            return priceBreaks.slice().sort((a, b) => b.startQty - a.startQty).filter(x => x.startQty <= qtyOrdered)[0].priceDispaly;
        }
    }

    angular
        .module("insite")
        .controller("QuoteDetailsController", QuoteDetailsController);
}