var insite;
(function (insite) {
    var orderapproval;
    (function (orderapproval) {
        "use strict";
        var OrderApprovalDetailController = /** @class */ (function () {
            function OrderApprovalDetailController(orderApprovalService, cartService, accountService, coreService, queryString) {
                this.orderApprovalService = orderApprovalService;
                this.cartService = cartService;
                this.accountService = accountService;
                this.coreService = coreService;
                this.queryString = queryString;
            }
            OrderApprovalDetailController.prototype.$onInit = function () {
                var _this = this;
                var cartId = this.queryString.get("cartid");
                this.initEvents();
                this.accountService.getAccount().then(function (account) { _this.getAccountCompleted(account); }, function (error) { _this.getAccountFailed(error); });
                this.orderApprovalService.getCart(cartId).then(function (cart) { _this.orderApprovalServiceGetCartCompleted(cart); }, function (error) { _this.orderApprovalServiceGetCartFailed(error); });
            };
            OrderApprovalDetailController.prototype.initEvents = function () {
                var _this = this;
                this.cartService.getCart().then(function (cart) { _this.cartServiceGetCartCompleted(cart); }, function (error) { _this.cartServiceGetCartFailed(error); });
            };
            OrderApprovalDetailController.prototype.getAccountCompleted = function (account) {
                this.account = account;
            };
            OrderApprovalDetailController.prototype.getAccountFailed = function (error) {
            };
            OrderApprovalDetailController.prototype.orderApprovalServiceGetCartCompleted = function (cart) {
                this.cart = cart;
                this.canApproveOrders();
            };
            OrderApprovalDetailController.prototype.orderApprovalServiceGetCartFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            OrderApprovalDetailController.prototype.cartServiceGetCartCompleted = function (cart) {
                this.currentCart = cart;
                this.canApproveOrders();
            };
            OrderApprovalDetailController.prototype.cartServiceGetCartFailed = function (error) {
            };
            OrderApprovalDetailController.prototype.canApproveOrders = function () {
                if (this.account && this.account.canApproveOrders && this.cart) {
                    this.account.canApproveOrders = this.account.userName !== this.cart.initiatedByUserName;
                }
            };
            OrderApprovalDetailController.prototype.approveOrder = function (cartUri) {
                var _this = this;
                this.approveOrderErrorMessage = "";
                this.cart.status = "Cart";
                this.cartService.updateCart(this.cart).then(function (cart) { _this.updateCartCompleted(cartUri, cart); }, function (error) { _this.updateCartFailed(error); });
            };
            OrderApprovalDetailController.prototype.updateCartCompleted = function (cartUri, cart) {
                this.coreService.redirectToPath(cartUri);
            };
            OrderApprovalDetailController.prototype.updateCartFailed = function (error) {
                this.approveOrderErrorMessage = error.message;
            };
            OrderApprovalDetailController.$inject = ["orderApprovalService", "cartService", "accountService", "coreService", "queryString"];
            return OrderApprovalDetailController;
        }());
        orderapproval.OrderApprovalDetailController = OrderApprovalDetailController;
        angular
            .module("insite")
            .controller("OrderApprovalDetailController", OrderApprovalDetailController);
    })(orderapproval = insite.orderapproval || (insite.orderapproval = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-approval-detail.controller.js.map