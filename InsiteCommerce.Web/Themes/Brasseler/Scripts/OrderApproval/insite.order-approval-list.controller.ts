module insite.orderapproval {
    "use strict";

    export class OrderApprovalListController {
        approvalCarts: CartModel[];
        properties: {[key: string]: string};
        cart: CartModel;
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-OrderApprovalList";
        searchFilter: cart.IQueryStringFilter;
        shipTos: ShipToModel[];

        static $inject = ["orderApprovalService", "customerService", "coreService", "paginationService", "cartService"];

        constructor(
            protected orderApprovalService: orderapproval.IOrderApprovalService,
            protected customerService: customers.ICustomerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);

            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cart = cart;

            this.searchFilter = {
                shipToId: "",
                sort: "OrderDate"
            };

            this.restoreHistory();
            this.getCarts();

            this.customerService.getShipTos("approvals").then(
                (shipToCollection: ShipToCollectionModel) => { this.getShipTosCompleted(shipToCollection); },
                (error: any) => { this.getShipTosFailed(error); });
        }

        protected getCartFailed(error: any): void {
        }

        protected getShipTosCompleted(shipToCollection: ShipToCollectionModel): void {
            this.shipTos = shipToCollection.shipTos;
        }

        protected getShipTosFailed(error: any): void {
        }

        clear(): void {
            this.pagination.page = 1;
            this.searchFilter = {
                shipToId: "",
                sort: "OrderDate"
            };

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
            this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
            this.orderApprovalService.getCarts(this.searchFilter, this.pagination).then(
                (orderApprovalCollection: OrderApprovalCollectionModel) => { this.orderApprovalServiceGetCartsCompleted(orderApprovalCollection); },
                (error: any) => { this.orderApprovalServiceGetCartsFailed(error); });
        }

        protected orderApprovalServiceGetCartsCompleted(orderApprovalCollection: OrderApprovalCollectionModel): void {
            this.approvalCarts = orderApprovalCollection.cartCollection;
            this.properties = orderApprovalCollection.properties;
            this.pagination = orderApprovalCollection.pagination;
        }

        protected orderApprovalServiceGetCartsFailed(error: any): void {
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
    }

    angular
        .module("insite")
        .controller("OrderApprovalListController", OrderApprovalListController);
}