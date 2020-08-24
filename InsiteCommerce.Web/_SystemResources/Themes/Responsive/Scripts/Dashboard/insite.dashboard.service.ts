import DashboardPanelCollectionModel = Insite.Dashboard.WebApi.V1.ApiModels.DashboardPanelCollectionModel;

module insite.dashboard {
    "use strict";

    export interface IDashboardService {
        getDashboardPanels(): ng.IPromise<DashboardPanelCollectionModel>;
    }

    export class DashboardService implements IDashboardService {
        dashboardPanelsUri = "/api/v1/dashboardpanels/";

        static $inject = ["$http", "httpWrapperService"];

        constructor(protected $http: ng.IHttpService, protected httpWrapperService: core.HttpWrapperService) {
        }

        getDashboardPanels(): ng.IPromise<DashboardPanelCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(this.dashboardPanelsUri),
                this.getDashboardPanelsCompleted,
                this.getDashboardPanelsFailed
            );
        }

        protected getDashboardPanelsCompleted(response: ng.IHttpPromiseCallbackArg<DashboardPanelCollectionModel>): void {
        }

        protected getDashboardPanelsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("dashboardService", DashboardService);
}