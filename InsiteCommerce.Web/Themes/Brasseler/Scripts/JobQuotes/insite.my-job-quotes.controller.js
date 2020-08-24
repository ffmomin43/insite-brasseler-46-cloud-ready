var insite;
(function (insite) {
    var jobquote;
    (function (jobquote) {
        "use strict";
        var MyJobQuotesController = /** @class */ (function () {
            function MyJobQuotesController(jobQuoteService) {
                this.jobQuoteService = jobQuoteService;
            }
            MyJobQuotesController.prototype.$onInit = function () {
                this.getJobs();
            };
            MyJobQuotesController.prototype.getJobs = function () {
                var _this = this;
                this.jobQuoteService.getJobQuotes().then(function (jobQuoteCollection) { _this.getJobQuotesCompleted(jobQuoteCollection); }, function (error) { _this.getJobQuotesFailed(error); });
            };
            MyJobQuotesController.prototype.getJobQuotesCompleted = function (jobQuoteCollection) {
                this.jobs = jobQuoteCollection.jobQuotes;
            };
            MyJobQuotesController.prototype.getJobQuotesFailed = function (error) {
            };
            MyJobQuotesController.$inject = ["jobQuoteService"];
            return MyJobQuotesController;
        }());
        jobquote.MyJobQuotesController = MyJobQuotesController;
        angular
            .module("insite")
            .controller("MyJobQuotesController", MyJobQuotesController);
    })(jobquote = insite.jobquote || (insite.jobquote = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-job-quotes.controller.js.map