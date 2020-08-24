import JobQuoteModel = Insite.JobQuote.WebApi.V1.ApiModels.JobQuoteModel;
import JobQuoteCollectionModel = Insite.JobQuote.WebApi.V1.ApiModels.JobQuoteCollectionModel;

module insite.jobquote {
    "use strict";

    export interface IJobQuoteService {
        getJobQuotes(): ng.IPromise<JobQuoteCollectionModel>;
        getJobQuote(jobQuoteId): ng.IPromise<JobQuoteModel>;
        patchJobQuote(jobQuoteId, jobQuoteInfo): ng.IPromise<JobQuoteModel>;
    }

    export class JobQuoteService implements IJobQuoteService {
        jobQuoteServiceUri = "/api/v1/jobquotes/";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getJobQuotes(): ng.IPromise<JobQuoteCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(this.jobQuoteServiceUri),
                this.getJobQuotesCompleted,
                this.getJobQuotesFailed
            );
        }

        protected getJobQuotesCompleted(response: ng.IHttpPromiseCallbackArg<JobQuoteCollectionModel>): void {
        }

        protected getJobQuotesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getJobQuote(jobQuoteId): ng.IPromise<JobQuoteModel> {
            const uri = this.jobQuoteServiceUri + jobQuoteId;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(uri),
                this.getJobQuoteCompleted,
                this.getJobQuoteFailed
            );
        }

        protected getJobQuoteCompleted(response: ng.IHttpPromiseCallbackArg<JobQuoteModel>): void {
        }

        protected getJobQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        patchJobQuote(jobQuoteId, quoteInfo): ng.IPromise<JobQuoteModel> {
            const uri = this.jobQuoteServiceUri + jobQuoteId;
            const jsQuoteInfo = angular.toJson(quoteInfo);
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: uri, data: jsQuoteInfo }),
                this.patchJobQuoteCompleted,
                this.patchJobQuoteFailed
            );
        }

        protected patchJobQuoteCompleted(response: ng.IHttpPromiseCallbackArg<JobQuoteModel>): void {
        }

        protected patchJobQuoteFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("jobQuoteService", JobQuoteService);
}