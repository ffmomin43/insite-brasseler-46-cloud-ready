var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var OrderService = /** @class */ (function () {
            function OrderService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/orders";
            }
            OrderService.prototype.getOrders = function (filter, pagination, preventCaching) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri, method: "GET", params: this.getOrdersParams(filter, pagination, preventCaching) }), this.getOrdersCompleted, this.getOrdersFailed);
            };
            OrderService.prototype.getOrdersParams = function (filter, pagination, preventCaching) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                if (preventCaching) {
                    params.t = Date.now();
                }
                return params;
            };
            OrderService.prototype.getOrdersCompleted = function (response) {
            };
            OrderService.prototype.getOrdersFailed = function (error) {
            };
            OrderService.prototype.getOrder = function (orderId, expand, stEmail, stPostalCode) {
                var uri = this.serviceUri + "/" + orderId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getOrderParams(expand, stEmail, stPostalCode) }), this.getOrderCompleted, this.getOrderFailed);
            };
            OrderService.prototype.getOrderParams = function (expand, stEmail, stPostalCode) {
                var params = expand ? { expand: expand } : {};
                if (typeof (stEmail) === "string" && stEmail !== null && stEmail !== "") {
                    params.stEmail = stEmail;
                }
                if (typeof (stPostalCode) === "string" && stPostalCode !== null && stPostalCode !== "") {
                    params.stPostalCode = stPostalCode;
                }
                return params;
            };
            OrderService.prototype.getOrderCompleted = function (response) {
            };
            OrderService.prototype.getOrderFailed = function (error) {
            };
            OrderService.prototype.getOrderStatusMappings = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get("/api/v1/orderstatusmappings"), this.getOrderStatusMappingCompleted, this.getOrderStatusMappingFailed);
            };
            OrderService.prototype.getOrderStatusMappingCompleted = function (response) {
            };
            OrderService.prototype.getOrderStatusMappingFailed = function (error) {
            };
            OrderService.prototype.updateOrder = function (orderId, orderModel) {
                var uri = this.serviceUri + "/" + orderId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: uri, data: orderModel }), this.updateOrderCompleted, this.updateOrderFailed);
            };
            OrderService.prototype.updateOrderCompleted = function (response) {
            };
            OrderService.prototype.updateOrderFailed = function (error) {
            };
            OrderService.prototype.addRma = function (rmaModel) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.serviceUri + "/" + rmaModel.orderNumber + "/returns", rmaModel), this.addRmaCompleted, this.addRmaFailed);
            };
            OrderService.prototype.addRmaCompleted = function (response) {
            };
            OrderService.prototype.addRmaFailed = function (error) {
            };
            OrderService.prototype.convertToCartLine = function (orderLine) {
                var cartLine = {};
                cartLine.productId = orderLine.productId;
                cartLine.qtyOrdered = orderLine.qtyOrdered;
                cartLine.unitOfMeasure = orderLine.unitOfMeasure;
                return cartLine;
            };
            OrderService.prototype.convertToCartLines = function (orderLines) {
                var cartLines = [];
                for (var i = 0; i < orderLines.length; i++) {
                    if (orderLines[i].canAddToCart) {
                        cartLines.push(this.convertToCartLine(orderLines[i]));
                    }
                }
                return cartLines;
            };
            OrderService.$inject = ["$http", "httpWrapperService"];
            return OrderService;
        }());
        order.OrderService = OrderService;
        angular
            .module("insite")
            .service("orderService", OrderService);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order.service.js.map