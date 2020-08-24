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
    var invoice;
    (function (invoice) {
        "use strict";
        var BrasselerInvoiceListController = /** @class */ (function (_super) {
            __extends(BrasselerInvoiceListController, _super);
            function BrasselerInvoiceListController(invoiceService, customerService, coreService, paginationService, settingsService) {
                var _this = _super.call(this, invoiceService, customerService, coreService, paginationService, settingsService) || this;
                _this.invoiceService = invoiceService;
                _this.customerService = customerService;
                _this.coreService = coreService;
                _this.paginationService = paginationService;
                _this.settingsService = settingsService;
                return _this;
                //this.init();
            }
            BrasselerInvoiceListController.prototype.init = function () {
                var _this = this;
                // super.init();
                this.customerService.getShipTo("").then(function (data) {
                    _this.shipTo = data;
                    _this.searchFilter.customerSequence = _this.shipTo.customerSequence;
                    _this.searchFilter.sort = "InvoiceDate DESC";
                    if (_this.shipTo.label == "Use Billing Address") {
                        _this.customerService.getBillTo("").then(function (data) {
                            _this.shipTo.label = data.label;
                            _this.shipTo.label = _this.shipTo.label.substr(1, _this.shipTo.label.length);
                        });
                    }
                    _this.shipTo.label = _this.shipTo.label.substr(1, _this.shipTo.label.length);
                    _this.getInvoices();
                });
                _super.prototype.init.call(this);
            };
            BrasselerInvoiceListController.prototype.getInvoices = function () {
                var _this = this;
                this.invoiceService.getInvoices(this.searchFilter, this.pagination).then(function (data) {
                    _this.invoiceHistory = data;
                    _this.pagination = data.pagination;
                });
            };
            BrasselerInvoiceListController.prototype.clear = function () {
                this.pagination.currentPage = 1;
                this.searchFilter = {
                    customerSequence: this.shipTo.customerSequence,
                    sort: "InvoiceDate DESC",
                    fromDate: ""
                };
                this.getInvoices();
            };
            BrasselerInvoiceListController.$inject = [
                "invoiceService",
                "customerService",
                "coreService",
                "paginationService",
                "settingsService"
            ];
            return BrasselerInvoiceListController;
        }(invoice.InvoiceListController));
        invoice.BrasselerInvoiceListController = BrasselerInvoiceListController;
        angular
            .module("insite")
            .controller("InvoiceListController", BrasselerInvoiceListController);
    })(invoice = insite.invoice || (insite.invoice = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.invoice-list.controller.js.map