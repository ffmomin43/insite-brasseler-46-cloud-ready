module insite.wishlist {
    "use strict";

    export class DeleteListPopupController {
        list: WishListModel;

        static $inject = ["$scope", "$rootScope","wishListService", "coreService", "deleteListPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected deleteListPopupService: IDeleteListPopupService) {
        }

        $onInit(): void {
            const popup = angular.element("#popup-delete-list");

            this.deleteListPopupService.registerDisplayFunction((list: WishListModel) => {
                this.list = list;
                this.coreService.displayModal(popup);
            });
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-delete-list");
        }

        deleteList(): void {
            this.wishListService.deleteWishList(this.list).then(
                (wishList: WishListModel) => { this.deleteWishListCompleted(); },
                (error: any) => { this.deleteWishListFailed(error); });
        }

        protected deleteWishListCompleted(): void {
            this.closeModal();
            this.$rootScope.$broadcast("list-was-deleted");
            
        }

        protected deleteWishListFailed(error: any): void {
        }
    }

    export interface IDeleteListPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class DeleteListPopupService extends base.BasePopupService<any> implements IDeleteListPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-delete-list-popup></isc-delete-list-popup>";
        }
    }

    angular
        .module("insite")
        .controller("DeleteListPopupController", DeleteListPopupController)
        .service("deleteListPopupService", DeleteListPopupService)
        .directive("iscDeleteListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-DeleteListPopup",
            controller: "DeleteListPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}