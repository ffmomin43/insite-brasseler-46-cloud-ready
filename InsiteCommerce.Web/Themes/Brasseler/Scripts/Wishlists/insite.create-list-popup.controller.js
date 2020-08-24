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
        var CreateListPopupController = /** @class */ (function () {
            function CreateListPopupController($scope, $rootScope, wishListService, coreService, $timeout, createListPopupService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.$timeout = $timeout;
                this.createListPopupService = createListPopupService;
            }
            CreateListPopupController.prototype.$onInit = function () {
                this.initListPopupEvents();
            };
            CreateListPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-create-list");
            };
            CreateListPopupController.prototype.clearMessages = function () {
                this.errorMessage = "";
            };
            CreateListPopupController.prototype.initListPopupEvents = function () {
                var _this = this;
                var popup = angular.element("#popup-create-list");
                this.createListPopupService.registerDisplayFunction(function (list) {
                    _this.list = list;
                    _this.clearMessages();
                    if (list) {
                        _this.listName = _this.list.name;
                        _this.listDescription = _this.list.description;
                    }
                    _this.coreService.displayModal(popup);
                });
            };
            CreateListPopupController.prototype.validForm = function () {
                this.clearMessages();
                if (!this.listForm.$valid) {
                    return false;
                }
                return true;
            };
            CreateListPopupController.prototype.createWishList = function () {
                var _this = this;
                if (!this.validForm()) {
                    return;
                }
                this.wishListService.addWishList(this.listName, this.listDescription).then(function (wishList) { _this.addWishListCompleted(wishList); }, function (error) { _this.addWishListFailed(error); });
            };
            CreateListPopupController.prototype.addWishListCompleted = function (wishList) {
                this.closeModal();
                this.$rootScope.$broadcast("list-was-created", wishList);
            };
            CreateListPopupController.prototype.addWishListFailed = function (error) {
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            CreateListPopupController.prototype.updateWishList = function () {
                var _this = this;
                if (!this.validForm()) {
                    return;
                }
                var list = {
                    name: this.listName,
                    description: this.listDescription,
                    uri: this.list.uri
                };
                this.wishListService.updateWishList(list).then(function (wishList) { _this.updateWishListCompleted(wishList); }, function (error) { _this.updateWishListFailed(error); });
            };
            CreateListPopupController.prototype.updateWishListCompleted = function (wishList) {
                this.closeModal();
                this.$rootScope.$broadcast("list-was-saved", wishList);
            };
            CreateListPopupController.prototype.updateWishListFailed = function (error) {
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            CreateListPopupController.$inject = ["$scope", "$rootScope", "wishListService", "coreService", "$timeout", "createListPopupService"];
            return CreateListPopupController;
        }());
        wishlist.CreateListPopupController = CreateListPopupController;
        var CreateListPopupService = /** @class */ (function (_super) {
            __extends(CreateListPopupService, _super);
            function CreateListPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CreateListPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-create-list-popup></isc-create-list-popup>";
            };
            return CreateListPopupService;
        }(base.BasePopupService));
        wishlist.CreateListPopupService = CreateListPopupService;
        angular
            .module("insite")
            .controller("CreateListPopupController", CreateListPopupController)
            .service("createListPopupService", CreateListPopupService)
            .directive("iscCreateListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CreateListPopup",
            controller: "CreateListPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.create-list-popup.controller.js.map