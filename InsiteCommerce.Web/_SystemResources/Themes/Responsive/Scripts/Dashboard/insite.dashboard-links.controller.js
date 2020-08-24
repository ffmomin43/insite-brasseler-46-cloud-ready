var insite;
(function (insite) {
    var dashboard;
    (function (dashboard) {
        "use strict";
        var DashboardLinksController = /** @class */ (function () {
            function DashboardLinksController(dashboardService, $rootScope) {
                this.dashboardService = dashboardService;
                this.$rootScope = $rootScope;
            }
            DashboardLinksController.prototype.$onInit = function () {
                var _this = this;
                this.dashboardService.getDashboardPanels().then(function (dashboardPanelCollection) { _this.getDashboardPanelsCompleted(dashboardPanelCollection); }, function (error) { _this.getDashboardPanelsFailed(error); });
            };
            DashboardLinksController.prototype.getDashboardPanelsCompleted = function (dashboardPanelCollection) {
                this.links = dashboardPanelCollection.dashboardPanels.filter(function (x) { return !x.isPanel; });
                this.panels = dashboardPanelCollection.dashboardPanels.filter(function (x) { return x.isPanel; });
                var quickLinks = dashboardPanelCollection.dashboardPanels.filter(function (x) { return x.isQuickLink; });
                this.$rootScope.$broadcast("quickLinksLoaded", quickLinks);
            };
            DashboardLinksController.prototype.getDashboardPanelsFailed = function (error) {
            };
            DashboardLinksController.prototype.getCssClass = function (panelType) {
                if (panelType === this.orderKey) {
                    return "db-li-oapp";
                }
                if (panelType === this.requisitionKey) {
                    return "db-li-req";
                }
                if (panelType === this.quoteKey) {
                    return "db-li-quotes";
                }
                return "";
            };
            DashboardLinksController.$inject = ["dashboardService", "$rootScope"];
            return DashboardLinksController;
        }());
        dashboard.DashboardLinksController = DashboardLinksController;
        angular
            .module("insite")
            .controller("DashboardLinksController", DashboardLinksController);
    })(dashboard = insite.dashboard || (insite.dashboard = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dashboard-links.controller.js.map