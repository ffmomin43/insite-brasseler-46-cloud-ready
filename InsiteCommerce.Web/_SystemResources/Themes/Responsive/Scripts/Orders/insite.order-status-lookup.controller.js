var insite;
(function (insite) {
    var order;
    (function (order_1) {
        "use strict";
        var OrderStatusLookupController = /** @class */ (function () {
            function OrderStatusLookupController(orderService, $attrs, coreService, spinnerService) {
                this.orderService = orderService;
                this.$attrs = $attrs;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
            }
            OrderStatusLookupController.prototype.$onInit = function () {
            };
            OrderStatusLookupController.prototype.checkOrderStatus = function () {
                var _this = this;
                this.orderStatusLookupError = "";
                if (this.orderStatusLookupForm.$invalid) {
                    return;
                }
                this.spinnerService.show();
                this.stEmail = "";
                this.stPostalCode = "";
                if (this.emailOrPostalCode.indexOf("@") >= 0) {
                    this.stEmail = this.emailOrPostalCode;
                }
                else {
                    this.stPostalCode = this.emailOrPostalCode;
                }
                this.orderService.getOrder(this.orderNumber, null, this.stEmail, this.stPostalCode).then(function (order) { _this.getOrderCompleted(order); }, function (error) { _this.getOrderFailed(error); });
            };
            OrderStatusLookupController.prototype.getOrderCompleted = function (orderModel) {
                this.coreService.redirectToPath(this.$attrs.orderStatusPageUrl + "?ordernumber=" + (orderModel.webOrderNumber || orderModel.erpOrderNumber) + "&stEmail=" + this.stEmail + "&stPostalCode=" + this.stPostalCode);
            };
            OrderStatusLookupController.prototype.getOrderFailed = function (error) {
                this.spinnerService.hide();
                this.orderStatusLookupError = error;
            };
            OrderStatusLookupController.$inject = ["orderService", "$attrs", "coreService", "spinnerService"];
            return OrderStatusLookupController;
        }());
        order_1.OrderStatusLookupController = OrderStatusLookupController;
        angular
            .module("insite")
            .controller("OrderStatusLookupController", OrderStatusLookupController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-status-lookup.controller.js.map