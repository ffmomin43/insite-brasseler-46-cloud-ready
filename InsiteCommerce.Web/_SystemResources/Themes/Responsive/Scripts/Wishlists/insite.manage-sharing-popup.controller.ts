module insite.wishlist {
    "use strict";

    export class ManageSharingPopupController {
        list: WishListModel;
        allowEditList: string;
        session: SessionModel;
        privateSectionIsActive: boolean;
        inProcess: boolean;

        static $inject = ["$rootScope", "coreService", "wishListService", "spinnerService", "manageSharingPopupService", "shareListPopupService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected coreService: core.ICoreService,
            protected wishListService: IWishListService,
            protected spinnerService: core.ISpinnerService,
            protected manageSharingPopupService: IManageSharingPopupService,
            protected shareListPopupService: IShareListPopupService) {
        }

        $onInit(): void {
            this.manageSharingPopupService.registerDisplayFunction((data) => {
                this.session = data.session;
                this.privateSectionIsActive = false;
                if (data.list.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers]) {
                    this.list = data.list;
                    this.showModal();
                } else {
                    this.getList(data.list);
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

        inviteOthers(): void {
            this.shareListPopupService.display({
                list: this.list,
                step: "shareByEmail",
                customBackStep: () => this.manageSharingPopupService.display({ list: this.list, session: this.session }),
                session: this.session
            });
        }

        protected showModal(): void {
            this.allowEditList = this.list.allowEdit ? true.toString() : false.toString();
            this.coreService.displayModal("#popup-manage-sharing");
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-manage-sharing");
        }

        protected isSharedByCustomer(): boolean {
            return this.list && this.list.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
        }

        protected removeShareLine(id: string, sharedUserIndex: number): void {
            this.wishListService.deleteWishListShare(this.list, id).then(
                (list: WishListModel) => { this.removeShareLineCompleted(list, sharedUserIndex); },
                (error: any) => { this.removeShareLineFailed(error); });
        }

        protected removeShareLineCompleted(list: WishListModel, sharedUserIndex: number): void {
            this.list.wishListSharesCount--;
            this.$rootScope.$broadcast("listWasUpdated",
                {
                    id: this.list.id,
                    wishListSharesCount: this.list.wishListSharesCount
                });
            this.list.sharedUsers.splice(sharedUserIndex, 1);
        }

        protected removeShareLineFailed(error: any): void {
        }

        protected changeEditMode(): void {
            if (this.allowEditList === this.list.allowEdit.toString()) {
                return;
            }

            this.list.sendEmail = false;
            this.list.allowEdit = this.allowEditList === true.toString();

            this.disableForm();
            this.wishListService.updateWishList(this.list).then(
                (wishList: WishListModel) => { this.updateWishListCompleted(wishList); },
                (error: any) => { this.updateWishListFailed(error); });
        }

        protected updateWishListCompleted(wishList: WishListModel, closeModal?: boolean): void {
            this.enableForm();
            this.$rootScope.$broadcast("listWasUpdated",
                {
                    id: wishList.id,
                    allowEdit: wishList.allowEdit,
                    shareOption: wishList.shareOption,
                    wishListSharesCount: wishList.wishListSharesCount
                });

            if (closeModal) {
                this.closeModal();
            }
        }

        protected updateWishListFailed(error: any): void {
            this.enableForm();
        }

        protected openMakeListPrivatePopup(): void {
            this.privateSectionIsActive = true;
        }

        protected returnToManageSharing(): void {
            this.privateSectionIsActive = false;
        }

        protected makeListPrivate(): void {
            this.list.sendEmail = false;
            this.list.shareOption = ShareOptionEnum[ShareOptionEnum.Private];

            this.disableForm();
            this.wishListService.updateWishList(this.list).then(
                (wishList: WishListModel) => { this.updateWishListCompleted(wishList, true); },
                (error: any) => { this.updateWishListFailed(error); });
        }

        private disableForm(): void {
            this.inProcess = true;
            this.spinnerService.show();
        }

        private enableForm(): void {
            this.inProcess = false;
            this.spinnerService.hide();
        }
    }

    export interface IManageSharingPopupData {
        list: WishListModel;
        session: SessionModel;
    }

    export interface IManageSharingPopupService {
        display(data: IManageSharingPopupData): void;
        registerDisplayFunction(p: (data: IManageSharingPopupData) => void);
    }

    export class ManageSharingPopupService extends base.BasePopupService<any> implements IManageSharingPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-manage-sharing-popup></isc-manage-sharing-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ManageSharingPopupController", ManageSharingPopupController)
        .service("manageSharingPopupService", ManageSharingPopupService)
        .directive("iscManageSharingPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ManageSharingPopup",
            scope: {},
            controller: "ManageSharingPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}