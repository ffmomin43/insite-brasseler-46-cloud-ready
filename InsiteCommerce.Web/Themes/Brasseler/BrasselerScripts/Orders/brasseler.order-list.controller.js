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
        var BrasselerOrderListController = /** @class */ (function (_super) {
            __extends(BrasselerOrderListController, _super);
            function BrasselerOrderListController(orderService, customerService, coreService, paginationService, settingsService, spinnerService) {
                var _this = _super.call(this, orderService, customerService, coreService, paginationService, settingsService) || this;
                _this.orderService = orderService;
                _this.customerService = customerService;
                _this.coreService = coreService;
                _this.paginationService = paginationService;
                _this.settingsService = settingsService;
                _this.spinnerService = spinnerService;
                return _this;
                //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders - twice service calls made
                //this.init();
            }
            BrasselerOrderListController.prototype.init = function () {
                var _this = this;
                //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders - comments the super call
                //super.init();
                this.customerService.getShipTo("").then(function (data) {
                    _this.shipTo = data;
                    _this.searchFilter.customerSequence = _this.shipTo.customerSequence;
                    _this.searchFilter.sort = "OrderDate DESC";
                    _this.searchFilter.toDate = "";
                    _this.searchFilter.fromDate = "";
                    _this.searchFilter.ponumber = "";
                    _this.searchFilter.ordernumber = "";
                    _this.searchFilter.ordertotaloperator = "";
                    _this.searchFilter.ordertotal = "";
                    _this.searchFilter.status = [];
                    _this.prepareSearchFilter();
                    if (_this.shipTo.label == "Use Billing Address") {
                        _this.customerService.getBillTo("").then(function (data) {
                            _this.shipTo.label = data.label;
                            _this.shipTo.label = _this.shipTo.label.substr(1, _this.shipTo.label.length);
                        });
                    }
                    _this.shipTo.label = _this.shipTo.label.substr(1, _this.shipTo.label.length);
                    _this.getOrders();
                    //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders
                    _super.prototype.init.call(_this);
                });
            };
            BrasselerOrderListController.prototype.getOrders = function () {
                var _this = this;
                this.appliedSearchFilter.sort = this.searchFilter.sort;
                this.orderService.getOrders(this.appliedSearchFilter, this.pagination).then(function (data) {
                    _this.orderHistory = data;
                    _this.pagination = data.pagination;
                });
            };
            BrasselerOrderListController.prototype.clear = function () {
                this.pagination.currentPage = 1;
                this.searchFilter.customerSequence = this.shipTo.customerSequence;
                this.searchFilter.sort = "OrderDate DESC";
                this.searchFilter.toDate = "";
                this.searchFilter.fromDate = "";
                this.searchFilter.ponumber = "";
                this.searchFilter.ordernumber = "";
                this.searchFilter.ordertotaloperator = "";
                this.searchFilter.ordertotal = "";
                this.searchFilter.status = [];
                this.prepareSearchFilter();
                this.getOrders();
            };
            BrasselerOrderListController.prototype.getRmaStatus = function (webOrderNumber) {
                var _this = this;
                this.spinnerService.show();
                this.orderService.getOrder(webOrderNumber, "orderlines").then(function (order) { _this.rmaGetOrderCompleted(order); }, function (error) { _this.rmaGetOrderFailed(error); });
            };
            BrasselerOrderListController.prototype.rmaGetOrderCompleted = function (order) {
                var _this = this;
                this.spinnerService.hide();
                order.orderLines.forEach(function (o) {
                    if (o.properties["returnRequest"] != undefined) {
                        var returnResult = JSON.parse(o.properties["returnRequest"]);
                        o.properties["QtyToReturn"] = returnResult.QtyToReturn;
                        o.properties["ReturnReason"] = returnResult.ReturnReason;
                        if (returnResult.RmaNotes != "")
                            _this.rmaNotes = returnResult.RmaNotes;
                        _this.rmaDate = returnResult.ReturnDate;
                    }
                });
                this.order = order;
                if (order.properties["rmaStatusHtmlImage"] != undefined) {
                    this.requestSubmitted = true;
                    this.rmaLabel = window.atob(order.properties["rmaStatusHtmlImage"]);
                    this.rmaLabel = this.rmaLabel.replace(/ï¿½/g, '');
                    this.rmaLabel = this.rmaLabel.replace(/Â/g, '');
                    $("#rmaStatusLabel").html(this.rmaLabel);
                    var imgObj = $("#rmaStatusLabel").find("img");
                    imgObj[0].setAttribute('src', "data:image/jpg;base64," + order.properties["rmaStatusGraphicImage"]);
                    this.rmaLabel = angular.element("#rmaStatusLabel").html();
                    this.coreService.displayModal(angular.element("#popup-rma"));
                }
            };
            BrasselerOrderListController.prototype.rmaGetOrderFailed = function (error) {
            };
            BrasselerOrderListController.prototype.printRmaLabel = function () {
                var printLabel = window.open();
                printLabel.document.write($('#print-rma-label').html());
                printLabel.print();
            };
            BrasselerOrderListController.prototype.closePopup = function ($event) {
                $event.preventDefault();
                this.coreService.closeModal("#popup-rma");
            };
            BrasselerOrderListController.$inject = [
                "orderService",
                "customerService",
                "coreService",
                "paginationService",
                "settingsService",
                "spinnerService"
            ];
            return BrasselerOrderListController;
        }(order_1.OrderListController));
        order_1.BrasselerOrderListController = BrasselerOrderListController;
        angular
            .module("insite")
            .controller("OrderListController", BrasselerOrderListController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.order-list.controller.js.map