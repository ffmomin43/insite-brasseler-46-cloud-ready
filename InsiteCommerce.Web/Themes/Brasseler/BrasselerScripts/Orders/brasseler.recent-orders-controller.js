var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var RecentOrdersPaginationModel = /** @class */ (function () {
            function RecentOrdersPaginationModel() {
                this.numberOfPages = 1;
                this.pageSize = 5;
                this.page = 1;
            }
            return RecentOrdersPaginationModel;
        }());
        var BrasselerRecentOrdersController = /** @class */ (function (_super) {
            __extends(BrasselerRecentOrdersController, _super);
            function BrasselerRecentOrdersController(orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService, customerService) {
                var _this = _super.call(this, orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService) || this;
                _this.orderService = orderService;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.coreService = coreService;
                _this.sessionService = sessionService;
                _this.cartService = cartService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.customerService = customerService;
                return _this;
            }
            BrasselerRecentOrdersController.prototype.getRecentOrders = function () {
                var _this = this;
                var filter = new order.OrderSearchFilter();
                filter.sort = "OrderDate DESC";
                var pagination = new RecentOrdersPaginationModel();
                this.customerService.getShipTo("").then(function (data) {
                    filter.customerSequence = data.customerSequence;
                    _this.orderService.getOrders(filter, _this.pagination).then(function (orderCollection) { _this.getOrdersCompleted(orderCollection); }, function (error) { _this.getOrderFailed(error); });
                });
            };
            BrasselerRecentOrdersController.$inject = [
                "orderService",
                "settingsService",
                "queryString",
                "coreService",
                "sessionService",
                "cartService",
                "addToWishlistPopupService",
                "customerService"
            ];
            return BrasselerRecentOrdersController;
        }(order.RecentOrdersController));
        order.BrasselerRecentOrdersController = BrasselerRecentOrdersController;
        angular
            .module("insite")
            .controller("RecentOrdersController", BrasselerRecentOrdersController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.recent-orders-controller.js.map