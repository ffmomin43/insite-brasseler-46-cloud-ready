module insite.jobquote {
    "use strict";

    export class MyJobQuotesController {
        jobs: any;

        static $inject = ["jobQuoteService"];

        constructor(protected jobQuoteService: jobquote.IJobQuoteService) {
        }

        $onInit(): void {
            this.getJobs();
        }

        getJobs(): any {
            this.jobQuoteService.getJobQuotes().then(
                (jobQuoteCollection: JobQuoteCollectionModel) => { this.getJobQuotesCompleted(jobQuoteCollection); },
                (error: any) => { this.getJobQuotesFailed(error); });
        }

        protected getJobQuotesCompleted(jobQuoteCollection: JobQuoteCollectionModel): void {
            this.jobs = jobQuoteCollection.jobQuotes;
        }

        protected getJobQuotesFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("MyJobQuotesController", MyJobQuotesController);
}