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
        var ShareDetailsPopupController = /** @class */ (function () {
            function ShareDetailsPopupController($rootScope, coreService, wishListService, spinnerService, shareDetailsPopupService) {
                this.$rootScope = $rootScope;
                this.coreService = coreService;
                this.wishListService = wishListService;
                this.spinnerService = spinnerService;
                this.shareDetailsPopupService = shareDetailsPopupService;
            }
            ShareDetailsPopupController.prototype.$onInit = function () {
                var _this = this;
                this.shareDetailsPopupService.registerDisplayFunction(function (listModel) {
                    if (listModel.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers]) {
                        _this.list = listModel;
                        _this.showModal();
                    }
                    else {
                        _this.getList(listModel);
                    }
                });
            };
            ShareDetailsPopupController.prototype.getList = function (listModel) {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getWishList(listModel, "excludelistlines,sharedusers").then(function (listModel) { _this.getListCompleted(listModel); }, function (error) { _this.getListFailed(error); });
            };
            ShareDetailsPopupController.prototype.getListCompleted = function (listModel) {
                this.spinnerService.hide();
                this.list = listModel;
                this.showModal();
            };
            ShareDetailsPopupController.prototype.getListFailed = function (error) {
                this.spinnerService.hide();
            };
            ShareDetailsPopupController.prototype.showModal = function () {
                this.coreService.displayModal("#popup-share-details");
            };
            ShareDetailsPopupController.prototype.leaveListIsAllowed = function () {
                return this.list && this.list.shareOption !== wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers];
            };
            ShareDetailsPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-share-details");
            };
            ShareDetailsPopupController.prototype.broadcastList = function () {
                this.$rootScope.$broadcast("leaveListPopupContext", this.list);
            };
            ShareDetailsPopupController.prototype.isSharedByCustomer = function () {
                return this.list && this.list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers];
            };
            ShareDetailsPopupController.$inject = ["$rootScope", "coreService", "wishListService", "spinnerService", "shareDetailsPopupService"];
            return ShareDetailsPopupController;
        }());
        wishlist.ShareDetailsPopupController = ShareDetailsPopupController;
        var ShareDetailsPopupService = /** @class */ (function (_super) {
            __extends(ShareDetailsPopupService, _super);
            function ShareDetailsPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ShareDetailsPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-share-details-popup></isc-share-details-popup>";
            };
            return ShareDetailsPopupService;
        }(base.BasePopupService));
        wishlist.ShareDetailsPopupService = ShareDetailsPopupService;
        angular
            .module("insite")
            .controller("ShareDetailsPopupController", ShareDetailsPopupController)
            .service("shareDetailsPopupService", ShareDetailsPopupService)
            .directive("iscShareDetailsPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ShareDetailsPopup",
            scope: {},
            controller: "ShareDetailsPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.share-details-popup.controller.js.map