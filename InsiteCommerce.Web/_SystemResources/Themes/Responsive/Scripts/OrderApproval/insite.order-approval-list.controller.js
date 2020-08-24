var insite;
(function (insite) {
    var orderapproval;
    (function (orderapproval) {
        "use strict";
        var OrderApprovalListController = /** @class */ (function () {
            function OrderApprovalListController(orderApprovalService, customerService, coreService, paginationService, cartService) {
                this.orderApprovalService = orderApprovalService;
                this.customerService = customerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.cartService = cartService;
                this.paginationStorageKey = "DefaultPagination-OrderApprovalList";
            }
            OrderApprovalListController.prototype.$onInit = function () {
                var _this = this;
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            OrderApprovalListController.prototype.getCartCompleted = function (cart) {
                var _this = this;
                this.cart = cart;
                this.searchFilter = {
                    shipToId: "",
                    sort: "OrderDate"
                };
                this.restoreHistory();
                this.getCarts();
                this.customerService.getShipTos("approvals").then(function (shipToCollection) { _this.getShipTosCompleted(shipToCollection); }, function (error) { _this.getShipTosFailed(error); });
            };
            OrderApprovalListController.prototype.getCartFailed = function (error) {
            };
            OrderApprovalListController.prototype.getShipTosCompleted = function (shipToCollection) {
                this.shipTos = shipToCollection.shipTos;
            };
            OrderApprovalListController.prototype.getShipTosFailed = function (error) {
            };
            OrderApprovalListController.prototype.clear = function () {
                this.pagination.page = 1;
                this.searchFilter = {
                    shipToId: "",
                    sort: "OrderDate"
                };
                this.getCarts();
            };
            OrderApprovalListController.prototype.changeSort = function (sort) {
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort + " DESC";
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getCarts();
            };
            OrderApprovalListController.prototype.search = function () {
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                this.getCarts();
            };
            OrderApprovalListController.prototype.getCarts = function () {
                var _this = this;
                this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
                this.orderApprovalService.getCarts(this.searchFilter, this.pagination).then(function (orderApprovalCollection) { _this.orderApprovalServiceGetCartsCompleted(orderApprovalCollection); }, function (error) { _this.orderApprovalServiceGetCartsFailed(error); });
            };
            OrderApprovalListController.prototype.orderApprovalServiceGetCartsCompleted = function (orderApprovalCollection) {
                this.approvalCarts = orderApprovalCollection.cartCollection;
                this.properties = orderApprovalCollection.properties;
                this.pagination = orderApprovalCollection.pagination;
            };
            OrderApprovalListController.prototype.orderApprovalServiceGetCartsFailed = function (error) {
            };
            OrderApprovalListController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.filter) {
                        this.searchFilter = state.filter;
                    }
                }
            };
            OrderApprovalListController.$inject = ["orderApprovalService", "customerService", "coreService", "paginationService", "cartService"];
            return OrderApprovalListController;
        }());
        orderapproval.OrderApprovalListController = OrderApprovalListController;
        angular
            .module("insite")
            .controller("OrderApprovalListController", OrderApprovalListController);
    })(orderapproval = insite.orderapproval || (insite.orderapproval = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-approval-list.controller.js.map