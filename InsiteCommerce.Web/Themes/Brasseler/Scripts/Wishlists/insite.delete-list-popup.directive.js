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
        var DeleteListPopupController = /** @class */ (function () {
            function DeleteListPopupController($scope, $rootScope, wishListService, coreService, deleteListPopupService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.deleteListPopupService = deleteListPopupService;
            }
            DeleteListPopupController.prototype.$onInit = function () {
                var _this = this;
                var popup = angular.element("#popup-delete-list");
                this.deleteListPopupService.registerDisplayFunction(function (list) {
                    _this.list = list;
                    _this.coreService.displayModal(popup);
                });
            };
            DeleteListPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-delete-list");
            };
            DeleteListPopupController.prototype.deleteList = function () {
                var _this = this;
                this.wishListService.deleteWishList(this.list).then(function (wishList) { _this.deleteWishListCompleted(); }, function (error) { _this.deleteWishListFailed(error); });
            };
            DeleteListPopupController.prototype.deleteWishListCompleted = function () {
                this.closeModal();
                this.$rootScope.$broadcast("list-was-deleted");
            };
            DeleteListPopupController.prototype.deleteWishListFailed = function (error) {
            };
            DeleteListPopupController.$inject = ["$scope", "$rootScope", "wishListService", "coreService", "deleteListPopupService"];
            return DeleteListPopupController;
        }());
        wishlist.DeleteListPopupController = DeleteListPopupController;
        var DeleteListPopupService = /** @class */ (function (_super) {
            __extends(DeleteListPopupService, _super);
            function DeleteListPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DeleteListPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-delete-list-popup></isc-delete-list-popup>";
            };
            return DeleteListPopupService;
        }(base.BasePopupService));
        wishlist.DeleteListPopupService = DeleteListPopupService;
        angular
            .module("insite")
            .controller("DeleteListPopupController", DeleteListPopupController)
            .service("deleteListPopupService", DeleteListPopupService)
            .directive("iscDeleteListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-DeleteListPopup",
            controller: "DeleteListPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.delete-list-popup.directive.js.map