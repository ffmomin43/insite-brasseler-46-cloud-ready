var insite;
(function (insite) {
    var orderapproval;
    (function (orderapproval) {
        "use strict";
        var OrderApprovalService = /** @class */ (function () {
            function OrderApprovalService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/orderapprovals";
            }
            OrderApprovalService.prototype.getCarts = function (filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getCartsParams(filter, pagination) }), this.getCartsCompleted, this.getCartsFailed);
            };
            OrderApprovalService.prototype.getCartsParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            OrderApprovalService.prototype.getCartsCompleted = function (response) {
            };
            OrderApprovalService.prototype.getCartsFailed = function (error) {
            };
            OrderApprovalService.prototype.getCart = function (cartId) {
                var uri = this.serviceUri + "/" + cartId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(uri), this.getCartCompleted, this.getCartFailed);
            };
            OrderApprovalService.prototype.getCartCompleted = function (response) {
            };
            OrderApprovalService.prototype.getCartFailed = function (error) {
            };
            OrderApprovalService.$inject = ["$http", "httpWrapperService"];
            return OrderApprovalService;
        }());
        orderapproval.OrderApprovalService = OrderApprovalService;
        angular
            .module("insite")
            .service("orderApprovalService", OrderApprovalService);
    })(orderapproval = insite.orderapproval || (insite.orderapproval = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-approval.service.js.map