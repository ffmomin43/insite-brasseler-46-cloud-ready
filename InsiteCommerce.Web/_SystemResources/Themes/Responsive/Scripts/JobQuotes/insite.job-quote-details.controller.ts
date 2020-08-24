import JobQuoteLineModel = Insite.JobQuote.WebApi.V1.ApiModels.JobQuoteLineModel;

module insite.jobquote {
    "use strict";

    export interface ISignInControllerAttributes extends ng.IAttributes {
        checkoutAddressUrl: string;
    }

    export class JobQuoteDetailsController {
        jobQuoteId: string;
        job: JobQuoteModel;
        calculationMethod: any;
        checkoutAddressUrl: string;
        validationMessage: string;

        static $inject = ["jobQuoteService", "$attrs", "queryString"];

        constructor(
            protected jobQuoteService: jobquote.IJobQuoteService,
            protected $attrs: ISignInControllerAttributes,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            this.checkoutAddressUrl = this.$attrs.checkoutAddressUrl;
            this.jobQuoteId = this.queryString.get("jobQuoteId");
            this.getJob();
        }

        getJob(): void {
            this.jobQuoteService.getJobQuote(this.jobQuoteId).then(
                (jobQuote: JobQuoteModel) => { this.getJobQuoteCompleted(jobQuote); },
                (error: any) => { this.getJobQuoteFailed(error); });
        }

        protected getJobQuoteCompleted(jobQuote: JobQuoteModel): void {
            this.job = jobQuote;
        }

        protected getJobQuoteFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        quantityRemaining(jobQuoteLine: JobQuoteLineModel): number {
            return jobQuoteLine.qtyOrdered - jobQuoteLine.qtySold;
        }

        orderTotal(): number {
            let orderTotal = 0;
            if (this.job) {
                $.each(this.job.jobQuoteLineCollection, (name: number, value: JobQuoteLineModel) => {
                    orderTotal += value.pricing.unitNetPrice * value.qtyRequested;
                });
            }

            return orderTotal;
        }

        generateOrder(): void {
            const form = angular.element("#jobQuoteDetails");
            if (form && form.length !== 0) {
                if (form.validate().form()) {
                    const parameters = {
                        jobQuoteId: this.jobQuoteId,
                        jobQuoteLineCollection: this.job.jobQuoteLineCollection.map(line => ({ id: line.id, qtyOrdered: line.qtyRequested } as CartLineModel))
                    };

                    this.jobQuoteService.patchJobQuote(this.jobQuoteId, parameters).then(
                        (jobQuote: JobQuoteModel) => { this.patchJobQuoteCompleted(jobQuote); },
                        (error: any) => { this.patchJobQuoteFailed(error); });
                }
            }
        }

        protected patchJobQuoteCompleted(jobQuote: JobQuoteModel): void {
            location.href = `${this.checkoutAddressUrl}?cartId=${jobQuote.id}`;
        }

        protected patchJobQuoteFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("JobQuoteDetailsController", JobQuoteDetailsController);
}