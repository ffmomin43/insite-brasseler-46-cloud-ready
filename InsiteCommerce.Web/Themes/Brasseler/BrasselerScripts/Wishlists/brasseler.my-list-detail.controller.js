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
    var wishlist;
    (function (wishlist) {
        "use strict";
        var BrasselerMyListDetailController = /** @class */ (function (_super) {
            __extends(BrasselerMyListDetailController, _super);
            function BrasselerMyListDetailController($scope, settingsService, queryString, wishListService, cartService, productService, sessionService, $timeout, $interval, coreService, spinnerService, $location, shareListPopupService, uploadToListPopupService, $localStorage, searchService, productPriceService, paginationService, $templateCache, scheduleReminderPopupService, createListPopupService, deleteListPopupService, copyToListPopupService, listQuantityAdjustmentPopupService) {
                var _this = _super.call(this, $scope, settingsService, queryString, wishListService, cartService, productService, sessionService, $timeout, $interval, coreService, spinnerService, $location, shareListPopupService, uploadToListPopupService, $localStorage, searchService, productPriceService, paginationService, $templateCache, scheduleReminderPopupService, createListPopupService, deleteListPopupService, copyToListPopupService, listQuantityAdjustmentPopupService) || this;
                _this.$scope = $scope;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.wishListService = wishListService;
                _this.cartService = cartService;
                _this.productService = productService;
                _this.sessionService = sessionService;
                _this.$timeout = $timeout;
                _this.$interval = $interval;
                _this.coreService = coreService;
                _this.spinnerService = spinnerService;
                _this.$location = $location;
                _this.shareListPopupService = shareListPopupService;
                _this.uploadToListPopupService = uploadToListPopupService;
                _this.$localStorage = $localStorage;
                _this.searchService = searchService;
                _this.productPriceService = productPriceService;
                _this.paginationService = paginationService;
                _this.$templateCache = $templateCache;
                _this.scheduleReminderPopupService = scheduleReminderPopupService;
                _this.createListPopupService = createListPopupService;
                _this.deleteListPopupService = deleteListPopupService;
                _this.copyToListPopupService = copyToListPopupService;
                _this.listQuantityAdjustmentPopupService = listQuantityAdjustmentPopupService;
                _super.prototype.$onInit.call(_this);
                return _this;
            }
            BrasselerMyListDetailController.prototype.displayPopup = function (htmlElement) {
                this.coreService.displayModal(htmlElement);
            };
            BrasselerMyListDetailController.prototype.addLineFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerMyListDetailController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
                this.errorMessage = error.message;
            };
            BrasselerMyListDetailController.$inject = [
                "$scope",
                "settingsService",
                "queryString",
                "wishListService",
                "cartService",
                "productService",
                "sessionService",
                "$timeout",
                "$interval",
                "coreService",
                "spinnerService",
                "$location",
                "shareListPopupService",
                "uploadToListPopupService",
                "$localStorage",
                "searchService",
                "productPriceService",
                "paginationService",
                "createListPopupService",
                "deleteListPopupService",
                "copyToListPopupService"
            ];
            return BrasselerMyListDetailController;
        }(wishlist.MyListDetailController));
        wishlist.BrasselerMyListDetailController = BrasselerMyListDetailController;
        angular
            .module("insite")
            .controller("MyListDetailController", BrasselerMyListDetailController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.my-list-detail.controller.js.map