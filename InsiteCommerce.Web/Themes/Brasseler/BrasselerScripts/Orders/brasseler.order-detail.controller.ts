module insite.order {
    "use strict";
    import SessionModel = Insite.Account.WebApi.V1.ApiModels.SessionModel;

    export class QueryStringFilterBrasseler implements cart.IQueryStringFilter {
        orderNumber: string;
    }

    export class BrasselerOrderDetailController extends OrderDetailController {
        searchFilter: QueryStringFilterBrasseler;
        isSubscribedOrder: boolean;
        errorMessage: string;


        static $inject = ["orderService", "settingsService", "queryString", "coreService", "sessionService", "cartService", "addToWishlistPopupService"];

        constructor(
            protected orderService: order.IOrderService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService,
            protected cartService: cart.ICartService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService) {
            super(orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService)
            super.init();
        }

        protected addLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
        }

        protected addLineFailed(error: any): void {
            this.errorMessage = error.message;
        }

        protected getOrderCompleted(order: OrderModel): void {
            this.order = order;
            for (var i = 0; i < this.order.orderLines.length; i++) {
                //BUSA-760 SS - Order details page should display with smart supply image start.
                if (this.order.orderLines[i].properties["isSubscriptionOpted"] != null && this.order.orderLines[i].properties["isSubscriptionOpted"].toLowerCase() == "true") {
                    this.isSubscribedOrder = true;
                }

                if (this.order.orderLines[i].description.length > 0 && this.order.orderLines[i].description.indexOf('~') != -1) {
                    var regPrice = this.order.orderLines[i].description.split('~');
                    if (regPrice.length > 0) {
                        this.order.orderLines[i].description = regPrice[regPrice.length - 1];
                    }
                } else {
                    //this.order.orderLines[i].description = ''; BUSA-1284
                }
            }
            this.btFormat = this.formatCityCommaStateZip(this.order.billToCity, this.order.billToState, this.order.billToPostalCode);
            this.stFormat = this.formatCityCommaStateZip(this.order.shipToCity, this.order.shipToState, this.order.shipToPostalCode);
            this.getRealTimeInventory();
        }

    }

    angular
        .module("insite")
        .controller("OrderDetailController", BrasselerOrderDetailController);
}