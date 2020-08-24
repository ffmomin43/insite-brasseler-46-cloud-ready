import BudgetCalendarModel = Insite.Budget.WebApi.V1.ApiModels.BudgetCalendarModel;

module insite.budget {
    "use strict";

    export interface IBudgetCalendarService {
        getBudgetCalendar(fiscalYear: number): ng.IPromise<BudgetCalendarModel>;
        updateBudgetCalendar(budget: BudgetCalendarModel): ng.IPromise<BudgetCalendarModel>;
    }

    export class BudgetCalendarService implements IBudgetCalendarService {
        budgetCalendarServiceUri = "/api/v1/budgetcalendars/";

        static $inject = ["$http", "httpWrapperService"];
        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getBudgetCalendar(fiscalYear: number): ng.IPromise<BudgetCalendarModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.budgetCalendarServiceUri + fiscalYear, method: "GET" }),
                this.getBudgetCalendarCompleted,
                this.getBudgetCalendarFailed
            );
        }

        protected getBudgetCalendarCompleted(response: ng.IHttpPromiseCallbackArg<BudgetCalendarModel>): void {
        }

        protected getBudgetCalendarFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateBudgetCalendar(budget: BudgetCalendarModel): ng.IPromise<BudgetCalendarModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: this.budgetCalendarServiceUri + budget.fiscalYear, data: budget }),
                this.updateBudgetCalendarCompleted,
                this.updateBudgetCalendarFailed
            );
        }

        protected updateBudgetCalendarCompleted(response: ng.IHttpPromiseCallbackArg<BudgetCalendarModel>): void {
        }

        protected updateBudgetCalendarFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("budgetCalendarService", BudgetCalendarService);
}