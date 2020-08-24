module insite.rfq {
    "use strict";

    export class QuoteConfirmationController {
        confirmedOrderId: any;
        quote: QuoteModel;
        realTimePricing = false;
        failedToGetRealTimePrices = false;

        static $inject = ["rfqService", "queryString", "settingsService", "productService"];

        constructor(
            protected rfqService: any,
            protected queryString: common.IQueryStringService,
            protected settingsService: core.ISettingsService,
            protected productService: catalog.IProductService) {
        }

        $onInit(): void {
            this.rfqService.expand = "billTo";
            this.confirmedOrderId = this.getConfirmedOrderId();
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getConfirmedOrderId(): string {
            return this.queryString.get("cartid");
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.realTimePricing = settingsCollection.productSettings.realTimePricing;
            this.getQuote();
        }

        protected getSettingsFailed(error: any): void {
        }

        getQuote(): void {
            this.rfqService.getQuote(this.confirmedOrderId).then(
                (quote: QuoteModel) => { this.getQuoteCompleted(quote); },
                (error: any) => { this.getQuoteFailed(error); });
        }

        protected getQuoteCompleted(quote: QuoteModel): void {
            this.quote = quote;
            this.quote.cartLines = this.quote.quoteLineCollection;

            if (this.realTimePricing && this.quote.cartLines && this.quote.cartLines.length > 0) {
                var products = this.quote.cartLines.map(o => ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure })) as any;
                this.productService.getProductRealTimePrices(products).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getQuoteFailed(error: any): void {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
            realTimePricing.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const quoteLine = this.quote.cartLines.find((o: QuoteLineModel) => o.productId === productPrice.productId && o.unitOfMeasure === productPrice.unitOfMeasure);
                quoteLine.pricing = productPrice;
            });
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
            this.quote.cartNotPriced = true;
        }
    }

    angular
        .module("insite")
        .controller("QuoteConfirmationController", QuoteConfirmationController);
}