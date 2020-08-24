import BillToCollectionModel = Insite.Customers.WebApi.V1.ApiModels.BillToCollectionModel;
import BillToModel = Insite.Customers.WebApi.V1.ApiModels.BillToModel;
import ShipToCollectionModel = Insite.Customers.WebApi.V1.ApiModels.ShipToCollectionModel;
import ShipToModel = Insite.Customers.WebApi.V1.ApiModels.ShipToModel;

module insite.customers {
    "use strict";

    export interface ICustomerService {
        addOrUpdateShipTo(shipTo: ShipToModel): ng.IPromise<any>;
        getBillTo(expand: string): ng.IPromise<BillToModel>;
        getBillTos(expand?: string, filter?: string, pagination?: PaginationModel): ng.IPromise<BillToCollectionModel>;
        getShipTo(expand: string): ng.IPromise<ShipToModel>;
        getShipTos(expand?: string, filter?: string, pagination?: PaginationModel, billToId?: System.Guid): ng.IPromise<ShipToCollectionModel>;
        updateBillTo(billTo: BillToModel): ng.IPromise<BillToModel>;
        updateEnforcementLevel(billTo: BillToModel): ng.IPromise<BillToModel>;
    }

    export class CustomerService implements ICustomerService {
        serviceUri = "/api/v1/billtos";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getBillTos(expand?: string, filter?: string, pagination?: PaginationModel): ng.IPromise<BillToCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.serviceUri, method: "GET", params: this.getBillTosParams(expand, filter, pagination) }),
                this.getBillTosCompleted,
                this.getBillTosFailed
            );
        }

        protected getBillTosParams(expand?: string, filter?: string, pagination?: PaginationModel): void {
            const params: any = {
                expand: expand,
                filter: encodeURIComponent(filter || "")
            };

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getBillTosCompleted(response: ng.IHttpPromiseCallbackArg<BillToCollectionModel>): void {
        }

        protected getBillTosFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getBillTo(expand: string): ng.IPromise<BillToModel> {
            const uri = `${this.serviceUri}/current`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getBillToParams(expand) }),
                this.getBillToCompleted,
                this.getBillToFailed
            );
        }

        protected getBillToParams(expand: string): any {
            return expand ? { expand: expand } : {};
        }

        protected getBillToCompleted(response: ng.IHttpPromiseCallbackArg<BillToModel>): void {
        }

        protected getBillToFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateBillTo(billTo: BillToModel): ng.IPromise<BillToModel> {
            const patchBillTo = {} as BillToModel;
            angular.extend(patchBillTo, billTo);
            delete patchBillTo.shipTos;
            delete patchBillTo.budgetEnforcementLevel;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: patchBillTo.uri, data: patchBillTo }),
                this.updateBillToCompleted,
                this.updateBillToFailed
            );
        }

        protected updateBillToCompleted(response: ng.IHttpPromiseCallbackArg<BillToModel>): void {
        }

        protected updateBillToFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateEnforcementLevel(billTo: BillToModel): ng.IPromise<BillToModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: billTo.uri, data: billTo }),
                this.updateEnforcementLevelCompleted,
                this.updateEnforcementLevelFailed
            );
        }

        protected updateEnforcementLevelCompleted(response: ng.IHttpPromiseCallbackArg<BillToModel>): void {
        }

        protected updateEnforcementLevelFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getShipTos(expand?: string, filter?: string, pagination?: PaginationModel, billToId?: System.Guid): ng.IPromise<ShipToCollectionModel> {
            let uri = this.serviceUri;
            if (!billToId) {
                uri += "/current/shiptos";
            } else {
                uri += `/${billToId}/shiptos`;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getShipTosParams(expand, filter, pagination) }),
                this.getShipTosCompleted,
                this.getShipTosFailed
            );
        }

        protected getShipTosParams(expand: string, filter: string, pagination: PaginationModel): any {
            const params: any = {
                expand: expand,
                filter: encodeURIComponent(filter || "")
            };

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getShipTosCompleted(response: ng.IHttpPromiseCallbackArg<ShipToCollectionModel>): void {
        }

        protected getShipTosFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getShipTo(expand: string): ng.IPromise<ShipToModel> {
            const uri = `${this.serviceUri}/current/shiptos/current`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getShipToParams(expand) }),
                this.getShipToCompleted,
                this.getShipToFailed
            );
        }

        protected getShipToParams(expand: string): any {
            return expand ? { expand: expand } : {};
        }

        protected getShipToCompleted(response: ng.IHttpPromiseCallbackArg<ShipToModel>): void {
        }

        protected getShipToFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        addOrUpdateShipTo(shipTo: ShipToModel): ng.IPromise<ShipToModel> {
            const patchShipTo = {} as ShipToModel;
            angular.extend(patchShipTo, shipTo);
            let operation = "PATCH";
            if (patchShipTo.isNew) {
                operation = "POST";
                patchShipTo.uri = `${this.serviceUri}/current/shiptos`;
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: operation, url: patchShipTo.uri, data: patchShipTo }),
                this.addOrUpdateShipToCompleted,
                this.addOrUpdateShipToFailed
            );
        }

        protected addOrUpdateShipToCompleted(response: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected addOrUpdateShipToFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("customerService", CustomerService);
}