module insite.order {
    "use strict";

    class RecentOrdersPaginationModel implements PaginationModel {
        currentPage: number;
        page: number;
        pageSize: number;
        defaultPageSize: number;
        totalItemCount: number;
        numberOfPages: number;
        pageSizeOptions: number[];
        sortOptions: Insite.Core.WebApi.SortOptionModel[];
        sortType: string;
        nextPageUri: string;
        prevPageUri: string;

        constructor() {
            this.numberOfPages = 1;
            this.pageSize = 5;
            this.page = 1;
        }
    }

    export class BrasselerRecentOrdersController extends RecentOrdersController {
        searchFilter: OrderSearchFilter;
        pagination: PaginationModel;
        static $inject = [
            "orderService",
            "settingsService",
            "queryString",
            "coreService",
            "sessionService",
            "cartService",
            "addToWishlistPopupService",
            "customerService"
        ];

        constructor(
            protected orderService: order.IOrderService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService,
            protected cartService: cart.ICartService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected customerService: customers.ICustomerService) {
            super(orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService);
        }

        getRecentOrders(): void {
            const filter = new OrderSearchFilter();
            filter.sort = "OrderDate DESC";

            const pagination = new RecentOrdersPaginationModel();

            this.customerService.getShipTo("").then(data => {
                filter.customerSequence = data.customerSequence;
                this.orderService.getOrders(filter, this.pagination).then(
                    (orderCollection: OrderCollectionModel) => { this.getOrdersCompleted(orderCollection); },
                    (error) => { this.getOrderFailed(error); });
            });
        }
    }

    angular
        .module("insite")
        .controller("RecentOrdersController", BrasselerRecentOrdersController);
}
