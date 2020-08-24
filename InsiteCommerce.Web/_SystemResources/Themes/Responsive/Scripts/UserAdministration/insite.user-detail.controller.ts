module insite.useradministration {
    "use strict";

    export interface IUserDetailControllerScope extends ng.IScope {
        usersetupform: any;
    }

    export class UserDetailController {
        protected userId: System.Guid;

        user: AccountModel = null;
        currentUser: AccountModel = null;
        settings: AccountSettingsModel;
        retrievalError = false;
        isSubmitted = false;
        isNewUser = true;
        autoSendActivationEmail: boolean;
        generalError = "";
        changesSaved = false;
        activationEmailSent = false;
        userCreated = false;
        initialUserProfileEmail: string;

        static $inject = ["$scope", "accountService", "coreService", "sessionService", "queryString", "spinnerService", "$rootScope", "$location"];

        constructor(
            protected $scope: IUserDetailControllerScope,
            protected accountService: account.IAccountService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService,
            protected queryString: common.IQueryStringService,
            protected spinnerService: core.ISpinnerService,
            protected $rootScope: IAppRootScope,
            protected $location: ng.ILocationService) {
        }

        $onInit(): void {
            this.userId = this.queryString.get("userId") as System.Guid;
            if (this.userId) {
                this.isNewUser = false;
            }

            this.getAccount();
            this.getCurrentAccount();
            this.getAccountSettings();
        }

        protected getAccount(): void {
            this.accountService.expand = "approvers,roles";
            this.accountService.getAccount(this.userId).then(
                (account: AccountModel) => { this.getAccountCompleted(account); },
                (error: any) => { this.getAccountFailed(error); });
        }

        protected getAccountCompleted(account: AccountModel): void {
            this.user = account;

            if (this.isNewUser) {
                this.user.email = "";
                this.user.userName = "";
                this.user.firstName = "";
                this.user.lastName = "";
                this.user.role = "";
                this.user.approver = "";
                this.user.activationStatus = "";
                this.user.isApproved = true;
                this.user.requiresActivation = true;
                this.user.lastLoginOn = null;
                this.autoSendActivationEmail = true;
            }

            this.initialUserProfileEmail = this.user.email;
            this.retrievalError = false;
        }

        protected getAccountFailed(error: any): void {
            this.retrievalError = true;
        }

        protected getCurrentAccount(): void {
            this.accountService.getAccount().then(
                (account: AccountModel) => { this.getCurrentAccountCompleted(account); },
                (error: any) => { this.getCurrentAccountFailed(error); });
        }

        protected getCurrentAccountCompleted(account: AccountModel): void {
            this.currentUser = account;
        }

        protected getCurrentAccountFailed(error: any): void {
        }

        protected getAccountSettings(): void {
            this.accountService.getAccountSettings().then(
                (accountSettings: AccountSettingsModel) => { this.getAccountSettingsCompleted(accountSettings); },
                (error: any) => { this.getAccountSettingsFailed(error); });
        }

        protected getAccountSettingsCompleted(accountSettings: AccountSettingsModel): void {
            this.settings = accountSettings;
        }

        protected getAccountSettingsFailed(error: any): void {
        }

        createUser(): void {
            this.generalError = "";
            this.isSubmitted = true;

            if (!this.$scope.usersetupform.$valid) {
                return;
            }

            if (this.settings.useEmailAsUserName) {
                this.user.userName = this.user.email;
            }

            this.resetNotification();
            this.spinnerService.show();

            this.accountService.createAccount(this.user).then(
                (account: AccountModel) => { this.createAccountCompleted(account); },
                (error: any) => { this.createAccountFailed(error); });
        }

        protected createAccountCompleted(account: AccountModel): void {
            this.userCreated = true;
            this.userId = account.id;
            this.isNewUser = false;

            this.$location.search("userId", account.id);

            if (this.autoSendActivationEmail) {
                this.sendActivationEmail();
            }
        }

        protected createAccountFailed(error: any): void {
            if (error.message) {
                this.generalError = error.message;
            }
        }

        updateUser(): void {
            this.generalError = "";
            this.isSubmitted = true;

            if (!this.$scope.usersetupform.$valid) {
                return;
            }

            if (this.settings.useEmailAsUserName) {
                this.user.userName = this.user.email;
            }

            this.resetNotification();
            this.spinnerService.show();

            this.accountService.updateAccount(this.user, this.userId).then(
                (account: AccountModel) => { this.updateAccountCompleted(account); },
                (error: any) => { this.updateAccountFailed(error); });
        }

        protected updateAccountCompleted(account: AccountModel): void {
            if (this.settings.useEmailAsUserName && this.isCurrentUser() && this.user.email !== this.initialUserProfileEmail) {
                this.updateSession();
            }

            this.changesSaved = true;
            this.user.activationStatus = account.activationStatus;
            this.initialUserProfileEmail = account.email;
        }

        protected updateAccountFailed(error: any): void {
            if (error.message) {
                this.generalError = error.message;
            }
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

        onSendActivationEmailClick(): void {
            this.resetNotification();
            this.spinnerService.show();

            this.sendActivationEmail();
        }

        protected sendActivationEmail(): void {
            this.sessionService.sendAccountActivationEmail(this.user.userName).then(
                (session: SessionModel) => { this.sendAccountActivationEmailCompleted(session); },
                (error: any) => { this.sendAccountActivationEmailFailed(error); });
        }

        protected sendAccountActivationEmailCompleted(session: SessionModel): void {
            this.activationEmailSent = true;
        }

        protected sendAccountActivationEmailFailed(error: any): void {
        }

        displayModal(modalId: string): void {
            this.coreService.displayModal(`#${modalId}`);
        }

        protected resetNotification(): void {
            this.changesSaved = false;
            this.activationEmailSent = false;
            this.userCreated = false;
        }

        isCurrentUser(): boolean {
            return this.currentUser && this.currentUser.id === this.userId;
        }
    }

    angular
        .module("insite")
        .controller("UserDetailController", UserDetailController);
}