import DashboardPanelModel = Insite.Dashboard.WebApi.V1.ApiModels.DashboardPanelModel;

module insite.dashboard {
    "use strict";

    export class DashboardLinksController {
        orderKey: string;
        quoteKey: string;
        requisitionKey: string;
        links: DashboardPanelModel[];
        panels: DashboardPanelModel[];

        static $inject = ["dashboardService", "$rootScope"];

        constructor(protected dashboardService: IDashboardService, protected $rootScope: ng.IRootScopeService) {
        }

        $onInit(): void {
            this.dashboardService.getDashboardPanels().then(
                (dashboardPanelCollection: DashboardPanelCollectionModel) => { this.getDashboardPanelsCompleted(dashboardPanelCollection); },
                (error: any) => { this.getDashboardPanelsFailed(error); });
        }

        protected getDashboardPanelsCompleted(dashboardPanelCollection: DashboardPanelCollectionModel): void {
            this.links = dashboardPanelCollection.dashboardPanels.filter((x) => { return !x.isPanel; });
            this.panels = dashboardPanelCollection.dashboardPanels.filter((x) => { return x.isPanel; });

            const quickLinks = dashboardPanelCollection.dashboardPanels.filter((x) => { return x.isQuickLink; });
            this.$rootScope.$broadcast("quickLinksLoaded", quickLinks);
        }

        protected getDashboardPanelsFailed(error: any): void {
        }

        getCssClass(panelType: string): string {
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
        }
    }

    angular
        .module("insite")
        .controller("DashboardLinksController", DashboardLinksController);
}