var insite;
(function (insite) {
    var jobquote;
    (function (jobquote) {
        "use strict";
        var JobQuoteService = /** @class */ (function () {
            function JobQuoteService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.jobQuoteServiceUri = "/api/v1/jobquotes/";
            }
            JobQuoteService.prototype.getJobQuotes = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.jobQuoteServiceUri), this.getJobQuotesCompleted, this.getJobQuotesFailed);
            };
            JobQuoteService.prototype.getJobQuotesCompleted = function (response) {
            };
            JobQuoteService.prototype.getJobQuotesFailed = function (error) {
            };
            JobQuoteService.prototype.getJobQuote = function (jobQuoteId) {
                var uri = this.jobQuoteServiceUri + jobQuoteId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(uri), this.getJobQuoteCompleted, this.getJobQuoteFailed);
            };
            JobQuoteService.prototype.getJobQuoteCompleted = function (response) {
            };
            JobQuoteService.prototype.getJobQuoteFailed = function (error) {
            };
            JobQuoteService.prototype.patchJobQuote = function (jobQuoteId, quoteInfo) {
                var uri = this.jobQuoteServiceUri + jobQuoteId;
                var jsQuoteInfo = angular.toJson(quoteInfo);
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: uri, data: jsQuoteInfo }), this.patchJobQuoteCompleted, this.patchJobQuoteFailed);
            };
            JobQuoteService.prototype.patchJobQuoteCompleted = function (response) {
            };
            JobQuoteService.prototype.patchJobQuoteFailed = function (error) {
            };
            JobQuoteService.$inject = ["$http", "httpWrapperService"];
            return JobQuoteService;
        }());
        jobquote.JobQuoteService = JobQuoteService;
        angular
            .module("insite")
            .service("jobQuoteService", JobQuoteService);
    })(jobquote = insite.jobquote || (insite.jobquote = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.job-quote.service.js.map