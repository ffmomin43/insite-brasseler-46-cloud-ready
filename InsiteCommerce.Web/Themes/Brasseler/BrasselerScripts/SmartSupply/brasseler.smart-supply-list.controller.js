var insite;
(function (insite) {
    var smartsupply;
    (function (smartsupply) {
        "use strict";
        var SmartSupplyListController = /** @class */ (function () {
            function SmartSupplyListController($scope, $window, cartService, sessionService, spinnerService, coreService, paginationService, smartSupplyService) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.smartSupplyService = smartSupplyService;
                this.smartSupplyCartsList = [];
                this.paginationStorageKey = "DefaultPagination-SubscriptionOrderList";
                this.searchFilter = {
                    status: "SubscriptionOrder",
                    sort: "OrderDate DESC",
                    shipToId: null
                };
                this.init();
            }
            SmartSupplyListController.prototype.init = function () {
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.getSmartSupplyCarts();
            };
            SmartSupplyListController.prototype.getSmartSupplyCarts = function () {
                var _this = this;
                this.smartSupplyCartsList = [];
                this.cartService.getCarts(this.searchFilter, this.pagination).then(function (result) {
                    _this.spinnerService.show();
                    _this.smartSupplyCarts = result.carts;
                    _this.smartSupplyCarts.forEach(function (x) {
                        _this.smartSupplyService.expand = "cartLines";
                        _this.smartSupplyService.getSmartSupplyCart(x.id).then(function (y) {
                            _this.smartSupplyCartsList.push(y);
                            if (y.properties["subscriptionFrequency"] != null) {
                                _this.frequencyMap = JSON.parse(y.properties["subscriptionFrequency"]);
                            }
                        });
                    });
                    _this.pagination = result.pagination;
                });
            };
            SmartSupplyListController.$inject = [
                "$scope",
                "$window",
                "cartService",
                "sessionService",
                "spinnerService",
                "coreService",
                "paginationService",
                "smartSupplyService"
            ];
            return SmartSupplyListController;
        }());
        smartsupply.SmartSupplyListController = SmartSupplyListController;
        angular
            .module("insite")
            .controller("SmartSupplyListController", SmartSupplyListController);
    })(smartsupply = insite.smartsupply || (insite.smartsupply = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.smart-supply-list.controller.js.map