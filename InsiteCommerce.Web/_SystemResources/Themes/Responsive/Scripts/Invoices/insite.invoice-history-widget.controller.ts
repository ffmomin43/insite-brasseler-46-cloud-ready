module insite.invoice {
    "use strict";

    export class InvoiceHistoryWidgetController {
        invoiceHistory: InvoiceCollectionModel;
        showInvoices: boolean;
        openActionsMenuId: string;

        static $inject = ["invoiceService", "coreService", "settingsService"];

        constructor(
            protected invoiceService: invoice.IInvoiceService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.showInvoices = settingsCollection.invoiceSettings.showInvoices;
            if (this.showInvoices) {
                this.getInvoices();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        getInvoices(): void {
            const searchFilter: ISearchFilter = {
                customerSequence: "-1",
                sort: "InvoiceDate DESC",
                fromDate: ""
            };

            const pagination = {
                page: 1,
                pageSize: 5
            } as PaginationModel;

            this.invoiceService.getInvoices(searchFilter, pagination).then(
                (invoiceCollection) => { this.getInvoicesCompleted(invoiceCollection); },
                (error) => { this.getInvoicesFailed(error); });
        }

        protected getInvoicesCompleted(invoiceCollection: InvoiceCollectionModel): void {
            this.invoiceHistory = invoiceCollection;
        }

        protected getInvoicesFailed(error: any): void {
        }

        showShareModal(event, index: number): void {
            this.coreService.displayModal($(event.target).closest(".widget-invoice-history").find(`[id=shareEntityPopupContainer]:eq(${index})`));
        }
    }

    angular
        .module("insite")
        .controller("InvoiceHistoryWidgetController", InvoiceHistoryWidgetController);
}