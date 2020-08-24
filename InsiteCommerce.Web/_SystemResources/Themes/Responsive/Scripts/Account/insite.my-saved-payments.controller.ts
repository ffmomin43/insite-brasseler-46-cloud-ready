module insite.account {
    "use strict";

    export class MySavedPaymentsController {
        savedPayments: AccountPaymentProfileModel[];
        savedPaymentForDelete: AccountPaymentProfileModel;

        static $inject = ["coreService", "spinnerService", "accountService", "editSavedPaymentPopupService", "addSavedPaymentPopupService"];

        constructor(
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected accountService: IAccountService,
            protected editSavedPaymentPopupService: IEditSavedPaymentPopupService,
            protected addSavedPaymentPopupService: IAddSavedPaymentPopupService) {
        }

        $onInit(): void {
            this.getPaymentProfiles();
        }

        protected getPaymentProfiles(): void {
            this.spinnerService.show();
            this.accountService.getPaymentProfiles().then(
                (accountPaymentProfileCollection: AccountPaymentProfileCollectionModel) => { this.getPaymentProfilesCompleted(accountPaymentProfileCollection); },
                (error: any) => { this.getPaymentProfilesFailed(error); });
        }

        protected getPaymentProfilesCompleted(accountPaymentProfileCollection: AccountPaymentProfileCollectionModel): void {
            this.savedPayments = accountPaymentProfileCollection.accountPaymentProfiles;
        }

        protected getPaymentProfilesFailed(error: any): void {
        }

        makeDefault(savedPayment: AccountPaymentProfileModel): void {
            savedPayment.isDefault = true;
            this.accountService.updatePaymentProfile(savedPayment.id, savedPayment).then(
                (accountPaymentProfile: AccountPaymentProfileModel) => { this.makeDefaultCompleted(accountPaymentProfile); },
                (error: any) => { this.makeDefaultFailed(error); });
        }

        protected makeDefaultCompleted(accountPaymentProfile: AccountPaymentProfileModel): void {
            this.getPaymentProfiles();
        }

        protected makeDefaultFailed(error: any): void {
        }

        setSavedPaymentForDelete(savedPayment: AccountPaymentProfileModel): void {
            this.savedPaymentForDelete = savedPayment;
        }

        closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        deleteSavedPayment(): void {
            if (!this.savedPaymentForDelete) {
                return;
            }

            this.closeModal("#popup-delete-card");
            this.spinnerService.show();
            this.accountService.deletePaymentProfiles(this.savedPaymentForDelete.id).then(
                () => { this.deletePaymentProfilesCompleted(); },
                (error: any) => { this.deletePaymentProfilesFailed(error); });
        }

        protected deletePaymentProfilesCompleted(): void {
            this.getPaymentProfiles();
        }

        protected deletePaymentProfilesFailed(error: any): void {
        }

        openEditPopup(savedPayment: AccountPaymentProfileModel): void {
            this.editSavedPaymentPopupService.display({ savedPayment, savedPayments: this.savedPayments, afterSaveFn: () => { this.getPaymentProfiles(); } });
        }

        openAddPopup(): void {
            this.addSavedPaymentPopupService.display({ savedPayments: this.savedPayments, afterSaveFn: () => { this.getPaymentProfiles(); } });
        }
    }

    angular
        .module("insite")
        .controller("MySavedPaymentsController", MySavedPaymentsController);
}