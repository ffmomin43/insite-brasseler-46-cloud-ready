var insite;
(function (insite) {
    var invoice;
    (function (invoice) {
        "use strict";
        var InvoiceListController = /** @class */ (function () {
            function InvoiceListController(invoiceService, customerService, coreService, paginationService, settingsService) {
                this.invoiceService = invoiceService;
                this.customerService = customerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.paginationStorageKey = "DefaultPagination-InvoiceList";
            }
            InvoiceListController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            InvoiceListController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.customerSettings = settingsCollection.customerSettings;
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.searchFilter = this.getDefaultSearchFilter();
                this.setInitialFromDate(settingsCollection.invoiceSettings.lookBackDays);
                this.restoreHistory();
                this.getBillTo();
                this.getInvoices();
            };
            InvoiceListController.prototype.getSettingsFailed = function (error) {
            };
            InvoiceListController.prototype.getBillTo = function () {
                var _this = this;
                var expand = "shiptos";
                if (this.customerSettings.displayAccountsReceivableBalances) {
                    expand = expand + ",accountsreceivable";
                }
                this.customerService.getBillTo(expand).then(function (billTo) { _this.getBillToCompleted(billTo); }, function (error) { _this.getBillToFailed(error); });
            };
            InvoiceListController.prototype.getBillToCompleted = function (billTo) {
                this.billTo = billTo;
                this.billTo.shipTos = this.billTo.shipTos.filter(function (o) { return !o.isNew; });
            };
            InvoiceListController.prototype.getBillToFailed = function (error) {
            };
            InvoiceListController.prototype.clear = function () {
                this.pagination.page = 1;
                this.searchFilter = this.getDefaultSearchFilter();
                this.getInvoices();
            };
            InvoiceListController.prototype.changeSort = function (sort) {
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort + " DESC";
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getInvoices();
            };
            InvoiceListController.prototype.search = function () {
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                this.getInvoices();
            };
            InvoiceListController.prototype.getInvoices = function () {
                var _this = this;
                this.updateHistory();
                this.invoiceService.getInvoices(this.searchFilter, this.pagination).then(function (invoiceCollection) { _this.getInvoicesCompleted(invoiceCollection); }, function (error) { _this.getInvoicesFailed(error); });
            };
            InvoiceListController.prototype.getInvoicesCompleted = function (invoiceCollection) {
                this.invoiceHistory = invoiceCollection;
                this.pagination = invoiceCollection.pagination;
            };
            InvoiceListController.prototype.getInvoicesFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            InvoiceListController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.filter) {
                        this.searchFilter = state.filter;
                    }
                }
            };
            InvoiceListController.prototype.updateHistory = function () {
                this.coreService.pushState({ filter: this.searchFilter, pagination: this.pagination });
            };
            InvoiceListController.prototype.setInitialFromDate = function (lookBackDays) {
                if (lookBackDays > 0) {
                    var tzOffset = (new Date()).getTimezoneOffset() * 60000;
                    var date = new Date(Date.now() - lookBackDays * 60 * 60 * 24 * 1000 - tzOffset);
                    this.searchFilter.fromDate = date.toISOString().split("T")[0];
                }
            };
            InvoiceListController.prototype.getDefaultSearchFilter = function () {
                return {
                    customerSequence: "-1",
                    sort: "InvoiceDate DESC",
                    fromDate: ""
                };
            };
            InvoiceListController.$inject = ["invoiceService", "customerService", "coreService", "paginationService", "settingsService"];
            return InvoiceListController;
        }());
        invoice.InvoiceListController = InvoiceListController;
        angular
            .module("insite")
            .controller("InvoiceListController", InvoiceListController);
    })(invoice = insite.invoice || (insite.invoice = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.invoice-list.controller.js.map