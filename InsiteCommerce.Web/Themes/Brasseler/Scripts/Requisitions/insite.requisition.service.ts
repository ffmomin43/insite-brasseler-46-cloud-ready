import RequisitionCollectionModel = Insite.Requisition.WebApi.V1.ApiModels.RequisitionCollectionModel;
import RequisitionModel = Insite.Requisition.WebApi.V1.ApiModels.RequisitionModel;
import RequisitionLineModel = Insite.Requisition.WebApi.V1.ApiModels.RequisitionLineModel;

module insite.requisitions {
    "use strict";

    export interface IRequisitionService {
        getRequisitions(pagination: PaginationModel): ng.IPromise<RequisitionCollectionModel>;
        getRequisition(requisitionId: System.Guid): ng.IPromise<RequisitionModel>;
        getRequisitionCount(): ng.IPromise<PaginationModel>;
        patchRequisition(requisition: RequisitionModel): ng.IPromise<RequisitionModel>;
        patchRequisitionLine(requisitionLine: RequisitionLineModel): ng.IPromise<RequisitionModel>;
        deleteRequisitionLine(requisitionLine: RequisitionLineModel): ng.IPromise<RequisitionModel>;
    }

    export class RequisitionService implements IRequisitionService {
        serviceUri = "/api/v1/requisitions";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getRequisitions(pagination: PaginationModel): ng.IPromise<RequisitionCollectionModel> {
            const filter = {} as cart.IQueryStringFilter;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getRequisitionsParams(filter, pagination) }),
                this.getRequisitionsCompleted,
                this.getRequisitionsFailed
            );
        }

        protected getRequisitionsParams(filter?: cart.IQueryStringFilter, pagination?: PaginationModel): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getRequisitionsCompleted(response: ng.IHttpPromiseCallbackArg<RequisitionCollectionModel>): void {
        }

        protected getRequisitionsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getRequisition(requisitionId: System.Guid): ng.IPromise<RequisitionModel> {
            const uri = `${this.serviceUri}/${requisitionId}`;
            const expand = "requisitionLines";

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getRequisitionParams(expand) }),
                this.getRequisitionCompleted,
                this.getRequisitionFailed
            );
        }

        protected getRequisitionParams(expand: string): any {
            return expand ? { expand: expand } : {};
        }

        protected getRequisitionCompleted(response: ng.IHttpPromiseCallbackArg<RequisitionModel>): void {
        }

        protected getRequisitionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getRequisitionCount(): ng.IPromise<PaginationModel> {
            const uri = this.serviceUri;
            const expand = "pageSize=1";

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getRequisitionCountParams(expand) }),
                this.getRequisitionCountCompleted,
                this.getRequisitionCountFailed
            );
        }

        protected getRequisitionCountParams(expand: string): any {
            return expand ? { expand: expand } : {};
        }

        protected getRequisitionCountCompleted(response: ng.IHttpPromiseCallbackArg<PaginationModel>): void {
        }

        protected getRequisitionCountFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        patchRequisition(requisition: RequisitionModel): ng.IPromise<RequisitionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: requisition.uri, data: requisition }),
                this.patchRequisitionCompleted,
                this.patchRequisitionFailed
            );
        }

        protected patchRequisitionCompleted(response: ng.IHttpPromiseCallbackArg<RequisitionModel>): void {
        }

        protected patchRequisitionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        patchRequisitionLine(requisitionLine: RequisitionLineModel): ng.IPromise<RequisitionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: requisitionLine.uri, data: requisitionLine }),
                this.patchRequisitionLineCompleted,
                this.patchRequisitionLineFailed
            );
        }

        protected patchRequisitionLineCompleted(response: ng.IHttpPromiseCallbackArg<RequisitionModel>): void {
        }

        protected patchRequisitionLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        deleteRequisitionLine(requisitionLine: RequisitionLineModel): ng.IPromise<RequisitionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.delete(requisitionLine.uri),
                this.deleteRequisitionLineCompleted,
                this.deleteRequisitionLineFailed
            );
        }

        protected deleteRequisitionLineCompleted(response: ng.IHttpPromiseCallbackArg<RequisitionModel>): void {
        }

        protected deleteRequisitionLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("requisitionService", RequisitionService);
}