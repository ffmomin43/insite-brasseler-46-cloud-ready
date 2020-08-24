var insite;
(function (insite) {
    var rma;
    (function (rma_1) {
        "use strict";
        var RmaController = /** @class */ (function () {
            function RmaController(orderService, coreService, queryString) {
                this.orderService = orderService;
                this.coreService = coreService;
                this.queryString = queryString;
                this.totalQuantity = 0;
                this.requestSubmitted = false;
            }
            RmaController.prototype.$onInit = function () {
                this.getOrder();
            };
            RmaController.prototype.getOrder = function () {
                var _this = this;
                this.orderService.getOrder(this.getOrderNumber(), "orderlines").then(function (order) { _this.getOrderCompleted(order); }, function (error) { _this.getOrderFailed(error); });
            };
            RmaController.prototype.getOrderNumber = function () {
                var orderNumber = this.queryString.get("orderNumber");
                if (typeof orderNumber === "undefined") {
                    var pathArray = window.location.pathname.split("/");
                    var pathNumber = pathArray[pathArray.length - 1];
                    if (pathNumber !== "OrderHistoryDetail") {
                        orderNumber = pathNumber;
                    }
                }
                return orderNumber;
            };
            RmaController.prototype.getOrderCompleted = function (order) {
                this.order = order;
                this.cityCommaStateZipDisplay = this.formatCityCommaStateZip(order.billToCity, order.billToState, order.billToPostalCode);
            };
            RmaController.prototype.getOrderFailed = function (error) {
            };
            RmaController.prototype.formatCityCommaStateZip = function (city, state, zip) {
                var formattedString = "";
                if (city) {
                    formattedString += city;
                }
                if (city && (state || zip)) {
                    formattedString += ",";
                }
                if (state) {
                    formattedString += " " + state;
                }
                if (zip) {
                    formattedString += " " + zip;
                }
                return formattedString;
            };
            RmaController.prototype.sendRmaRequest = function () {
                var _this = this;
                this.errorMessage = "";
                this.requestSubmitted = false;
                this.orderLinesForm.$submitted = true;
                if (!this.orderLinesForm.$valid) {
                    return;
                }
                var rmaModel = {
                    orderNumber: this.order.webOrderNumber || this.order.erpOrderNumber,
                    notes: typeof this.returnNotes === "undefined" ? "" : this.returnNotes,
                    message: "",
                    rmaLines: this.order.orderLines.map(function (orderLine) {
                        return {
                            line: orderLine.lineNumber,
                            rmaQtyRequested: orderLine.rmaQtyRequested,
                            rmaReasonCode: orderLine.returnReason
                        };
                    }).filter(function (x) { return x.rmaQtyRequested > 0; })
                };
                this.orderService.addRma(rmaModel).then(function (rma) { _this.addRmaCompleted(rma); }, function (error) { _this.addRmaFailed(error); });
            };
            RmaController.prototype.addRmaCompleted = function (rma) {
                if (rma.message) {
                    this.resultMessage = rma.message;
                }
                else {
                    this.requestSubmitted = true;
                    this.orderLinesForm.$submitted = false;
                }
                this.coreService.displayModal(angular.element("#popup-rma"));
            };
            RmaController.prototype.addRmaFailed = function (error) {
                this.errorMessage = error.message;
            };
            RmaController.prototype.closePopup = function ($event) {
                $event.preventDefault();
                this.coreService.closeModal("#popup-rma");
            };
            RmaController.prototype.calculateQuantity = function () {
                var _this = this;
                this.totalQuantity = 0;
                this.order.orderLines.forEach(function (orderLine) {
                    _this.totalQuantity += orderLine.rmaQtyRequested > 0 ? 1 : 0;
                });
            };
            RmaController.$inject = ["orderService", "coreService", "queryString"];
            return RmaController;
        }());
        rma_1.RmaController = RmaController;
        angular
            .module("insite")
            .controller("RmaController", RmaController);
    })(rma = insite.rma || (insite.rma = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.rma.controller.js.map