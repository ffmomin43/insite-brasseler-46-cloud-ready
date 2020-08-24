var insite;
(function (insite) {
    var budget;
    (function (budget_1) {
        "use strict";
        var BudgetService = /** @class */ (function () {
            function BudgetService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.budgetServiceUri = "/api/v1/budgets/";
            }
            BudgetService.prototype.getReviews = function (userProfileId, shipToId, fiscalYear, fullGrid) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.budgetServiceUri + fiscalYear, method: "GET", params: this.getReviewsParams(userProfileId, shipToId, fiscalYear, fullGrid) }), this.getReviewsCompleted, this.getReviewsFailed);
            };
            BudgetService.prototype.getReviewsParams = function (userProfileId, shipToId, fiscalYear, fullGrid) {
                return {
                    userProfileId: userProfileId,
                    shipToId: shipToId,
                    fiscalYear: fiscalYear,
                    fullGrid: fullGrid
                };
            };
            BudgetService.prototype.getReviewsCompleted = function (response) {
            };
            BudgetService.prototype.getReviewsFailed = function (error) {
            };
            BudgetService.prototype.updateBudget = function (budget) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.budgetServiceUri + budget.fiscalYear, data: budget }), this.updateBudgeCompleted, this.updateBudgetFailed);
            };
            BudgetService.prototype.updateBudgeCompleted = function (response) {
            };
            BudgetService.prototype.updateBudgetFailed = function (error) {
            };
            BudgetService.$inject = ["$http", "httpWrapperService"];
            return BudgetService;
        }());
        budget_1.BudgetService = BudgetService;
        angular
            .module("insite")
            .service("budgetService", BudgetService);
    })(budget = insite.budget || (insite.budget = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.budget.service.js.map