module insite.wishlist {
    import WishListModel = Insite.WishLists.WebApi.V1.ApiModels.WishListModel;
    "use strict";

    export class CreateListPopupController {
        listForm: any;
        listName: string;
        listDescription: string;
        errorMessage: string;
        list: WishListModel;

        static $inject = ["$scope", "$rootScope", "wishListService", "coreService", "$timeout", "createListPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected $timeout: ng.ITimeoutService,
            protected createListPopupService: ICreateListPopupService) {
        }

        $onInit(): void {
            this.initListPopupEvents();
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-create-list");
        }

        protected clearMessages(): void {
            this.errorMessage = "";
        }

        protected initListPopupEvents(): void {
            const popup = angular.element("#popup-create-list");

            this.createListPopupService.registerDisplayFunction((list: WishListModel) => {
                this.list = list;
                this.clearMessages();
                if (list) {
                    this.listName = this.list.name;
                    this.listDescription = this.list.description;
                }

                this.coreService.displayModal(popup);
            });
        }

        validForm(): boolean {
            this.clearMessages();

            if (!this.listForm.$valid) {
                return false;
            }

            return true;
        }

        createWishList(): void {
            if (!this.validForm()) {
                return;
            }

            this.wishListService.addWishList(this.listName, this.listDescription).then(
                (wishList: WishListModel) => { this.addWishListCompleted(wishList); },
                (error: any) => { this.addWishListFailed(error); });
        }

        protected addWishListCompleted(wishList: WishListModel): void {
            this.closeModal();
            this.$rootScope.$broadcast("list-was-created", wishList);
        }

        protected addWishListFailed(error: any): void {
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }

        updateWishList(): void {
            if (!this.validForm()) {
                return;
            }

            const list = {
                name: this.listName,
                description: this.listDescription,
                uri: this.list.uri
            } as WishListModel;

            this.wishListService.updateWishList(list).then(
                (wishList: WishListModel) => { this.updateWishListCompleted(wishList); },
                (error: any) => { this.updateWishListFailed(error); });
        }

        protected updateWishListCompleted(wishList: WishListModel): void {
            this.closeModal();
            this.$rootScope.$broadcast("list-was-saved", wishList);
        }

        protected updateWishListFailed(error: any): void {
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }
    }

    export interface ICreateListPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class CreateListPopupService extends base.BasePopupService<any> implements ICreateListPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-create-list-popup></isc-create-list-popup>";
        }
    }

    angular
        .module("insite")
        .controller("CreateListPopupController", CreateListPopupController)
        .service("createListPopupService", CreateListPopupService)
        .directive("iscCreateListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CreateListPopup",
            controller: "CreateListPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}