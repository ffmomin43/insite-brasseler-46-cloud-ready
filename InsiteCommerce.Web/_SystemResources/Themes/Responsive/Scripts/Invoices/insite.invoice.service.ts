import InvoiceModel = Insite.Invoice.WebApi.V1.ApiModels.InvoiceModel;
import InvoiceCollectionModel = Insite.Invoice.WebApi.V1.ApiModels.InvoiceCollectionModel;

module insite.invoice {
    "use strict";

    export interface ISearchFilter {
        customerSequence: string;
        sort: string;
        fromDate: string;
    }

    export interface IInvoiceService {
        getInvoices(filter: ISearchFilter, pagination: PaginationModel): ng.IPromise<InvoiceCollectionModel>;
        getInvoice(invoiceId: string, expand: string): ng.IPromise<InvoiceModel>;
    }

    export class InvoiceService implements IInvoiceService {
        serviceUri = "/api/v1/invoices";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getInvoices(filter: ISearchFilter, pagination: PaginationModel): ng.IPromise<InvoiceCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getInvoicesParams(filter, pagination) }),
                this.getInvoicesCompleted,
                this.getInvoicesFailed);
        }

        protected getInvoicesParams(filter: ISearchFilter, pagination: PaginationModel): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getInvoicesCompleted(response: ng.IHttpPromiseCallbackArg<InvoiceCollectionModel>): void {
        }

        protected getInvoicesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getInvoice(invoiceId: string, expand: string): ng.IPromise<InvoiceModel> {
            const uri = `${this.serviceUri}/${invoiceId}`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: uri, params: this.getInvoiceParams(expand) }),
                this.getInvoiceCompleted,
                this.getInvoiceFailed);
        }

        protected getInvoiceParams(expand: string): any {
            return expand ? { expand: expand } : {};
        }

        protected getInvoiceCompleted(response: ng.IHttpPromiseCallbackArg<InvoiceModel>): void {
        }

        protected getInvoiceFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("invoiceService", InvoiceService);
}