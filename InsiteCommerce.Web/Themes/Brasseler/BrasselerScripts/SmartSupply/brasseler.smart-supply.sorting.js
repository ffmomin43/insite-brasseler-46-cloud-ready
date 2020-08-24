var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var smartsupply;
    (function (smartsupply) {
        "use strict";
        var SmartSupplySorting = /** @class */ (function (_super) {
            __extends(SmartSupplySorting, _super);
            function SmartSupplySorting($scope, $window, cartService, sessionService, spinnerService, coreService, paginationService, smartSupplyService) {
                var _this = _super.call(this, $scope, $window, cartService, sessionService, spinnerService, coreService, paginationService, smartSupplyService) || this;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.cartService = cartService;
                _this.sessionService = sessionService;
                _this.spinnerService = spinnerService;
                _this.coreService = coreService;
                _this.paginationService = paginationService;
                _this.smartSupplyService = smartSupplyService;
                _this.searchFilter = {
                    sort: "subscriptionName DESC, orderNumber DESC"
                };
                _this.init();
                return _this;
            }
            SmartSupplySorting.prototype.init = function () {
                this.getSmartSupplyCarts();
            };
            SmartSupplySorting.prototype.changeSort = function (sort) {
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort.split(",").map(function (o) { return o + " DESC"; }).join(",");
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getSmartSupplyCarts();
            };
            SmartSupplySorting.prototype.getSmartSupplyCarts = function () {
                this.searchFilter.sort;
            };
            SmartSupplySorting.$inject = [
                "$scope",
                "$window",
                "cartService",
                "sessionService",
                "spinnerService",
                "coreService",
                "paginationService",
                "smartSupplyService"
            ];
            return SmartSupplySorting;
        }(smartsupply.SmartSupplyListController));
        smartsupply.SmartSupplySorting = SmartSupplySorting;
        angular
            .module("insite")
            .controller("SmartSupplyListController", smartsupply.SmartSupplyListController);
    })(smartsupply = insite.smartsupply || (insite.smartsupply = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.smart-supply.sorting.js.map