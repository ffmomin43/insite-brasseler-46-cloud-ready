module insite.savedorders {
    "use strict";

    export class SavedOrderListController {
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-SavedOrderList";
        savedCarts: CartModel[];
        searchFilter: cart.IQueryStringFilter;

        static $inject = ["cartService", "coreService", "paginationService"];

        constructor(
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService) {
        }

        $onInit(): void {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.searchFilter = this.getDefaultSearchFilter();
            this.restoreHistory();
            this.getCarts();
        }

        clear(): void {
            this.pagination.page = 1;
            this.searchFilter = this.getDefaultSearchFilter();
            this.getCarts();
        }

        changeSort(sort: string): void {
            if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                this.searchFilter.sort = `${sort} DESC`;
            } else {
                this.searchFilter.sort = sort;
            }

            this.getCarts();
        }

        search(): void {
            if (this.pagination) {
                this.pagination.page = 1;
            }

            this.getCarts();
        }

        getCarts(): void {
            this.updateHistory();
            this.cartService.getCarts(this.searchFilter, this.pagination).then(
                (cartCollection: CartCollectionModel) => { this.getCartsCompleted(cartCollection); },
                (error: any) => { this.getCartsFailed(error); });
        }

        protected getCartsCompleted(cartCollection: CartCollectionModel): void {
            this.savedCarts = cartCollection.carts;
            this.pagination = cartCollection.pagination;
        }

        protected getCartsFailed(error: any): void {
        }

        protected restoreHistory(): void {
            const state = this.coreService.getHistoryState();
            if (state) {
                if (state.pagination) {
                    this.pagination = state.pagination;
                }
                if (state.filter) {
                    this.searchFilter = state.filter;
                }
            }
        }

        protected updateHistory(): void {
            this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
        }

        protected getDefaultSearchFilter(): cart.IQueryStringFilter {
            return {
                status: "Saved",
                sort: "OrderDate DESC",
                shipToId: null
            };
        }
    }

    angular
        .module("insite")
        .controller("SavedOrderListController", SavedOrderListController);
}