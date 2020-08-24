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
    var rma;
    (function (rma_1) {
        "use strict";
        var BrasselerRmaController = /** @class */ (function (_super) {
            __extends(BrasselerRmaController, _super);
            function BrasselerRmaController(orderService, coreService, queryString, invoiceService, spinnerService) {
                var _this = _super.call(this, orderService, coreService, queryString) || this;
                _this.orderService = orderService;
                _this.coreService = coreService;
                _this.queryString = queryString;
                _this.invoiceService = invoiceService;
                _this.spinnerService = spinnerService;
                _this.init();
                return _this;
            }
            BrasselerRmaController.prototype.init = function () {
                var invoiceNumber = this.queryString.get("invoiceNumber");
                if (invoiceNumber) {
                    if (typeof invoiceNumber === "undefined") {
                        // handle "clean urls" 
                        var pathArray = window.location.pathname.split("/");
                        var pathInvoiceNumber = pathArray[pathArray.length - 1];
                        if (pathInvoiceNumber !== "InvoiceHistoryDetail") {
                            invoiceNumber = pathInvoiceNumber;
                        }
                    }
                    this.getInvoice(invoiceNumber);
                }
                else {
                    this.getOrder();
                }
            };
            BrasselerRmaController.prototype.getOrderCompleted = function (order) {
                this.order = order;
                this.order.orderLines.forEach(function (line) {
                    if (line.rmaQtyReceived > 0) {
                        line.qtyShipped = line.qtyShipped - line.rmaQtyReceived;
                    }
                }); //BUSA-1309 : Subtracting RMA'd products from qtyshipped.
                //BUSA-449 start : RMA requests
                this.customerNumber = this.order.customerSequence != "" ? this.order.customerSequence : this.order.customerNumber;
                //BUSA-449 end : RMA requests
                this.hazardousProducts = order.properties['isHazardousProductInOrderLine'].split(',');
                this.cityCommaStateZipDisplay = this.formatCityCommaStateZip(order.billToCity, order.billToState, order.billToPostalCode);
                setTimeout(function () {
                    setupRMA();
                }, 500);
            };
            //BUSA-678: Add RMA possibility to the invoice history start.
            BrasselerRmaController.prototype.getInvoice = function (invoiceNumber) {
                var _this = this;
                if (this.invoiceService != undefined) {
                    this.invoiceService.getInvoice(invoiceNumber, "invoicelines,shipments").then(function (data) {
                        _this.invoice = data;
                        var invoiceOrderNumber = _this.invoice.invoiceLines[0].erpOrderNumber + '-0';
                        _this.orderService.getOrder(invoiceOrderNumber, "orderlines").then(function (result) {
                            _this.order = result;
                            setTimeout(function () {
                                setupRMA();
                            }, 500);
                            _this.order.orderLines = _this.order.orderLines.filter(function (x) { return _this.invoice.invoiceLines.some(function (y) { return x.productErpNumber == y.productERPNumber; }); });
                            _this.order.orderLines.forEach(function (line) {
                                if (line.rmaQtyReceived > 0) {
                                    line.qtyShipped = line.qtyShipped - line.rmaQtyReceived;
                                }
                            }); //BUSA-1309 : Subtracting RMA'd products from qtyshipped.
                            _this.customerNumber = _this.order.customerSequence != "" ? _this.order.customerSequence : _this.order.customerNumber;
                            _this.hazardousProducts = result.properties['isHazardousProductInOrderLine'].split(',');
                            _this.cityCommaStateZipDisplay = _this.formatCityCommaStateZip(result.billToCity, result.billToState, result.billToPostalCode);
                        });
                    }, function (error) { _this.validationMessage = error.exceptionMessage; });
                }
                //BUSA-678: Add RMA possibility to the invoice history end.
            };
            BrasselerRmaController.prototype.sendRmaRequest = function () {
                this.errorMessage = "";
                this.requestSubmitted = false;
                this.orderLinesForm.$submitted = true;
                if (!this.orderLinesForm.$valid) {
                    return;
                }
                this.spinnerService.show();
                _super.prototype.sendRmaRequest.call(this);
            };
            BrasselerRmaController.prototype.addRmaCompleted = function (rma) {
                var _this = this;
                this.spinnerService.show();
                this.rmaModel = rma;
                var orderId = this.order.erpOrderNumber != "" ? this.order.erpOrderNumber : this.order.webOrderNumber;
                this.orderService.getOrder(orderId, "orderlines").then(function (order) { _this.rmaGetOrderCompleted(order); }, function (error) { _this.rmaGetOrderFailed(error); });
            };
            BrasselerRmaController.prototype.rmaGetOrderCompleted = function (order) {
                this.spinnerService.show();
                this.order.properties['invoiceNumber'] = order.properties['invoiceNumber'];
                if (this.rmaModel.message) {
                    this.resultMessage = this.rmaModel.message;
                }
                else {
                    this.requestSubmitted = true;
                    this.orderLinesForm.$submitted = false;
                    this.order.properties['requestSubmitted'] = order.properties['requestSubmitted'];
                    if (order.properties["rmaHtmlImage"] != undefined) {
                        this.date = new Date();
                        this.rmaLabel = window.atob(order.properties["rmaHtmlImage"]);
                        this.rmaLabel = this.rmaLabel.replace(/ï¿½/g, '');
                        this.rmaLabel = this.rmaLabel.replace(/Â/g, '');
                        $("#rmaLabel").html(this.rmaLabel);
                        var imgObj = $("#rmaLabel").find("img");
                        imgObj[0].setAttribute('src', "data:image/jpg;base64," + order.properties["rmaGraphicImage"]);
                        this.rmaLabel = angular.element("#rmaLabel").html();
                        $("#rmaLabel").empty();
                    }
                    this.coreService.displayModal(angular.element("#popup-rma"));
                }
                this.spinnerService.hide();
            };
            BrasselerRmaController.prototype.rmaGetOrderFailed = function (error) {
            };
            BrasselerRmaController.prototype.printRmaLabel = function () {
                var printLabel = window.open();
                printLabel.document.write($('#print-rma-label').html());
                printLabel.print();
            };
            BrasselerRmaController.prototype.closePopup = function ($event) {
                this.spinnerService.show();
                $event.preventDefault();
                this.coreService.closeModal("#popup-rma");
                window.location.reload();
            };
            BrasselerRmaController.$inject = ["orderService", "coreService", "queryString", "invoiceService", "spinnerService"];
            return BrasselerRmaController;
        }(rma_1.RmaController));
        rma_1.BrasselerRmaController = BrasselerRmaController;
        angular
            .module("insite")
            .controller("RmaController", BrasselerRmaController);
    })(rma = insite.rma || (insite.rma = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.rma.controller.js.map