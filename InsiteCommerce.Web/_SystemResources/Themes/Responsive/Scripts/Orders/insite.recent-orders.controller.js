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
        var RecentOrdersController = /** @class */ (function (_super) {
            __extends(RecentOrdersController, _super);
            function RecentOrdersController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            RecentOrdersController.prototype.$onInit = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            RecentOrdersController.prototype.getSessionCompleted = function (session) {
                if (!session.userRoles || session.userRoles.indexOf("Requisitioner") === -1) {
                    this.getRecentOrders();
                }
            };
            RecentOrdersController.prototype.getSessionFailed = function (error) {
            };
            RecentOrdersController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.orderSettings = settingsCollection.orderSettings;
            };
            RecentOrdersController.prototype.getSettingsFailed = function (error) {
            };
            RecentOrdersController.prototype.getRecentOrders = function () {
                var _this = this;
                var filter = new order.OrderSearchFilter();
                filter.sort = "OrderDate DESC";
                filter.customerSequence = "-1";
                var pagination = new RecentOrdersPaginationModel();
                this.orderService.getOrders(filter, pagination).then(function (orderCollection) { _this.getOrdersCompleted(orderCollection); }, function (error) { _this.getOrderFailed(error); });
            };
            RecentOrdersController.prototype.getOrdersCompleted = function (orderCollection) {
                this.orderHistory = orderCollection;
            };
            RecentOrdersController.prototype.getOrdersFailed = function (error) {
            };
            return RecentOrdersController;
        }(order.OrderDetailController));
        order.RecentOrdersController = RecentOrdersController;
        angular
            .module("insite")
            .controller("RecentOrdersController", RecentOrdersController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.recent-orders.controller.js.map