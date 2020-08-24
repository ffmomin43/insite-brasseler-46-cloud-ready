import OrderApprovalCollectionModel = Insite.OrderApproval.WebApi.V1.ApiModels.OrderApprovalCollectionModel;

module insite.orderapproval {
    "use strict";

    export interface IOrderApprovalService {
        getCarts(filter?: cart.IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<OrderApprovalCollectionModel>;
        getCart(cartId: string): ng.IPromise<CartModel>;
    }

    export class OrderApprovalService implements IOrderApprovalService {
        serviceUri = "/api/v1/orderapprovals";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getCarts(filter?: cart.IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<OrderApprovalCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getCartsParams(filter, pagination) }),
                this.getCartsCompleted,
                this.getCartsFailed
            );
        }

        protected getCartsParams(filter?: cart.IQueryStringFilter, pagination?: PaginationModel): any {
           const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

           if (pagination) {
               params.page = pagination.page;
               params.pageSize = pagination.pageSize;
           }

           return params;
        }

        protected getCartsCompleted(response: ng.IHttpPromiseCallbackArg<OrderApprovalCollectionModel>): void {
        }

        protected getCartsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getCart(cartId: string): ng.IPromise<CartModel> {
            const uri = `${this.serviceUri}/${cartId}`;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(uri),
                this.getCartCompleted,
                this.getCartFailed
            );
        }

        protected getCartCompleted(response: ng.IHttpPromiseCallbackArg<CartModel>): void {
        }

        protected getCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("orderApprovalService", OrderApprovalService);
}