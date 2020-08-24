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
    (function (order_1) {
        "use strict";
        var QueryStringFilterBrasseler = /** @class */ (function () {
            function QueryStringFilterBrasseler() {
            }
            return QueryStringFilterBrasseler;
        }());
        order_1.QueryStringFilterBrasseler = QueryStringFilterBrasseler;
        var BrasselerOrderDetailController = /** @class */ (function (_super) {
            __extends(BrasselerOrderDetailController, _super);
            function BrasselerOrderDetailController(orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService) {
                var _this = _super.call(this, orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService) || this;
                _this.orderService = orderService;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.coreService = coreService;
                _this.sessionService = sessionService;
                _this.cartService = cartService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _super.prototype.$onInit.call(_this);
                return _this;
            }
            BrasselerOrderDetailController.prototype.addLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerOrderDetailController.prototype.addLineFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerOrderDetailController.prototype.getOrderCompleted = function (order) {
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
                    }
                    else {
                        //this.order.orderLines[i].description = ''; BUSA-1284
                    }
                }
                this.btFormat = this.formatCityCommaStateZip(this.order.billToCity, this.order.billToState, this.order.billToPostalCode);
                this.stFormat = this.formatCityCommaStateZip(this.order.shipToCity, this.order.shipToState, this.order.shipToPostalCode);
                //this.getRealTimeInventory();
            };
            BrasselerOrderDetailController.$inject = ["orderService", "settingsService", "queryString", "coreService", "sessionService", "cartService", "addToWishlistPopupService"];
            return BrasselerOrderDetailController;
        }(order_1.OrderDetailController));
        order_1.BrasselerOrderDetailController = BrasselerOrderDetailController;
        angular
            .module("insite")
            .controller("OrderDetailController", BrasselerOrderDetailController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.order-detail.controller.js.map