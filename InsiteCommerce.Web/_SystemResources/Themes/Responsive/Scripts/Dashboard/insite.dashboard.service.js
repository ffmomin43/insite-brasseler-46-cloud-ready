var insite;
(function (insite) {
    var dashboard;
    (function (dashboard) {
        "use strict";
        var DashboardService = /** @class */ (function () {
            function DashboardService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.dashboardPanelsUri = "/api/v1/dashboardpanels/";
            }
            DashboardService.prototype.getDashboardPanels = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.dashboardPanelsUri), this.getDashboardPanelsCompleted, this.getDashboardPanelsFailed);
            };
            DashboardService.prototype.getDashboardPanelsCompleted = function (response) {
            };
            DashboardService.prototype.getDashboardPanelsFailed = function (error) {
            };
            DashboardService.$inject = ["$http", "httpWrapperService"];
            return DashboardService;
        }());
        dashboard.DashboardService = DashboardService;
        angular
            .module("insite")
            .service("dashboardService", DashboardService);
    })(dashboard = insite.dashboard || (insite.dashboard = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dashboard.service.js.map