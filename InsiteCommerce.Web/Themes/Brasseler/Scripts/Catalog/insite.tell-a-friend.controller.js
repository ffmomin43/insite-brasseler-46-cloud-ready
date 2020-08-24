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
    var catalog;
    (function (catalog) {
        "use strict";
        var TellAFriendController = /** @class */ (function () {
            function TellAFriendController($scope, emailService, $timeout, coreService, tellAFriendPopupService) {
                this.$scope = $scope;
                this.emailService = emailService;
                this.$timeout = $timeout;
                this.coreService = coreService;
                this.tellAFriendPopupService = tellAFriendPopupService;
            }
            TellAFriendController.prototype.$onInit = function () {
                var _this = this;
                this.tellAFriendPopupService.registerDisplayFunction(function (data) {
                    _this.product = data.product;
                    _this.resetPopup();
                    _this.coreService.displayModal("#popup-tell-a-friend");
                });
            };
            TellAFriendController.prototype.resetPopup = function () {
                this.tellAFriendModel = this.tellAFriendModel || {};
                this.tellAFriendModel.friendsName = "";
                this.tellAFriendModel.friendsEmailAddress = "";
                this.tellAFriendModel.yourName = "";
                this.tellAFriendModel.yourEmailAddress = "";
                this.tellAFriendModel.yourMessage = "";
                this.isSuccess = false;
                this.isError = false;
                this.inProgress = false;
                angular.element("#tellAFriendForm").validate().resetForm();
                angular.element("#tellAFriendForm input.error, #tellAFriendForm textarea.error").removeClass("error");
            };
            TellAFriendController.prototype.shareWithFriend = function () {
                var _this = this;
                var valid = angular.element("#tellAFriendForm").validate().form();
                if (!valid) {
                    return;
                }
                this.tellAFriendModel.productId = this.product.id.toString();
                this.tellAFriendModel.productImage = this.product.mediumImagePath;
                this.tellAFriendModel.productShortDescription = this.product.shortDescription;
                this.tellAFriendModel.altText = this.product.altText;
                this.tellAFriendModel.productUrl = this.product.productDetailUrl;
                this.inProgress = true;
                this.emailService.tellAFriend(this.tellAFriendModel).then(function (tellAFriendModel) { _this.tellAFriendCompleted(tellAFriendModel); }, function (error) { _this.tellAFriendFailed(error); });
            };
            TellAFriendController.prototype.tellAFriendCompleted = function (tellAFriendModel) {
                var _this = this;
                this.isSuccess = true;
                this.isError = false;
                this.inProgress = false;
                this.$timeout(function () {
                    _this.closeModal();
                }, 1000);
            };
            TellAFriendController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-tell-a-friend");
            };
            TellAFriendController.prototype.tellAFriendFailed = function (error) {
                this.isSuccess = false;
                this.isError = true;
                this.inProgress = false;
            };
            TellAFriendController.$inject = ["$scope", "emailService", "$timeout", "coreService", "tellAFriendPopupService"];
            return TellAFriendController;
        }());
        catalog.TellAFriendController = TellAFriendController;
        var TellAFriendPopupService = /** @class */ (function (_super) {
            __extends(TellAFriendPopupService, _super);
            function TellAFriendPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            TellAFriendPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-tell-a-friend-popup></isc-tell-a-friend-popup>";
            };
            return TellAFriendPopupService;
        }(base.BasePopupService));
        catalog.TellAFriendPopupService = TellAFriendPopupService;
        angular
            .module("insite")
            .controller("TellAFriendController", TellAFriendController)
            .service("tellAFriendPopupService", TellAFriendPopupService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.tell-a-friend.controller.js.map