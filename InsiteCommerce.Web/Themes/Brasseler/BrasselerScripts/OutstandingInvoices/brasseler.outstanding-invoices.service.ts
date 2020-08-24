import GetOutstandingInvoicesDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.GetOutstandingInvoicesDto;
import GetOutstandingOrderDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.GetOutstandingOrderDto;
import OutstandingOrderModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OutstandingOrderModel;
import OutstandingOrder = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OutstandingOrder;
import OrderHeaderModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OrderHeaderModel;
import ArOpenInvoicesResult = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.AROpenInvoicesResultDto;
import ArOpenInvoices = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.AROpenInvoicesDto;
import OpenInvoice = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.Invoices;

module insite.outstandinginvoices {
    "use strict";

    export interface CustomUIFilter {
        invoiceNumberFrm: string;
        invoiceNumberTo: string;
        fromDate: string;
        toDate: string;
        fromDateage: string;
        toDateage: string;
        invoiceAmtFrm: string;
        invoiceAmtTo: string;
    
        
    }
    export interface ISearchFilter {
        outputType: string;
        inputType: string;
        transactionName: string;
        sort: string;
    }

    export interface IOutstandingInvoicesService {
        getInvoices(filter: ISearchFilter, pagination: PaginationModel): ng.IPromise<InvoiceCollectionModel>;
        getInvoice(invoiceId: string, expand: string): ng.IPromise<InvoiceModel>;
        getOutstandingInvoices(filter: ISearchFilter, pagination: PaginationModel, getOutstandingInvoicesDto: GetOutstandingInvoicesDto): ng.IPromise<ArOpenInvoicesResult>;
        getOutstandingBalance(filter: ISearchFilter, getOutstandingInvoicesDto: GetOutstandingInvoicesDto): ng.IPromise<any>;
        getOutstandingOrder(filter: ISearchFilter, getOutstandingOrderDto: GetOutstandingOrderDto): ng.IPromise<OutstandingOrderModel>;
    }

    export class OutstandingInvoicesService implements IOutstandingInvoicesService {
        serviceUri = "/api/v1/outstandinginvoices";
        orderUri = "/api/v1/getoutstandingorder";
        static $inject = ["$http", "$rootScope", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected httpWrapperService: core.HttpWrapperService
        ) {
        }

        getInvoices(filter: ISearchFilter, pagination: PaginationModel): ng.IPromise<InvoiceCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getInvoicesParams(filter, pagination) }),
                this.getInvoicesCompleted,
                this.getInvoicesFailed);
        }

        getOutstandingInvoices(filter: ISearchFilter, pagination: PaginationModel, getOutstandingInvoicesDto: GetOutstandingInvoicesDto): ng.IPromise<ArOpenInvoicesResult> {
            const postUrl = this.serviceUri;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: getOutstandingInvoicesDto, params: this.getOutstandingInvoicesParams(filter, pagination), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<ArOpenInvoicesResult>) => { this.outstandingInvoicesDTOCompleted(response); },
                this.outstandingInvoicesDTOFailed);
        }

        protected outstandingInvoicesDTOCompleted(response: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected outstandingInvoicesDTOFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected getOutstandingInvoicesParams(filter: ISearchFilter, pagination: PaginationModel): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        getOutstandingBalance(filter: ISearchFilter, getOutstandingInvoicesDto: GetOutstandingInvoicesDto): ng.IPromise<any> {
            const postUrl = this.serviceUri;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: getOutstandingInvoicesDto, params: this.getOutstandingBalanceParams(filter), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<any>) => { this.getOutstandingBalanceDTOCompleted(response); },
                this.getOutstandingBalanceDTOFailed);
        }

        protected getOutstandingBalanceParams(filter: ISearchFilter): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};
            return params;
        }

        protected getOutstandingBalanceDTOCompleted(response: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected getOutstandingBalanceDTOFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getOutstandingOrder(filter: ISearchFilter, getOutstandingOrderDto: GetOutstandingOrderDto): ng.IPromise<OutstandingOrderModel> {
            const postUrl = this.orderUri;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: getOutstandingOrderDto, params: this.getOutstandingBalanceParams(filter), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<OutstandingOrderModel>) => { this.getOutstandingOrderCompleted(response); },
                this.getOutstandingOrderFailed);
        }

        protected getOutstandingOrderParams(filter: ISearchFilter): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};
            return params;
        }

        protected getOutstandingOrderCompleted(response: ng.IHttpPromiseCallbackArg<OutstandingOrderModel>): void {
        }

        protected getOutstandingOrderFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
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
        .service("outstandingInvoicesService", OutstandingInvoicesService);
}