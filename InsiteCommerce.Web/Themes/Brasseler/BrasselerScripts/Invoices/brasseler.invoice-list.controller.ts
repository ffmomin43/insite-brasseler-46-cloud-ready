module insite.invoice {
    "use strict";

    export class BrasselerInvoiceListController extends InvoiceListController {
        searchFilter: invoice.ISearchFilter;
        shipTo: ShipToModel;

        static $inject = [
            "invoiceService",
            "customerService",
            "coreService",
            "paginationService",
            "settingsService"
        ];

        constructor(
            protected invoiceService: invoice.IInvoiceService,
            protected customerService: customers.ICustomerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService) {
            super(invoiceService, customerService, coreService, paginationService, settingsService);
            //this.init();
        }

        init() {
           // super.init();
            this.customerService.getShipTo("").then(data => {
                this.shipTo = data;
                this.searchFilter.customerSequence = this.shipTo.customerSequence;
                this.searchFilter.sort = "InvoiceDate DESC";

                if (this.shipTo.label == "Use Billing Address") {
                    this.customerService.getBillTo("").then(data => {
                        this.shipTo.label = data.label;
                        this.shipTo.label = this.shipTo.label.substr(1, this.shipTo.label.length);
                    });
                }

                this.shipTo.label = this.shipTo.label.substr(1, this.shipTo.label.length);
                this.getInvoices();
            });
            super.init();
        }

        getInvoices() {
            this.invoiceService.getInvoices(this.searchFilter, this.pagination).then(data => {
                this.invoiceHistory = data;
                this.pagination = data.pagination;
            });
        }

        clear() {
            this.pagination.currentPage = 1;
            this.searchFilter = {
                customerSequence: this.shipTo.customerSequence,
                sort: "InvoiceDate DESC",
                fromDate:""
            };
            this.getInvoices();
        }

    }
    angular
        .module("insite")
        .controller("InvoiceListController", BrasselerInvoiceListController);
}