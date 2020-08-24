module insite.wishlist {
    "use strict";

    export class ShareDetailsPopupController {
        list: WishListModel;

        static $inject = ["$rootScope", "coreService", "wishListService", "spinnerService", "shareDetailsPopupService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected coreService: core.ICoreService,
            protected wishListService: IWishListService,
            protected spinnerService: core.ISpinnerService,
            protected shareDetailsPopupService: IShareDetailsPopupService) {
        }

        $onInit(): void {
            this.shareDetailsPopupService.registerDisplayFunction((listModel) => {
                if (listModel.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers]) {
                    this.list = listModel;
                    this.showModal();
                } else {
                    this.getList(listModel);
                }
            });
        }

        getList(listModel: WishListModel): void {
            this.spinnerService.show();
            this.wishListService.getWishList(listModel, "excludelistlines,sharedusers").then(
                (listModel: WishListModel) => { this.getListCompleted(listModel); },
                (error: any) => { this.getListFailed(error); });
        }

        protected getListCompleted(listModel: WishListModel): void {
            this.spinnerService.hide();
            this.list = listModel;
            this.showModal();
        }

        protected getListFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected showModal(): void {
            this.coreService.displayModal("#popup-share-details");
        }

        protected leaveListIsAllowed(): boolean {
            return this.list && this.list.shareOption !== ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-share-details");
        }

        protected broadcastList(): void {
            this.$rootScope.$broadcast(`leaveListPopupContext`, this.list);
        }

        protected isSharedByCustomer(): boolean {
            return this.list && this.list.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
        }
    }

    export interface IShareDetailsPopupService {
        display(list: WishListModel): void;
        registerDisplayFunction(p: (list: WishListModel) => void);
    }

    export class ShareDetailsPopupService extends base.BasePopupService<any> implements IShareDetailsPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-share-details-popup></isc-share-details-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ShareDetailsPopupController", ShareDetailsPopupController)
        .service("shareDetailsPopupService", ShareDetailsPopupService)
        .directive("iscShareDetailsPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ShareDetailsPopup",
            scope: { },
            controller: "ShareDetailsPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}