module insite.rfq {
    "use strict";

    export class MyQuotesController {
        cart: any;
        searchFilter: any;
        quotes: any;
        pagination: any;
        paginationStorageKey = "DefaultPagination-MyQuotes";
        isSalesRep = true;
        userList: AccountModel[];
        customerList: BillToModel[];
        salesRepList: any;
        selectedStatus: any;
        selectedType: any;
        quoteSettings: QuoteSettingsModel;

        static $inject = ["rfqService", "coreService", "accountService", "customerService", "paginationService", "settingsService", "cartService"];

        constructor(
            protected rfqService: rfq.IRfqService,
            protected coreService: core.ICoreService,
            protected accountService: account.IAccountService,
            protected customerService: customers.ICustomerService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.quoteSettings = settingsCollection.quoteSettings;
            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cart = cart;
            this.isSalesRep = cart.isSalesperson;
            this.setDefaultSearchFilter();
            if (this.isSalesRep) {
                this.getSalesRepSpecificData();
            }
            this.restoreHistory();
            this.getQuotes();
        }

        protected getCartFailed(error: any): void {
        }

        protected getSalesRepSpecificData(): void {
            this.rfqService.expand = "saleslist";
            this.accountService.getAccounts().then(
                (accountCollection: AccountCollectionModel) => { this.getAccountsCompleted(accountCollection); },
                (error: any) => { this.getAccountsFailed(error); });

            this.customerService.getBillTos().then(
                (billToCollection: BillToCollectionModel) => { this.getBillTosCompleted(billToCollection); },
                (error: any) => { this.getBillTosFailed(error); });
        }

        protected getAccountsCompleted(accountCollection: AccountCollectionModel): void {
            this.userList = accountCollection.accounts.sort((acc1, acc2) => acc1.userName.localeCompare(acc2.userName));
        }

        protected getAccountsFailed(error: any): void {
        }

        protected getBillTosCompleted(billToCollection: BillToCollectionModel): void {
            this.customerList = billToCollection.billTos;
        }

        protected getBillTosFailed(error: any): void {
        }

        protected setDefaultSearchFilter(): any {
            this.searchFilter = {};
            this.searchFilter.statuses = [];
            this.searchFilter.types = [];
            this.selectedStatus = "";
            this.searchFilter.salesRepNumber = null;
            this.searchFilter.userId = null;
            this.searchFilter.customerId = null;
            this.selectedType = "";
        }

        getQuotes(): any {
            this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
            this.rfqService.getQuotes(this.searchFilter, this.pagination).then(
                (quotes: QuoteCollectionModel) => { this.getQuotesCompleted(quotes); },
                (error: any) => { this.getQuotesFailed(error); });
        }

        protected getQuotesCompleted(quotesModel: any): void {
            this.quotes = quotesModel.quotes;
            this.pagination = quotesModel.pagination;
            if (quotesModel.salespersonList) {
                this.salesRepList = quotesModel.salespersonList;
            }
        }

        protected getQuotesFailed(error: any): void {
        }

        clear(): any {
            this.pagination.page = 1;
            this.setDefaultSearchFilter();
            this.getQuotes();
        }

        search(): any {
            this.pagination.page = 1;
            this.searchFilter.statuses = [];
            this.searchFilter.types = [];
            if (this.selectedStatus) {
                this.searchFilter.statuses.push(this.selectedStatus);
            }
            if (this.selectedType) {
                this.searchFilter.types.push(this.selectedType);
            }
            this.getQuotes();
        }

        protected restoreHistory(): void {
            const state = this.coreService.getHistoryState();
            if (state) {
                if (state.pagination) {
                    this.pagination = state.pagination;
                }
                if (state.filter) {
                    this.searchFilter = state.filter;
                    if (this.searchFilter.statuses && this.searchFilter.statuses.length > 0) {
                        this.selectedStatus = this.searchFilter.statuses[0];
                    }
                    if (this.searchFilter.types && this.searchFilter.types.length > 0) {
                        this.selectedType = this.searchFilter.types[0];
                    }
                }
            }
        }
    }

    angular
        .module("insite")
        .controller("MyQuotesController", MyQuotesController);
}