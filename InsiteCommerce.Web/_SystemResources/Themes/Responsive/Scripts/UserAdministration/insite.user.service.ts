import AccountShipToCollectionModel = Insite.Account.WebApi.V1.ApiModels.AccountShipToCollectionModel;
import AccountShipToModel = Insite.Account.WebApi.V1.ApiModels.AccountShipToModel;

module insite.useradministration {
    "use strict";

    export interface IUserService {
        getUserShipToCollection(userProfileId: System.Guid, pagination: PaginationModel, sort: string): ng.IPromise<AccountShipToCollectionModel>;
        applyUserShipToCollection(userProfileId: System.Guid, shipToCollection: AccountShipToModel[]): ng.IPromise<AccountShipToCollectionModel>;
    }

    export class UserService implements IUserService {
        serviceUri = "/api/v1/accounts";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getUserShipToCollection(userProfileId: System.Guid, pagination: PaginationModel, sort: string): ng.IPromise<AccountShipToCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.serviceUri}/${userProfileId}/shiptos`, params: this.getUserShipToCollectionParams(pagination, sort) }),
                this.getUserShipToCollectionCompleted,
                this.getUserShipToCollectionFailed);
        }

        protected getUserShipToCollectionParams(pagination: PaginationModel, sort: string): any {
            const params = {
                sort: sort
            } as any;

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getUserShipToCollectionCompleted(response: ng.IHttpPromiseCallbackArg<AccountShipToCollectionModel>): void {
        }

        protected getUserShipToCollectionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        applyUserShipToCollection(userProfileId: System.Guid, shipToCollection: AccountShipToModel[]): ng.IPromise<AccountShipToCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/${userProfileId}/shiptos`, data: { UserShipToCollection: shipToCollection } }),
                this.applyUserShipToCollectionCompleted,
                this.applyUserShipToCollectionFailed);
        }

        protected applyUserShipToCollectionCompleted(response: ng.IHttpPromiseCallbackArg<AccountShipToCollectionModel>): void {
        }

        protected applyUserShipToCollectionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("userService", UserService);
}