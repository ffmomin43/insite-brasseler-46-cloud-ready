import QuoteSettingsModel = Insite.Rfq.WebApi.V1.ApiModels.QuoteSettingsModel;

module insite.rfq {
    "use strict";

    export class RfqController {
        cart: CartModel;
        session: SessionModel;
        isSalesRep: boolean;
        users: any;
        selectedUser: any;
        isJobQuote: boolean;
        jobName: string;
        notes: string;
        quoteSettings: QuoteSettingsModel;
        disableSubmit: boolean;

        static $inject = ["coreService", "$scope", "cartService", "rfqService", "accountService", "sessionService", "settingsService", "$q"];

        constructor(
            protected coreService: core.ICoreService,
            protected $scope: ng.IScope,
            protected cartService: cart.ICartService,
            protected rfqService: rfq.IRfqService,
            protected accountService: account.IAccountService,
            protected sessionService: account.ISessionService,
            protected settingsService: core.ISettingsService,
            protected $q: ng.IQService) {
        }

        $onInit(): void {
            this.initEvents();
            this.cartService.cartLoadCalled = true;
        }

        protected initEvents(): void {
            this.$scope.$on("cartChanged", (event: ng.IAngularEvent) => this.onCartChanged(event));

            this.$q.all([this.sessionService.getSession(), this.settingsService.getSettings()]).then(
                (results: any[]) => { this.getSessionAndSettingsCompleted(results); },
                (error: any) => { this.getSessionAndSettingsFailed(error); });
        }

        protected onCartChanged(event: ng.IAngularEvent): void {
            this.getCart();
        }

        protected getSessionAndSettingsCompleted(results: any[]): void {
            this.session = ((results[0]) as SessionModel);
            this.quoteSettings = ((results[1]) as core.SettingsCollection).quoteSettings;
            this.getCart();
        }

        protected getSessionAndSettingsFailed(error: any): void {
        }

        protected getCart(): void {
            this.cartService.expand = "cartlines,costcodes";
            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cartService.expand = "";
            if (!this.cart) {
                this.mapData(cart);
            }
            this.cart = cart;
        }

        protected getCartFailed(error: any): void {
            this.cartService.expand = "";
        }

        protected mapData(cart: CartModel): void {
            this.notes = cart.notes;
            this.isSalesRep = cart.isSalesperson;
            if (this.isSalesRep) {
                this.getSalesRepSpecificData();
            }
        }

        protected getSalesRepSpecificData(): void {
            this.accountService.getAccounts().then(
                (accountCollection: AccountCollectionModel) => { this.getAccountsCompleted(accountCollection); },
                (error: any) => { this.getAccountsFailed(error); });
        }

        protected getAccountsCompleted(accountCollection: AccountCollectionModel): any {
            const userCollection = accountCollection.accounts;

            this.users = userCollection
                .filter(user => user.userName !== this.session.userName)
                .sort((user1, user2) => user1.userName.localeCompare(user2.userName));

            this.users.forEach(user => {
                if (user.firstName && user.lastName) {
                    user.displayName = `${user.firstName} ${user.lastName}`;
                } else {
                    user.displayName = user.userName;
                }
            });
        }

        protected getAccountsFailed(result: any): void {
        }

        submitQuote(submitSuccessUri): any {
            const valid = angular.element("#submitQuoteForm").validate().form();
            if (!valid) {
                return;
            }

            const submitQuote = {
                quoteId: this.cart.id,
                userId: this.selectedUser,
                note: this.notes,
                jobName: this.jobName,
                isJobQuote: this.isJobQuote
            } as QuoteParameter;

            this.disableSubmit = true;
            this.rfqService.submitQuote(submitQuote).then(
                (quote: QuoteModel) => { this.submitQuoteCompleted(quote, submitSuccessUri); },
                (error: any) => { this.submitQuoteFailed(error); });
        }

        protected submitQuoteCompleted(quote: QuoteModel, successUri): void {
            this.getCart();
            this.quoteCompletedRedirect(successUri, quote.id);
        }

        protected submitQuoteFailed(error: any): void {
            this.disableSubmit = false;
        }

        protected quoteCompletedRedirect(successUri, quoteModelId): void {
            if (this.isSalesRep) {
                this.coreService.redirectToPath(`${successUri}?quoteId=${quoteModelId}`);
            } else {
                this.coreService.redirectToPath(`${successUri}?cartid=${quoteModelId}`);
            }
        }
    }

    angular
        .module("insite")
        .controller("RfqController", RfqController);
}