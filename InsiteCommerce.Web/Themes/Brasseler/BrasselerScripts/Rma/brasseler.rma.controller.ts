
module insite.rma {
    "use strict";
    declare var setupRMA: any;

    export class BrasselerRmaController extends RmaController {
        cityCommaStateZipDisplay: string;
        resultMessage: string;
        errorMessage: string;
        returnNotes: string;
        order: OrderModel;
        //BUSA-449 start : RMA requests
        customerNumber: string;
        //BUSA-449 end : RMA requests
        hazardousProducts: string[];
        invoice: InvoiceModel;
        validationMessage: string;
        rmaLabel: string;
        rmaModel: RmaModel;
        date: Date;

        static $inject = ["orderService", "coreService", "queryString", "invoiceService", "spinnerService"];

        constructor(
            protected orderService: order.IOrderService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected invoiceService: invoice.IInvoiceService,
            protected spinnerService: core.ISpinnerService) {
            super(orderService, coreService, queryString)

            this.init();
        }

        init(): void {
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
            } else {
                this.getOrder();

            }
        }

        protected getOrderCompleted(order: OrderModel): void {
            this.order = order;
            this.order.orderLines.forEach(line => {
                if (line.rmaQtyReceived > 0) {
                    line.qtyShipped = line.qtyShipped - line.rmaQtyReceived;
                }
            });//BUSA-1309 : Subtracting RMA'd products from qtyshipped.
            //BUSA-449 start : RMA requests
            this.customerNumber = this.order.customerSequence != "" ? this.order.customerSequence : this.order.customerNumber;
            //BUSA-449 end : RMA requests
            this.hazardousProducts = order.properties['isHazardousProductInOrderLine'].split(',');
            this.cityCommaStateZipDisplay = this.formatCityCommaStateZip(order.billToCity, order.billToState, order.billToPostalCode);
            setTimeout(function () {
                setupRMA();
            }, 500);
        }

        //BUSA-678: Add RMA possibility to the invoice history start.
        getInvoice(invoiceNumber: string) {
            if (this.invoiceService != undefined) {
                this.invoiceService.getInvoice(invoiceNumber, "invoicelines,shipments").then((data: InvoiceModel) => {
                    this.invoice = data;
                    var invoiceOrderNumber = this.invoice.invoiceLines[0].erpOrderNumber + '-0';
                    this.orderService.getOrder(invoiceOrderNumber, "orderlines").then(result=> {
                        this.order = result;
                        setTimeout(function () {
                            setupRMA();
                        }, 500);

                        this.order.orderLines = this.order.orderLines.filter(x => this.invoice.invoiceLines.some(y => x.productErpNumber == y.productERPNumber));
                        this.order.orderLines.forEach(line => {
                            if (line.rmaQtyReceived > 0)
                            {
                                line.qtyShipped = line.qtyShipped - line.rmaQtyReceived;
                            }
                        });//BUSA-1309 : Subtracting RMA'd products from qtyshipped.
                        this.customerNumber = this.order.customerSequence != "" ? this.order.customerSequence : this.order.customerNumber;
                        this.hazardousProducts = result.properties['isHazardousProductInOrderLine'].split(',');
                        this.cityCommaStateZipDisplay = this.formatCityCommaStateZip(result.billToCity, result.billToState, result.billToPostalCode);

                    });

                }, (error: any) => { this.validationMessage = error.exceptionMessage; });
                
            }
            //BUSA-678: Add RMA possibility to the invoice history end.
        }

        sendRmaRequest(): void {
            this.errorMessage = "";
            this.requestSubmitted = false;
            this.orderLinesForm.$submitted = true;

            if (!this.orderLinesForm.$valid) {
                return;
            }
            this.spinnerService.show();
            super.sendRmaRequest();
        }

        protected addRmaCompleted(rma: RmaModel): void
        {
            this.spinnerService.show();
            this.rmaModel = rma;
            var orderId = this.order.erpOrderNumber != "" ? this.order.erpOrderNumber : this.order.webOrderNumber;
            this.orderService.getOrder(orderId, "orderlines").then(
                (order: OrderModel) => { this.rmaGetOrderCompleted(order); },
                (error: any) => { this.rmaGetOrderFailed(error); });
        }

        protected rmaGetOrderCompleted(order: OrderModel): void {
            this.spinnerService.show();
            this.order.properties['invoiceNumber'] = order.properties['invoiceNumber'];
                if (this.rmaModel.message) {
                    this.resultMessage = this.rmaModel.message;
                } else {
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
        }

        protected rmaGetOrderFailed(error: any): void {
        }

        printRmaLabel(): void {
            var printLabel = window.open();
            printLabel.document.write($('#print-rma-label').html());
            printLabel.print();
        }

        closePopup($event): void {
            this.spinnerService.show();
            $event.preventDefault();
            this.coreService.closeModal("#popup-rma");
            window.location.reload();
        }
    }

    angular
        .module("insite")
        .controller("RmaController", BrasselerRmaController);
}