var insite;
(function (insite) {
    var budget;
    (function (budget_1) {
        "use strict";
        var BudgetCalendarService = /** @class */ (function () {
            function BudgetCalendarService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.budgetCalendarServiceUri = "/api/v1/budgetcalendars/";
            }
            BudgetCalendarService.prototype.getBudgetCalendar = function (fiscalYear) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.budgetCalendarServiceUri + fiscalYear, method: "GET" }), this.getBudgetCalendarCompleted, this.getBudgetCalendarFailed);
            };
            BudgetCalendarService.prototype.getBudgetCalendarCompleted = function (response) {
            };
            BudgetCalendarService.prototype.getBudgetCalendarFailed = function (error) {
            };
            BudgetCalendarService.prototype.updateBudgetCalendar = function (budget) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.budgetCalendarServiceUri + budget.fiscalYear, data: budget }), this.updateBudgetCalendarCompleted, this.updateBudgetCalendarFailed);
            };
            BudgetCalendarService.prototype.updateBudgetCalendarCompleted = function (response) {
            };
            BudgetCalendarService.prototype.updateBudgetCalendarFailed = function (error) {
            };
            BudgetCalendarService.$inject = ["$http", "httpWrapperService"];
            return BudgetCalendarService;
        }());
        budget_1.BudgetCalendarService = BudgetCalendarService;
        angular
            .module("insite")
            .service("budgetCalendarService", BudgetCalendarService);
    })(budget = insite.budget || (insite.budget = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.budget-calendar.service.js.map