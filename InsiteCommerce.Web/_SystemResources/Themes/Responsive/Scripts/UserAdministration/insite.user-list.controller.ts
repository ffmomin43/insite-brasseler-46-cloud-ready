module insite.useradministration {
    "use strict";

    export class UserListController {
        sort = "UserName";
        searchText = "";
        users: AccountModel[] = [];
        pagination: PaginationModel = null;
        paginationStorageKey = "DefaultPagination-UserList";

        static $inject = ["accountService", "paginationService", "coreService"];

        constructor(
            protected accountService: account.IAccountService,
            protected paginationService: core.IPaginationService,
            protected coreService: core.ICoreService) {
        }

        $onInit(): void {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.restoreHistory();

            this.search(this.sort, false, false);
        }

        search(sort: string = "UserName", newSearch: boolean = false, storeHistory: boolean = true): void {
            this.sort = sort;

            if (newSearch) {
                this.pagination.page = 1;
            }

            if (storeHistory) {
                this.updateHistory();
            }

            this.accountService.expand = "administration";
            this.accountService.getAccounts(this.searchText, this.pagination, this.sort).then(
                (accountCollection: AccountCollectionModel) => { this.getAccountsCompleted(accountCollection); },
                (error: any) => { this.getAccountsFailed(error); });
        }

        protected getAccountsCompleted(accountCollection: AccountCollectionModel): void {
            this.users = accountCollection.accounts;
            this.pagination = accountCollection.pagination;
        }

        protected getAccountsFailed(error: any): void {
            this.users = [];
            this.pagination = null;
        }

        clearSearch(): void {
            if (this.searchText) {
                this.searchText = "";
                this.search(this.sort, true);
            }
        }

        sortBy(sortKey: string): void {
            if (this.sort.indexOf(sortKey) >= 0) {
                sortKey = this.sort.indexOf("DESC") >= 0 ? sortKey : `${sortKey} DESC`;
            }

            this.search(sortKey, true);
        }

        getSortClass(key: string): string {
            return this.sort.indexOf(key) >= 0 ?
                (this.sort.indexOf("DESC") >= 0 ? "sort-descending" : "sort-ascending") : "";
        }

        protected restoreHistory(): void {
            const state = this.coreService.getHistoryState();
            if (state) {
                if (state.pagination) {
                    this.pagination = state.pagination;
                }
                if (state.searchText) {
                    this.searchText = state.searchText;
                }
                if (state.sort) {
                    this.sort = state.sort;
                }
            }
        }

        protected updateHistory(): void {
            this.coreService.replaceState({ searchText: this.searchText, pagination: this.pagination, sort: this.sort });
        }
    }

    angular
        .module("insite")
        .controller("UserListController", UserListController);
}