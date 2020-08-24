module insite.rfq {
    "use strict";

    export class RecentQuotesController {
        quotes: any;
        parameters: any;
        quoteSettings: QuoteSettingsModel;

        static $inject = ["rfqService", "settingsService", "cartService"];

        constructor(
            protected rfqService: rfq.IRfqService,
            protected settingsService: core.ISettingsService,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.quoteSettings = settingsCollection.quoteSettings;
            this.cartService.getCart().then(
                (cartModel: CartModel) => { this.getCartCompleted(cartModel); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getCartCompleted(cartModel: CartModel): void {
            if (cartModel.canRequestQuote) {
                this.getQuotes();
            }
        }

        protected getCartFailed(error: any): void {
        }

        protected getQuotes(): any {
            this.parameters = {};
            this.parameters.pageSize = 5;

            this.rfqService.getQuotes(this.parameters, null).then(
                (quotes: QuoteCollectionModel) => { this.getQuotesCompleted(quotes); },
                (error: any) => { this.getQuotesFailed(error); });
        }

        protected getQuotesCompleted(quotes: QuoteCollectionModel): void {
            this.quotes = quotes.quotes;
        }

        protected getQuotesFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("RecentQuotesController", RecentQuotesController);
}