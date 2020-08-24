var insite;
(function (insite) {
    var jobquote;
    (function (jobquote) {
        "use strict";
        var JobQuoteDetailsController = /** @class */ (function () {
            function JobQuoteDetailsController(jobQuoteService, $attrs, queryString) {
                this.jobQuoteService = jobQuoteService;
                this.$attrs = $attrs;
                this.queryString = queryString;
            }
            JobQuoteDetailsController.prototype.$onInit = function () {
                this.checkoutAddressUrl = this.$attrs.checkoutAddressUrl;
                this.jobQuoteId = this.queryString.get("jobQuoteId");
                this.getJob();
            };
            JobQuoteDetailsController.prototype.getJob = function () {
                var _this = this;
                this.jobQuoteService.getJobQuote(this.jobQuoteId).then(function (jobQuote) { _this.getJobQuoteCompleted(jobQuote); }, function (error) { _this.getJobQuoteFailed(error); });
            };
            JobQuoteDetailsController.prototype.getJobQuoteCompleted = function (jobQuote) {
                this.job = jobQuote;
            };
            JobQuoteDetailsController.prototype.getJobQuoteFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            JobQuoteDetailsController.prototype.quantityRemaining = function (jobQuoteLine) {
                return jobQuoteLine.qtyOrdered - jobQuoteLine.qtySold;
            };
            JobQuoteDetailsController.prototype.orderTotal = function () {
                var orderTotal = 0;
                if (this.job) {
                    $.each(this.job.jobQuoteLineCollection, function (name, value) {
                        orderTotal += value.pricing.unitNetPrice * value.qtyRequested;
                    });
                }
                return orderTotal;
            };
            JobQuoteDetailsController.prototype.generateOrder = function () {
                var _this = this;
                var form = angular.element("#jobQuoteDetails");
                if (form && form.length !== 0) {
                    if (form.validate().form()) {
                        var parameters = {
                            jobQuoteId: this.jobQuoteId,
                            jobQuoteLineCollection: this.job.jobQuoteLineCollection.map(function (line) { return ({ id: line.id, qtyOrdered: line.qtyRequested }); })
                        };
                        this.jobQuoteService.patchJobQuote(this.jobQuoteId, parameters).then(function (jobQuote) { _this.patchJobQuoteCompleted(jobQuote); }, function (error) { _this.patchJobQuoteFailed(error); });
                    }
                }
            };
            JobQuoteDetailsController.prototype.patchJobQuoteCompleted = function (jobQuote) {
                location.href = this.checkoutAddressUrl + "?cartId=" + jobQuote.id;
            };
            JobQuoteDetailsController.prototype.patchJobQuoteFailed = function (error) {
            };
            JobQuoteDetailsController.$inject = ["jobQuoteService", "$attrs", "queryString"];
            return JobQuoteDetailsController;
        }());
        jobquote.JobQuoteDetailsController = JobQuoteDetailsController;
        angular
            .module("insite")
            .controller("JobQuoteDetailsController", JobQuoteDetailsController);
    })(jobquote = insite.jobquote || (insite.jobquote = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.job-quote-details.controller.js.map