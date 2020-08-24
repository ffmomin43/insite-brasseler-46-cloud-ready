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
        var ShareOptionEnum;
        (function (ShareOptionEnum) {
            ShareOptionEnum[ShareOptionEnum["IndividualUsers"] = 0] = "IndividualUsers";
            ShareOptionEnum[ShareOptionEnum["AllCustomerUsers"] = 1] = "AllCustomerUsers";
            ShareOptionEnum[ShareOptionEnum["Private"] = 2] = "Private";
        })(ShareOptionEnum = wishlist.ShareOptionEnum || (wishlist.ShareOptionEnum = {}));
        var ShareListPopupController = /** @class */ (function () {
            function ShareListPopupController($scope, $rootScope, coreService, $timeout, wishListService, spinnerService, shareListPopupService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.coreService = coreService;
                this.$timeout = $timeout;
                this.wishListService = wishListService;
                this.spinnerService = spinnerService;
                this.shareListPopupService = shareListPopupService;
                this.shareListOption = "sendCopy";
                this.shareByOption = "shareByEmail";
                this.allowEditList = true.toString();
            }
            ShareListPopupController.prototype.$onInit = function () {
                var _this = this;
                this.initShareListPopup();
                this.shareListPopupService.registerDisplayFunction(function (data) {
                    _this.shareWizardStep = data.step;
                    _this.list = data.list;
                    _this.session = data.session;
                    _this.customBackStep = data.customBackStep;
                    _this.coreService.displayModal("#popup-share-list");
                });
            };
            ShareListPopupController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            ShareListPopupController.prototype.refreshFoundationTipHover = function () {
                this.$timeout(function () { return angular.element(document).foundation("dropdown", "reflow"); }, 0);
            };
            ShareListPopupController.prototype.clearSharedFormData = function () {
                this.recipientEmailAddress = "";
                this.recipientEmailIsInvalid = false;
            };
            ShareListPopupController.prototype.initShareListPopup = function () {
                var _this = this;
                var popup = angular.element("#popup-share-list");
                popup.on("closed", function () {
                    _this.$timeout(function () {
                        _this.isDisabled = false;
                        _this.shareWizardStep = "";
                        _this.shareListOption = "sendCopy";
                        _this.shareByOption = "shareByEmail";
                        _this.allowEditList = true.toString();
                        _this.sendNotificationToUsers = false;
                        _this.clearSharedFormData();
                    });
                });
                popup.on("open", function () {
                    if (_this.session && _this.session.firstName && _this.session.lastName) {
                        _this.yourName = _this.session.userLabel;
                    }
                    else {
                        _this.yourName = "";
                    }
                });
                popup.on("opened", function () {
                    _this.shareMessage = _this.defaultShareText;
                    _this.inviteMessage = _this.defaultInviteText;
                    _this.notificationMessage = _this.defaultInviteText;
                    _this.refreshFoundationTipHover();
                });
            };
            ShareListPopupController.prototype.shareNextStep = function (step) {
                this.shareWizardStep = step;
                this.refreshFoundationTipHover();
            };
            ShareListPopupController.prototype.shareBackStep = function (step) {
                this.shareWizardStep = step;
                this.refreshFoundationTipHover();
            };
            ShareListPopupController.prototype.validateSendForm = function (form) {
                if (!form.$valid) {
                    return false;
                }
                this.recipientEmailIsInvalid = false;
                var emails = this.recipientEmailAddress.split(",");
                if (!emails.every(function (address) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim()); })) {
                    this.recipientEmailIsInvalid = true;
                    return false;
                }
                return true;
            };
            ShareListPopupController.prototype.sendACopy = function (nextStep) {
                var _this = this;
                if (!this.validateSendForm(this.sendCopyForm)) {
                    return;
                }
                this.list.message = this.shareMessage;
                this.list.recipientEmailAddress = this.recipientEmailAddress;
                this.list.senderName = this.yourName;
                this.disableForm();
                this.wishListService.sendACopy(this.list).then(function (wishList) { _this.updateWishListSendACopyCompleted(wishList, nextStep); }, function (error) { _this.updateWishListSendACopyFailed(error); });
            };
            ShareListPopupController.prototype.updateWishListSendACopyCompleted = function (wishList, nextStep) {
                this.enableForm();
                this.shareNextStep(nextStep);
            };
            ShareListPopupController.prototype.updateWishListSendACopyFailed = function (error) {
                this.enableForm();
            };
            ShareListPopupController.prototype.inviteOthers = function (nextStep) {
                if (!this.validateSendForm(this.sendInviteForm)) {
                    return;
                }
                this.list.shareOption = ShareOptionEnum[ShareOptionEnum.IndividualUsers];
                this.list.allowEdit = this.allowEditList === true.toString();
                this.list.sendEmail = true;
                this.list.message = this.inviteMessage;
                this.list.recipientEmailAddress = this.recipientEmailAddress;
                this.list.senderName = this.yourName;
                this.updateList(nextStep);
            };
            ShareListPopupController.prototype.shareWithBilling = function (nextStep) {
                if (!this.shareWithBillingForm.$valid) {
                    return;
                }
                this.list.shareOption = ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
                this.list.allowEdit = this.allowEditList === true.toString();
                this.list.sendEmail = this.sendNotificationToUsers;
                this.list.message = this.notificationMessage;
                this.updateList(nextStep);
            };
            ShareListPopupController.prototype.updateList = function (nextStep) {
                var _this = this;
                this.disableForm();
                this.wishListService.updateWishList(this.list).then(function (wishList) { _this.updateWishListCompleted(wishList, nextStep); }, function (error) { _this.updateWishListFailed(error); });
            };
            ShareListPopupController.prototype.updateWishListCompleted = function (wishList, nextStep) {
                this.enableForm();
                this.$rootScope.$broadcast("listWasUpdated", {
                    id: wishList.id,
                    wishListSharesCount: wishList.wishListSharesCount,
                    allowEdit: wishList.allowEdit,
                    shareOption: wishList.shareOption
                });
                if (nextStep) {
                    this.shareNextStep(nextStep);
                }
                else {
                    this.closeModal("#popup-share-list");
                }
            };
            ShareListPopupController.prototype.updateWishListFailed = function (error) {
                this.enableForm();
            };
            ShareListPopupController.prototype.disableForm = function () {
                this.isDisabled = true;
                this.spinnerService.show();
            };
            ShareListPopupController.prototype.enableForm = function () {
                this.isDisabled = false;
                this.spinnerService.hide();
            };
            ShareListPopupController.$inject = ["$scope", "$rootScope", "coreService", "$timeout", "wishListService", "spinnerService", "shareListPopupService"];
            return ShareListPopupController;
        }());
        wishlist.ShareListPopupController = ShareListPopupController;
        var ShareListPopupService = /** @class */ (function (_super) {
            __extends(ShareListPopupService, _super);
            function ShareListPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ShareListPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-share-list-popup></isc-share-list-popup>";
            };
            return ShareListPopupService;
        }(base.BasePopupService));
        wishlist.ShareListPopupService = ShareListPopupService;
        angular
            .module("insite")
            .controller("ShareListPopupController", ShareListPopupController)
            .service("shareListPopupService", ShareListPopupService)
            .directive("iscShareListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ShareListPopup",
            scope: {},
            controller: "ShareListPopupController",
            controllerAs: "vm"
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.share-list-popup.controller.js.map