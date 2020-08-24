module insite.order {
    "use strict";
    import SessionModel = Insite.Account.WebApi.V1.ApiModels.SessionModel;

    export class OrderDetailController {
        order: OrderModel;
        orderNumber: string;
        private stEmail: string;
        private stPostalCode: string;
        canReorderItems = false;
        btFormat: string;
        stFormat: string;
        validationMessage: string;
        showCancelationConfirmation = false;
        showPoNumber: boolean;
        showTermsCode: boolean;
        allowCancellationStatuses: string[];
        allowRmaStatuses: string[];
        extraProperties: {
            stEmail: string,
            stPostalCode: string
        };
        isAuthenticated: boolean;

        static $inject = ["orderService", "settingsService", "queryString", "coreService", "sessionService", "cartService", "addToWishlistPopupService"];

        constructor(
            protected orderService: order.IOrderService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService,
            protected cartService: cart.ICartService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.orderNumber = this.queryString.get("orderNumber");
            if (typeof this.orderNumber === "undefined") {
                // handle "clean urls"
                const pathArray = window.location.pathname.split("/");
                const pathOrderNumber = pathArray[pathArray.length - 1];
                if (pathOrderNumber !== "OrderHistoryDetail") {
                    this.orderNumber = pathOrderNumber;
                }
            }

            this.stEmail = this.queryString.get("stEmail");
            this.stPostalCode = this.queryString.get("stPostalCode");
            this.extraProperties = {
                stEmail: this.stEmail,
                stPostalCode: this.stPostalCode
            }

            this.getOrder(this.orderNumber, this.stEmail, this.stPostalCode);
            this.getOrderStatusMappings();

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.canReorderItems = settingsCollection.orderSettings.canReorderItems;
            this.showPoNumber = settingsCollection.orderSettings.showPoNumber;
            this.showTermsCode = settingsCollection.orderSettings.showTermsCode;
        }

        protected getSettingsFailed(error: any): void {
        }

        getOrderStatusMappings(): void {
            this.orderService.getOrderStatusMappings().then(
                (orderStatusMappingCollection: OrderStatusMappingCollectionModel) => { this.getOrderStatusMappingsCompleted(orderStatusMappingCollection); },
                (error: any) => { this.getOrderStatusMappingsFailed(error); });
        }

        protected getOrderStatusMappingsCompleted(orderStatusMappingCollection: OrderStatusMappingCollectionModel): void {
            this.allowRmaStatuses = [];
            this.allowCancellationStatuses = [];
            for (let i = 0; i < orderStatusMappingCollection.orderStatusMappings.length; i++) {
                if (orderStatusMappingCollection.orderStatusMappings[i].allowRma) {
                    this.allowRmaStatuses.push(orderStatusMappingCollection.orderStatusMappings[i].erpOrderStatus);
                }

                if (orderStatusMappingCollection.orderStatusMappings[i].allowCancellation) {
                    this.allowCancellationStatuses.push(orderStatusMappingCollection.orderStatusMappings[i].erpOrderStatus);
                }
            }
        }

        protected getOrderStatusMappingsFailed(error: any): void {
        }

        allowCancellationCheck(status: string): boolean {
            return this.allowCancellationStatuses && this.allowCancellationStatuses.indexOf(status) !== -1;
        }

        allowRmaCheck(status: string): boolean {
            return this.isAuthenticated && this.allowRmaStatuses && this.allowRmaStatuses.indexOf(status) !== -1;
        }

        discountOrderFilter(promotion: PromotionModel): boolean {
            if (promotion == null) {
                return false;
            }

            return (promotion.promotionResultType === "AmountOffOrder" || promotion.promotionResultType === "PercentOffOrder");
        }

        discountShippingFilter(promotion: PromotionModel): boolean {
            if (promotion == null) {
                return false;
            }

            return (promotion.promotionResultType === "AmountOffShipping" || promotion.promotionResultType === "PercentOffShipping");
        }

        protected formatCityCommaStateZip(city: string, state: string, zip: string): string {
            let formattedString = "";
            if (city) {
                formattedString += city;
            }

            if (city && (state || zip)) {
                formattedString += ",";
            }

            if (state) {
                formattedString += ` ${state}`;
            }

            if (zip) {
                formattedString += ` ${zip}`;
            }

            return formattedString;
        }

        getOrder(orderNumber: string, stEmail?: string, stPostalCode?: string): void {
            this.orderService.getOrder(orderNumber, "orderlines,shipments", stEmail, stPostalCode).then(
                (order: OrderModel) => { this.getOrderCompleted(order); },
                (error: any) => { this.getOrderFailed(error); });
        }

        protected getOrderCompleted(order: OrderModel): void {
            this.order = order;
            this.btFormat = this.formatCityCommaStateZip(this.order.billToCity, this.order.billToState, this.order.billToPostalCode);
            this.stFormat = this.formatCityCommaStateZip(this.order.shipToCity, this.order.shipToState, this.order.shipToPostalCode);
        }

        protected getOrderFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        reorderProduct($event, line: OrderLineModel): void {
            $event.preventDefault();
            line.canAddToCart = false;
            let reorderItemsCount = 0;
            for (let i = 0; i < this.order.orderLines.length; i++) {
                if (this.order.orderLines[i].canAddToCart) {
                    reorderItemsCount++;
                }
            }

            this.canReorderItems = reorderItemsCount !== 0;
            this.cartService.addLine(this.orderService.convertToCartLine(line), true).then(
                (cartLine: CartLineModel) => { this.addLineCompleted(cartLine); },
                (error: any) => { this.addLineFailed(error); });
        }

        protected addLineCompleted(cartLine: CartLineModel): void {
        }

        protected addLineFailed(error: any): void {
        }

        reorderAllProducts($event): void {
            $event.preventDefault();
            this.canReorderItems = false;
            const cartLines = this.orderService.convertToCartLines(this.order.orderLines);
            if (cartLines.length > 0) {
                this.cartService.addLineCollection(cartLines, true).then(
                    (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                    (error: any) => { this.addLineCollectionFailed(error); });
            }
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
        }

        protected addLineCollectionFailed(error: any): void {
        }

        cancelAndReorder($event): void {
            this.reorderAllProducts($event);
            this.cancelOrder($event);
        }

        cancelOrder($event): void {
            // call update order with cancelation status
            const updateOrderModel = ({ status: "CancellationRequested" } as any) as OrderModel;
            updateOrderModel.erpOrderNumber = this.orderNumber;

            this.orderService.updateOrder(this.orderNumber, updateOrderModel).then(
                (order: OrderModel) => { this.updateOrderCompleted(order); },
                (error: any) => { this.updateOrderFailed(error); });
        }

        protected updateOrderCompleted(order: OrderModel): void {
            this.order.status = order.status;
            this.order.statusDisplay = order.statusDisplay;
            this.showCancelationConfirmation = true;
        }

        protected updateOrderFailed(error: any): void {
            this.validationMessage = error.exceptionMessage;
        }

        showShareModal(): void {
            this.coreService.displayModal("#shareEntityPopupContainer");
        }

        openWishListPopup(orderLine: OrderLineModel): void {
            const product = <ProductDto>(<any>({
                id: orderLine.productId,
                qtyOrdered: orderLine.qtyOrdered,
                selectedUnitOfMeasure: orderLine.unitOfMeasure
            }));

            this.addToWishlistPopupService.display([product]);
        }

        protected getSessionCompleted(sessionModel: SessionModel) {
            this.isAuthenticated = sessionModel.isAuthenticated;
        }

        protected getSessionFailed(error: any) {

        }
    }

    angular
        .module("insite")
        .controller("OrderDetailController", OrderDetailController);
}