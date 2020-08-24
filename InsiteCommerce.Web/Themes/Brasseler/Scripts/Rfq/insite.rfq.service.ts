import QuoteModel = Insite.Rfq.WebApi.V1.ApiModels.QuoteModel;
import QuoteCollectionModel = Insite.Rfq.WebApi.V1.ApiModels.QuoteCollectionModel;
import QuoteLineModel = Insite.Rfq.WebApi.V1.ApiModels.QuoteLineModel;
import RfqMessageModel = Insite.Rfq.WebApi.V1.ApiModels.MessageModel;
import MessageParameter = Insite.Message.WebApi.V1.ApiModels.MessageParameter;

module insite.rfq {
    "use strict";

    export interface IRfqService {
        expand: string;
        getQuotes(filter: any, pagination: PaginationModel): ng.IPromise<QuoteCollectionModel>;
        getQuote(quoteId: string): ng.IPromise<QuoteModel>;
        submitQuote(quote: QuoteParameter): ng.IPromise<QuoteModel>;
        updateQuote(quote: QuoteParameter): ng.IPromise<QuoteModel>;
        removeQuote(quoteId: string): ng.IPromise<QuoteModel>;
        updateQuoteLine(quoteLine: QuoteLineModel): ng.IPromise<QuoteLineModel>;
        submitRfqMessage(rfqMessage: MessageParameter): ng.IPromise<MessageModel>;
    }

    export class RfqService implements IRfqService {
        expand: string;
        serviceUri = "/api/v1/quotes/";
        messageUri = "/api/v1/messages/";

        static $inject = ["$http", "$q", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $q: ng.IQService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getQuotes(filter: any, pagination: PaginationModel): ng.IPromise<QuoteCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getQuotesParams(filter, pagination) }),
                this.getQuotesCompleted,
                this.getQuotesFailed
            );
        }

        protected getQuotesParams(filter: any, pagination?: PaginationModel): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (this.expand) {
                params.expand = this.expand;
            }

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getQuotesCompleted(response: ng.IHttpPromiseCallbackArg<QuoteCollectionModel>): void {
        }

        protected getQuotesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getQuote(quoteId: string): ng.IPromise<QuoteModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(this.serviceUri + quoteId),
                this.getQuoteCompleted,
                this.getQuoteFailed
            );
        }

        protected getQuoteCompleted(response: ng.IHttpPromiseCallbackArg<QuoteModel>): void {
        }

        protected getQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        submitQuote(quote: QuoteParameter): ng.IPromise<QuoteModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: this.serviceUri, data: quote }),
                this.submitQuoteCompleted,
                this.submitQuoteFailed
            );
        }

        protected submitQuoteCompleted(response: ng.IHttpPromiseCallbackArg<QuoteModel>): void {
        }

        protected submitQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        removeQuote(quoteId: string): ng.IPromise<QuoteModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "DELETE", url: `${this.serviceUri}/${quoteId}` }),
                this.removeQuoteCompleted,
                this.removeQuoteFailed
            );
        }

        protected removeQuoteCompleted(response: ng.IHttpPromiseCallbackArg<QuoteModel>): void {
        }

        protected removeQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateQuote(quote: QuoteParameter): ng.IPromise<QuoteModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: this.serviceUri + quote.quoteId, data: quote }),
                this.updateQuoteCompleted,
                this.updateQuoteFailed
            );
        }

        protected updateQuoteCompleted(response: ng.IHttpPromiseCallbackArg<QuoteModel>): void {
        }

        protected updateQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateQuoteLine(quoteLine: QuoteLineModel): ng.IPromise<QuoteLineModel> {
             return this.httpWrapperService.executeHttpRequest(
                 this,
                 this.$http({ method: "PATCH", url: quoteLine.uri, data: quoteLine }),
                 this.updateQuoteLineCompleted,
                 this.updateQuoteLineFailed
             );
        }

        protected updateQuoteLineCompleted(response: ng.IHttpPromiseCallbackArg<QuoteLineModel>): void {
        }

        protected updateQuoteLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        submitRfqMessage(rfqMessage: MessageParameter): ng.IPromise<MessageModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: this.messageUri, data: rfqMessage }),
                this.submitRfqMessageCompleted,
                this.submitRfqMessageFailed
            );
        }

        protected submitRfqMessageCompleted(response: ng.IHttpPromiseCallbackArg<MessageModel>): void {
        }

        protected submitRfqMessageFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
     }

     angular
         .module("insite")
         .service("rfqService", RfqService);
 }