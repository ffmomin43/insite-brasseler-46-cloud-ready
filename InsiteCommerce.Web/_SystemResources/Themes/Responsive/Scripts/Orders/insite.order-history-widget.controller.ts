module insite.order {
    "use strict";

    export class OrderHistoryWidgetController {
        orderHistory: OrderCollectionModel;
        canReorderItems: boolean;
        showOrders: boolean;
        showWebOrderNumber: boolean;
        reorderedOrdersIds: string[] = [];

        static $inject = ["orderService", "settingsService", "cartService"];

        constructor(
            protected orderService: order.IOrderService,
            protected settingsService: core.ISettingsService,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.canReorderItems = settingsCollection.orderSettings.canReorderItems;
            this.showOrders = settingsCollection.orderSettings.showOrders;
            this.showWebOrderNumber = settingsCollection.orderSettings.showWebOrderNumber;
            if (this.showOrders) {
                this.getOrders();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        getOrders(): void {
            const searchFilter: ISearchFilter = {
                customerSequence: "-1",
                sort: "OrderDate DESC",
                toDate: "",
                fromDate: ""
            };

            const pagination = {
                page: 1,
                pageSize: 5
            } as PaginationModel;

            this.orderService.getOrders(searchFilter, pagination).then(
                (orderCollection: OrderCollectionModel) => { this.getOrdersCompleted(orderCollection); },
                (error: any) => { this.getOrdersFailed(error); });
        }

        protected getOrdersCompleted(orderCollection: OrderCollectionModel): void {
            this.orderHistory = orderCollection;
        }

        protected getOrdersFailed(error: any): void {
        }

        reorderAllProducts($event, order: OrderModel): void {
            $event.preventDefault();
            this.reorderedOrdersIds.push(order.id);
            this.orderService.getOrder(order.webOrderNumber || order.erpOrderNumber, "orderlines").then(
                (orderModel: OrderModel) => { this.getOrderCompleted(orderModel); },
                (error: any) => { this.getOrderFailed(error); });
        }

        protected getOrderCompleted(order: OrderModel): void {
            const cartLines = this.orderService.convertToCartLines(order.orderLines);
            if (cartLines.length > 0) {
                this.cartService.addLineCollection(cartLines, true).then(
                    (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                    (error: any) => { this.addLineCollectionFailed(error); });
            }
        }

        protected getOrderFailed(error: any): void {
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
        }

        protected addLineCollectionFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("OrderHistoryWidgetController", OrderHistoryWidgetController);
}