import BudgetModel = Insite.Budget.WebApi.V1.ApiModels.BudgetModel;

module insite.budget {
    "use strict";

    export interface IBudgetService {
        getReviews(userProfileId: string, shipToId: string, fiscalYear: number, fullGrid: boolean): ng.IPromise<BudgetModel>;
        updateBudget(budget: BudgetModel): ng.IPromise<BudgetModel>;
    }

    export class BudgetService implements IBudgetService {
        budgetServiceUri = "/api/v1/budgets/";

        static $inject = ["$http", "httpWrapperService"];
        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getReviews(userProfileId: string, shipToId: string, fiscalYear: number, fullGrid: boolean): ng.IPromise<BudgetModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.budgetServiceUri + fiscalYear, method: "GET", params: this.getReviewsParams(userProfileId, shipToId, fiscalYear, fullGrid) }),
                this.getReviewsCompleted,
                this.getReviewsFailed
            );
        }

        protected getReviewsParams(userProfileId: string, shipToId: string, fiscalYear: number, fullGrid: boolean): any {
            return {
                userProfileId: userProfileId,
                shipToId: shipToId,
                fiscalYear: fiscalYear,
                fullGrid: fullGrid
            };
        }

        protected getReviewsCompleted(response: ng.IHttpPromiseCallbackArg<BudgetModel>): void {
        }

        protected getReviewsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateBudget(budget: BudgetModel): ng.IPromise<BudgetModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: this.budgetServiceUri + budget.fiscalYear, data: budget }),
                this.updateBudgeCompleted,
                this.updateBudgetFailed
            );
        }

        protected updateBudgeCompleted(response: ng.IHttpPromiseCallbackArg<BudgetModel>): void {
        }

        protected updateBudgetFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("budgetService", BudgetService);
}