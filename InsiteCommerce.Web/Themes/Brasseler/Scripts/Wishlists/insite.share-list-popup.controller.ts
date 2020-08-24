module insite.wishlist {
    "use strict";

    export enum ShareOptionEnum {
        IndividualUsers,
        AllCustomerUsers,
        Private
    }

    export class ShareListPopupController {
        list: WishListModel;
        session: SessionModel;
        defaultShareText: string;
        defaultInviteText: string;
        isDisabled: boolean;
        customBackStep: () => void;

        shareWizardStep: string;
        shareListOption: string = "sendCopy";
        shareByOption: string = "shareByEmail";
        allowEditList: string = true.toString();

        sendCopyForm: any;
        shareMessage: string;

        sendInviteForm: any;
        inviteMessage: string;

        // shared between copy & invite forms
        yourName: string;
        recipientEmailAddress: string;
        recipientEmailIsInvalid: boolean;

        shareWithBillingForm: any;
        sendNotificationToUsers: boolean;
        notificationMessage: string;

        static $inject = ["$scope", "$rootScope", "coreService", "$timeout", "wishListService", "spinnerService", "shareListPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected coreService: core.ICoreService,
            protected $timeout: ng.ITimeoutService,
            protected wishListService: IWishListService,
            protected spinnerService: core.ISpinnerService,
            protected shareListPopupService: IShareListPopupService) {
        }

        $onInit(): void {
            this.initShareListPopup();

            this.shareListPopupService.registerDisplayFunction((data) => {

                this.shareWizardStep = data.step;
                this.list = data.list;
                this.session = data.session;
                this.customBackStep = data.customBackStep;

                this.coreService.displayModal("#popup-share-list");
            });
        }

        protected closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        refreshFoundationTipHover(): void {
            this.$timeout(() => (angular.element(document) as any).foundation("dropdown", "reflow"), 0);
        }

        clearSharedFormData(): void {
            this.recipientEmailAddress = "";
            this.recipientEmailIsInvalid = false;
        }

        initShareListPopup(): void {
            const popup = angular.element("#popup-share-list");

            popup.on("closed", () => {
                this.$timeout(() => {
                    this.isDisabled = false;
                    this.shareWizardStep = "";
                    this.shareListOption = "sendCopy";
                    this.shareByOption = "shareByEmail";
                    this.allowEditList = true.toString();
                    this.sendNotificationToUsers = false;
                    this.clearSharedFormData();
                });
            });

            popup.on("open", () => {
                if (this.session && this.session.firstName && this.session.lastName) {
                    this.yourName = this.session.userLabel;
                } else {
                    this.yourName = "";
                }
            });

            popup.on("opened", () => {
                this.shareMessage = this.defaultShareText;
                this.inviteMessage = this.defaultInviteText;
                this.notificationMessage = this.defaultInviteText;
                this.refreshFoundationTipHover();
            });
        }

        shareNextStep(step: string): void {
            this.shareWizardStep = step;
            this.refreshFoundationTipHover();
        }

        shareBackStep(step): void {
            this.shareWizardStep = step;
            this.refreshFoundationTipHover();
        }

        validateSendForm(form: any): boolean {
            if (!form.$valid) {
                return false;
            }

            this.recipientEmailIsInvalid = false;
            const emails = this.recipientEmailAddress.split(",");
            if (!emails.every((address: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim()))) {
                this.recipientEmailIsInvalid = true;
                return false;
            }

            return true;
        }

        sendACopy(nextStep: string): void {
            if (!this.validateSendForm(this.sendCopyForm)) {
                return;
            }

            this.list.message = this.shareMessage;
            this.list.recipientEmailAddress = this.recipientEmailAddress;
            this.list.senderName = this.yourName;

            this.disableForm();
            this.wishListService.sendACopy(this.list).then(
                (wishList: WishListModel) => { this.updateWishListSendACopyCompleted(wishList, nextStep); },
                (error: any) => { this.updateWishListSendACopyFailed(error); });
        }

        protected updateWishListSendACopyCompleted(wishList: WishListModel, nextStep: string): void {
            this.enableForm();
            this.shareNextStep(nextStep);
        }

        protected updateWishListSendACopyFailed(error: any): void {
            this.enableForm();
        }

        inviteOthers(nextStep: string): void {
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
        }

        shareWithBilling(nextStep: string): void {
            if (!this.shareWithBillingForm.$valid) {
                return;
            }

            this.list.shareOption = ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
            this.list.allowEdit = this.allowEditList === true.toString();
            this.list.sendEmail = this.sendNotificationToUsers;
            this.list.message = this.notificationMessage;

            this.updateList(nextStep);
        }

        updateList(nextStep: string): void {
            this.disableForm();
            this.wishListService.updateWishList(this.list).then(
                (wishList: WishListModel) => { this.updateWishListCompleted(wishList, nextStep); },
                (error: any) => { this.updateWishListFailed(error); });
        }

        protected updateWishListCompleted(wishList: WishListModel, nextStep: string): void {
            this.enableForm();

            this.$rootScope.$broadcast("listWasUpdated",
                {
                    id: wishList.id,
                    wishListSharesCount: wishList.wishListSharesCount,
                    allowEdit: wishList.allowEdit,
                    shareOption: wishList.shareOption
                });

            if (nextStep) {
                this.shareNextStep(nextStep);
            } else {
                this.closeModal("#popup-share-list");
            }
        }

        protected updateWishListFailed(error: any): void {
            this.enableForm();
        }

        private disableForm(): void {
            this.isDisabled = true;
            this.spinnerService.show();
        }

        private enableForm(): void {
            this.isDisabled = false;
            this.spinnerService.hide();
        }
    }

    export interface IShareListPopupData {
        step: string;
        list: WishListModel;
        customBackStep: () => void;
        session: SessionModel;
    }

    export interface IShareListPopupService {
        display(data: IShareListPopupData): void;
        registerDisplayFunction(p: (data: IShareListPopupData) => void);
    }

    export class ShareListPopupService extends base.BasePopupService<any> implements IShareListPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-share-list-popup></isc-share-list-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ShareListPopupController", ShareListPopupController)
        .service("shareListPopupService", ShareListPopupService)
        .directive("iscShareListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-ShareListPopup",
            scope: { },
            controller: "ShareListPopupController",
            controllerAs: "vm"
        }));
}