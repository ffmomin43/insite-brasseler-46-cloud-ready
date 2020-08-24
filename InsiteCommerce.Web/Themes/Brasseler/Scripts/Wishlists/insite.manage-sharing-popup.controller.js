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
        var ManageSharingPopupController = /** @class */ (function () {
            function ManageSharingPopupController($rootScope, coreService, wishListService, spinnerService, manageSharingPopupService, shareListPopupService) {
                this.$rootScope = $rootScope;
                this.coreService = coreService;
                this.wishListService = wishListService;
                this.spinnerService = spinnerService;
                this.manageSharingPopupService = manageSharingPopupService;
                this.shareListPopupService = shareListPopupService;
            }
            ManageSharingPopupController.prototype.$onInit = function () {
                var _this = this;
                this.manageSharingPopupService.registerDisplayFunction(function (data) {
                    _this.session = data.session;
                    _this.privateSectionIsActive = false;
                    if (data.list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers]) {
                        _this.list = data.list;
                        _this.showModal();
                    }
                    else {
                        _this.getList(data.list);
                    }
                });
            };
            ManageSharingPopupController.prototype.getList = function (listModel) {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getWishList(listModel, "excludelistlines,sharedusers").then(function (listModel) { _this.getListCompleted(listModel); }, function (error) { _this.getListFailed(error); });
            };
            ManageSharingPopupController.prototype.getListCompleted = function (listModel) {
                this.spinnerService.hide();
                this.list = listModel;
                this.showModal();
            };
            ManageSharingPopupController.prototype.getListFailed = function (error) {
                this.spinnerService.hide();
            };
            ManageSharingPopupController.prototype.inviteOthers = function () {
                var _this = this;
                this.shareListPopupService.display({
                    list: this.list,
                    step: "shareByEmail",
                    customBackStep: function () { return _this.manageSharingPopupService.display({ list: _this.list, session: _this.session }); },
                    session: this.session
                });
            };
            ManageSharingPopupController.prototype.showModal = function () {
                this.allowEditList = this.list.allowEdit ? true.toString() : false.toString();
                this.coreService.displayModal("#popup-manage-sharing");
            };
            ManageSharingPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-manage-sharing");
            };
            ManageSharingPopupController.prototype.isSharedByCustomer = function () {
                return this.list && this.list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers];
            };
            ManageSharingPopupController.prototype.removeShareLine = function (id, sharedUserIndex) {
                var _this = this;
                this.wishListService.deleteWishListShare(this.list, id).then(function (list) { _this.removeShareLineCompleted(list, sharedUserIndex); }, function (error) { _this.removeShareLineFailed(error); });
            };
            ManageSharingPopupController.prototype.removeShareLineCompleted = function (list, sharedUserIndex) {
                this.list.wishListSharesCount--;
                this.$rootScope.$broadcast("listWasUpdated", {
                    id: this.list.id,
                    wishListSharesCount: this.list.wishListSharesCount
                });
                this.list.sharedUsers.splice(sharedUserIndex, 1);
            };
            ManageSharingPopupController.prototype.removeShareLineFailed = function (error) {
            };
            ManageSharingPopupController.prototype.changeEditMode = function () {
                var _this = this;
                if (this.allowEditList === this.list.allowEdit.toString()) {
                    return;
                }
                this.list.sendEmail = false;
                this.list.allowEdit = this.allowEditList === true.toString();
                this.disableForm();
                this.wishListService.updateWishList(this.list).then(function (wishList) { _this.updateWishListCompleted(wishList); }, function (error) { _this.updateWishListFailed(error); });
            };
            ManageSharingPopupController.prototype.updateWishListCompleted = function (wishList, closeModal) {
                this.enableForm();
                this.$rootScope.$broadcast("listWasUpdated", {
                    id: wishList.id,
                    allowEdit: wishList.allowEdit,
                    shareOption: wishList.shareOption,
                    wishListSharesCount: wishList.wishListSharesCount
                });
                if (closeModal) {
                    this.closeModal();
                }
            };
            ManageSharingPopupController.prototype.updateWishListFailed = function (error) {
                this.enableForm();
            };
            ManageSharingPopupController.prototype.openMakeListPrivatePopup = function () {
                this.privateSectionIsActive = true;
            };
            ManageSharingPopupController.prototype.returnToManageSharing = function () {
                this.privateSectionIsActive = false;
            };
            ManageSharingPopupController.prototype.makeListPrivate = function () {
                var _this = this;
                this.list.sendEmail = false;
                this.list.shareOption = wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.Private];
                this.disableForm();
                this.wishListService.updateWishList(this.list).then(function (wishList) { _this.updateWishListCompleted(wishList, true); }, function (error) { _this.updateWishListFailed(error); });
            };
            ManageSharingPopupController.prototype.disableForm = function () {
                this.inProcess = true;
                this.spinnerService.show();
            };
            ManageSharingPopupController.prototype.enableForm = function () {
                this.inProcess = false;
                this.spinnerService.hide();
            };
            ManageSharingPopupController.$inject = ["$rootScope", "coreService", "wishListService", "spinnerService", "manageSharingPopupService", "shareListPopupService"];
            return ManageSharingPopupController;
        }());
        wishlist.ManageSharingPopupController = ManageSharingPopupController;
        var ManageSharingPopupService = /** @class */ (function (_super) {
            __extends(ManageSharingPopupService, _super);
            function ManageSharingPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ManageSharingPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-manage-sharing-popup></isc-manage-sharing-popup>";
            };
            return ManageSharingPopupService;
        }(base.BasePopupService));
        wishlist.ManageSharingPopupService = ManageSharingPopupService;
        angular
            .module("insite")
            .controller("ManageSharingPopupController", ManageSharingPopupController)
            .service("manageSharingPopupService", ManageSharingPopupService)
            .directive("iscManageSharingPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ManageSharingPopup",
            scope: {},
            controller: "ManageSharingPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.manage-sharing-popup.controller.js.map