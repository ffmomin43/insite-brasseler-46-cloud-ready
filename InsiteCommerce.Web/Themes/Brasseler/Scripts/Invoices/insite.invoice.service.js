var insite;
(function (insite) {
    var invoice;
    (function (invoice) {
        "use strict";
        var InvoiceService = /** @class */ (function () {
            function InvoiceService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/invoices";
            }
            InvoiceService.prototype.getInvoices = function (filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getInvoicesParams(filter, pagination) }), this.getInvoicesCompleted, this.getInvoicesFailed);
            };
            InvoiceService.prototype.getInvoicesParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            InvoiceService.prototype.getInvoicesCompleted = function (response) {
            };
            InvoiceService.prototype.getInvoicesFailed = function (error) {
            };
            InvoiceService.prototype.getInvoice = function (invoiceId, expand) {
                var uri = this.serviceUri + "/" + invoiceId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: uri, params: this.getInvoiceParams(expand) }), this.getInvoiceCompleted, this.getInvoiceFailed);
            };
            InvoiceService.prototype.getInvoiceParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            InvoiceService.prototype.getInvoiceCompleted = function (response) {
            };
            InvoiceService.prototype.getInvoiceFailed = function (error) {
            };
            InvoiceService.$inject = ["$http", "httpWrapperService"];
            return InvoiceService;
        }());
        invoice.InvoiceService = InvoiceService;
        angular
            .module("insite")
            .service("invoiceService", InvoiceService);
    })(invoice = insite.invoice || (insite.invoice = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.invoice.service.js.map