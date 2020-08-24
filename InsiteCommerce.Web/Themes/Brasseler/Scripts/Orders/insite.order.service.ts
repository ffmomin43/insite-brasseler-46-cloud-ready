import OrderCollectionModel = Insite.Order.WebApi.V1.ApiModels.OrderCollectionModel;
import OrderModel = Insite.Order.WebApi.V1.ApiModels.OrderModel;
import OrderStatusMappingCollectionModel = Insite.Order.WebApi.V1.ApiModels.OrderStatusMappingCollectionModel;
import OrderLineModel = Insite.Order.WebApi.V1.ApiModels.OrderLineModel;
import RmaModel = Insite.Order.WebApi.V1.ApiModels.RmaModel;

module insite.order {
    "use strict";

    export interface ISearchFilter {
        customerSequence?: string;
        sort?: string;
        toDate?: string;
        fromDate?: string;
        expand?: string;
    }

    export interface IOrderService {
        getOrders(filter: ISearchFilter, pagination: PaginationModel, preventCaching?: boolean): ng.IPromise<OrderCollectionModel>;
        getOrder(orderId: string, expand: string, stEmail?: string, stPostalCode?: string): ng.IPromise<OrderModel>;
        getOrderStatusMappings(): ng.IPromise<OrderStatusMappingCollectionModel>;
        updateOrder(orderId: string, orderModel: OrderModel): ng.IPromise<OrderModel>;
        addRma(rmaModel: RmaModel): ng.IPromise<RmaModel>;
        convertToCartLine(orderLine: OrderLineModel): CartLineModel;
        convertToCartLines(orderLines: OrderLineModel[]): CartLineModel[];
    }

    export class OrderService implements IOrderService {
        serviceUri = "/api/v1/orders";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getOrders(filter: ISearchFilter, pagination: PaginationModel, preventCaching?: boolean): ng.IPromise<OrderCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.serviceUri, method: "GET", params: this.getOrdersParams(filter, pagination, preventCaching) }),
                this.getOrdersCompleted,
                this.getOrdersFailed
            );
        }

        protected getOrdersParams(filter: ISearchFilter, pagination: PaginationModel, preventCaching?: boolean): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            if (preventCaching) {
                params.t = Date.now();
            }

            return params;
        }

        protected getOrdersCompleted(response: ng.IHttpPromiseCallbackArg<OrderCollectionModel>): void {
        }

        protected getOrdersFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getOrder(orderId: string, expand: string, stEmail?: string, stPostalCode?: string): ng.IPromise<OrderModel> {
            const uri = `${this.serviceUri}/${orderId}`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: uri, method: "GET", params: this.getOrderParams(expand, stEmail, stPostalCode) }),
                this.getOrderCompleted,
                this.getOrderFailed
            );
        }

        protected getOrderParams(expand: string, stEmail: string, stPostalCode: string): any {
            const params: any = expand ? { expand: expand } : {};

            if (typeof (stEmail) === "string" && stEmail !== null && stEmail !== "") {
                params.stEmail = stEmail;
            }

            if (typeof (stPostalCode) === "string" && stPostalCode !== null && stPostalCode !== "") {
                params.stPostalCode = stPostalCode;
            }

            return params;
        }

        protected getOrderCompleted(response: ng.IHttpPromiseCallbackArg<OrderModel>): void {
        }

        protected getOrderFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getOrderStatusMappings(): ng.IPromise<OrderStatusMappingCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get("/api/v1/orderstatusmappings"),
                this.getOrderStatusMappingCompleted,
                this.getOrderStatusMappingFailed
            );
        }

        protected getOrderStatusMappingCompleted(response: ng.IHttpPromiseCallbackArg<OrderStatusMappingCollectionModel>): void {
        }

        protected getOrderStatusMappingFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateOrder(orderId: string, orderModel: OrderModel): ng.IPromise<OrderModel> {
            const uri = `${this.serviceUri}/${orderId}`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: uri, data: orderModel }),
                this.updateOrderCompleted,
                this.updateOrderFailed
            );
        }

        protected updateOrderCompleted(response: ng.IHttpPromiseCallbackArg<OrderModel>): void {
        }

        protected updateOrderFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        addRma(rmaModel: RmaModel): ng.IPromise<RmaModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(`${this.serviceUri}/${rmaModel.orderNumber}/returns`, rmaModel),
                this.addRmaCompleted,
                this.addRmaFailed
            );
        }

        protected addRmaCompleted(response: ng.IHttpPromiseCallbackArg<RmaModel>): void {
        }

        protected addRmaFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        convertToCartLine(orderLine: OrderLineModel): CartLineModel {
            const cartLine = {} as CartLineModel;
            cartLine.productId = orderLine.productId;
            cartLine.qtyOrdered = orderLine.qtyOrdered;
            cartLine.unitOfMeasure = orderLine.unitOfMeasure;
            return cartLine;
        }

        convertToCartLines(orderLines: OrderLineModel[]): CartLineModel[] {
            const cartLines: CartLineModel[] = [];
            for (let i = 0; i < orderLines.length; i++) {
                if (orderLines[i].canAddToCart) {
                    cartLines.push(this.convertToCartLine(orderLines[i]));
                }
            }

            return cartLines;
        }
    }

    angular
        .module("insite")
        .service("orderService", OrderService);
}