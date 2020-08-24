var insite;
(function (insite) {
    var order;
    (function (order_1) {
        "use strict";
        var OrderHistoryWidgetController = /** @class */ (function () {
            function OrderHistoryWidgetController(orderService, settingsService, cartService) {
                this.orderService = orderService;
                this.settingsService = settingsService;
                this.cartService = cartService;
                this.reorderedOrdersIds = [];
            }
            OrderHistoryWidgetController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            OrderHistoryWidgetController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.canReorderItems = settingsCollection.orderSettings.canReorderItems;
                this.showOrders = settingsCollection.orderSettings.showOrders;
                this.showWebOrderNumber = settingsCollection.orderSettings.showWebOrderNumber;
                if (this.showOrders) {
                    this.getOrders();
                }
            };
            OrderHistoryWidgetController.prototype.getSettingsFailed = function (error) {
            };
            OrderHistoryWidgetController.prototype.getOrders = function () {
                var _this = this;
                var searchFilter = {
                    customerSequence: "-1",
                    sort: "OrderDate DESC",
                    toDate: "",
                    fromDate: ""
                };
                var pagination = {
                    page: 1,
                    pageSize: 5
                };
                this.orderService.getOrders(searchFilter, pagination).then(function (orderCollection) { _this.getOrdersCompleted(orderCollection); }, function (error) { _this.getOrdersFailed(error); });
            };
            OrderHistoryWidgetController.prototype.getOrdersCompleted = function (orderCollection) {
                this.orderHistory = orderCollection;
            };
            OrderHistoryWidgetController.prototype.getOrdersFailed = function (error) {
            };
            OrderHistoryWidgetController.prototype.reorderAllProducts = function ($event, order) {
                var _this = this;
                $event.preventDefault();
                this.reorderedOrdersIds.push(order.id);
                this.orderService.getOrder(order.webOrderNumber || order.erpOrderNumber, "orderlines").then(function (orderModel) { _this.getOrderCompleted(orderModel); }, function (error) { _this.getOrderFailed(error); });
            };
            OrderHistoryWidgetController.prototype.getOrderCompleted = function (order) {
                var _this = this;
                var cartLines = this.orderService.convertToCartLines(order.orderLines);
                if (cartLines.length > 0) {
                    this.cartService.addLineCollection(cartLines, true).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
                }
            };
            OrderHistoryWidgetController.prototype.getOrderFailed = function (error) {
            };
            OrderHistoryWidgetController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
            };
            OrderHistoryWidgetController.prototype.addLineCollectionFailed = function (error) {
            };
            OrderHistoryWidgetController.$inject = ["orderService", "settingsService", "cartService"];
            return OrderHistoryWidgetController;
        }());
        order_1.OrderHistoryWidgetController = OrderHistoryWidgetController;
        angular
            .module("insite")
            .controller("OrderHistoryWidgetController", OrderHistoryWidgetController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-history-widget.controller.js.map