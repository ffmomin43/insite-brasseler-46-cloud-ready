module insite.account {
    "use strict";

    export class AccountSettingsController {
        settings: AccountSettingsModel;
        account: AccountModel;
        isAccountPasswordChanged = false;
        changeSubscriptionError = "";
        savedAccountEmail: string;
        newAccountEmail: string;
        changeEmailAddressForm: any;
        changeEmailAddressError = "";

        static $inject = ["accountService", "$localStorage", "settingsService", "coreService", "sessionService"];

        constructor(
            protected accountService: account.IAccountService,
            protected $localStorage: common.IWindowStorage,
            protected settingsService: core.ISettingsService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.accountService.getAccount().then(
                (account: AccountModel) => { this.getAccountCompleted(account); },
                (error: any) => { this.getAccountFailed(error); });

            this.checkIfAccountPasswordChanged();
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getAccountCompleted(account: AccountModel): void {
            this.account = account;
            this.savedAccountEmail = account.email;
            this.newAccountEmail = account.email;
        }

        protected getAccountFailed(error: any): void {
        }

        checkIfAccountPasswordChanged(): void {
            const dateValue = this.$localStorage.get("changePasswordDate");
            if (dateValue) {
                const diff = Math.abs(((new Date(dateValue)) as any) - ((new Date()) as any));
                const minutes = Math.floor((diff / 1000) / 60);
                if (minutes <= 10) {
                    this.isAccountPasswordChanged = true;
                    setTimeout(() => {
                        this.isAccountPasswordChanged = false;
                    }, 10000);
                }

                this.$localStorage.remove("changePasswordDate");
            }
        }

        changeSubscription(): void {
            this.accountService.updateAccount(this.account).then(
                (account: AccountModel) => { this.updateSubscriptionCompleted(account); },
                (error: any) => { this.updateSubscriptionFailed(error); });
        }

        protected updateSubscriptionCompleted(account: AccountModel): void {
            (angular.element("#manageSubscriptionSuccess") as any).foundation("reveal", "open");
        }

        protected updateSubscriptionFailed(error: any): void {
            this.changeSubscriptionError = error.message;
        }

        showChangeEmailAddressPopup() {
            this.coreService.displayModal(angular.element("#changeEmailAddressPopup"));
        }

        hideChangeEmailAddressPopup() {
            this.coreService.closeModal("#changeEmailAddressPopup");
        }

        changeEmailAddress(): void {
            if (!this.changeEmailAddressForm.$valid) {
                return;
            }

            this.changeEmailAddressError = "";
            this.account.email = this.newAccountEmail;

            this.accountService.updateAccount(this.account).then(
                (account: AccountModel) => { this.updateEmailAddressCompleted(account); },
                (error: any) => { this.updateEmailAddressFailed(error); });
        }

        protected updateEmailAddressCompleted(account: AccountModel): void {
            this.hideChangeEmailAddressPopup();
            this.savedAccountEmail = account.email;
            this.newAccountEmail = account.email;

            if (this.settings.useEmailAsUserName) {
                this.updateSession();
            }
        }

        protected updateEmailAddressFailed(error: any): void {
            this.changeEmailAddressError = error.message;
            this.account.email = this.savedAccountEmail;
        }

        protected updateSession(): void {
            this.sessionService.updateSession({} as SessionModel).then(
                (session: SessionModel) => { this.updateSessionCompleted(session); },
                (error: any) => { this.updateSessionFailed(error); });
        }

        protected updateSessionCompleted(session: SessionModel): void {
        }

        protected updateSessionFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("AccountSettingsController", AccountSettingsController);
}