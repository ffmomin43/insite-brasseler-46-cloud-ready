var insite;
(function (insite) {
    var invoice;
    (function (invoice_1) {
        "use strict";
        var InvoiceDetailController = /** @class */ (function () {
            function InvoiceDetailController(invoiceService, coreService, queryString) {
                this.invoiceService = invoiceService;
                this.coreService = coreService;
                this.queryString = queryString;
            }
            InvoiceDetailController.prototype.$onInit = function () {
                this.getInvoice();
            };
            InvoiceDetailController.prototype.getInvoice = function () {
                var _this = this;
                this.invoiceService.getInvoice(this.getInvoiceNumber(), "invoicelines,shipments").then(function (invoice) { _this.getInvoiceCompleted(invoice); }, function (error) { _this.getInvoiceFailed(error); });
            };
            InvoiceDetailController.prototype.getInvoiceNumber = function () {
                var invoiceNumber = this.queryString.get("invoiceNumber");
                if (typeof invoiceNumber === "undefined") {
                    var pathArray = window.location.pathname.split("/");
                    var pathInvoiceNumber = pathArray[pathArray.length - 1];
                    if (pathInvoiceNumber !== "InvoiceHistoryDetail") {
                        invoiceNumber = pathInvoiceNumber;
                    }
                }
                return invoiceNumber;
            };
            InvoiceDetailController.prototype.getInvoiceCompleted = function (invoice) {
                this.invoice = invoice;
                this.btFormat = this.formatCityCommaStateZip(this.invoice.billToCity, this.invoice.billToState, this.invoice.billToPostalCode);
                this.stFormat = this.formatCityCommaStateZip(this.invoice.shipToCity, this.invoice.shipToState, this.invoice.shipToPostalCode);
            };
            InvoiceDetailController.prototype.getInvoiceFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            InvoiceDetailController.prototype.formatCityCommaStateZip = function (city, state, zip) {
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
            InvoiceDetailController.prototype.showShareModal = function () {
                this.coreService.displayModal("#shareEntityPopupContainer");
            };
            InvoiceDetailController.$inject = ["invoiceService", "coreService", "queryString"];
            return InvoiceDetailController;
        }());
        invoice_1.InvoiceDetailController = InvoiceDetailController;
        angular
            .module("insite")
            .controller("InvoiceDetailController", InvoiceDetailController);
    })(invoice = insite.invoice || (insite.invoice = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.invoice-detail.controller.js.map