module insite.order {
    "use strict";

    export interface IOrderStatusLookupControllerAttributes extends ng.IAttributes {
        orderStatusPageUrl: string;
    }

    export class OrderStatusLookupController {

        orderNumber: string;
        emailOrPostalCode: string;
        orderStatusLookupError: "";
        orderStatusLookupForm: any;
        private stEmail: string;
        private stPostalCode: string;

        static $inject = ["orderService", "$attrs", "coreService", "spinnerService"];

        constructor(
            protected orderService: order.IOrderService,
            protected $attrs: IOrderStatusLookupControllerAttributes,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService) {
        }

        $onInit(): void {
        }

        checkOrderStatus(): void {
            this.orderStatusLookupError = "";
            if (this.orderStatusLookupForm.$invalid) {
                return;
            }

            this.spinnerService.show();

            this.stEmail = "";
            this.stPostalCode = "";

            if (this.emailOrPostalCode.indexOf("@") >= 0) {
                this.stEmail = this.emailOrPostalCode;
            } else {
                this.stPostalCode = this.emailOrPostalCode;
            }

            this.orderService.getOrder(this.orderNumber, null, this.stEmail, this.stPostalCode).then(
                (order: OrderModel) => { this.getOrderCompleted(order); },
                (error: any) => { this.getOrderFailed(error); });
        }

        getOrderCompleted(orderModel: Insite.Order.WebApi.V1.ApiModels.OrderModel) {
            this.coreService.redirectToPath(`${this.$attrs.orderStatusPageUrl}?ordernumber=${orderModel.webOrderNumber || orderModel.erpOrderNumber}&stEmail=${this.stEmail}&stPostalCode=${this.stPostalCode}`);
        }

        getOrderFailed(error: any) {
            this.spinnerService.hide();
            this.orderStatusLookupError = error;
        }
    }

    angular
        .module("insite")
        .controller("OrderStatusLookupController", OrderStatusLookupController);
}