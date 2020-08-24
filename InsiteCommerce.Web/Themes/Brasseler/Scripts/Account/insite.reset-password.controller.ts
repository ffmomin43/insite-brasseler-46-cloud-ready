module insite.account {
    "use strict";

    export interface IResetPasswordControllerScope extends ng.IScope {
        resetPasswordForm: any;
    }

    export class ResetPasswordController {
        settings: AccountSettingsModel;
        successUrl: string;
        changePasswordError = "";
        password = "";
        confirmPassword = "";
        isResettingPassword = true; // true = show reset password ui, false = show activate account ui
        resetPasswordForm = null;
        hasAnyRule: boolean;

        static $inject = ["$scope", "sessionService", "coreService", "settingsService", "queryString"];

        constructor(
            protected $scope: IResetPasswordControllerScope,
            protected sessionService: account.ISessionService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            this.isResettingPassword = this.queryString.get("reset").toLowerCase() === "true";
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); }
            );
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
            this.hasAnyRule = this.settings.passwordMinimumRequiredLength > 0 ||
                this.settings.passwordRequiresSpecialCharacter ||
                this.settings.passwordRequiresUppercase ||
                this.settings.passwordRequiresLowercase ||
                this.settings.passwordRequiresDigit;
        }

        protected getSettingsFailed(error: any): void {
        }

        changePassword(): void {
            this.changePasswordError = "";
            this.resetPasswordForm = this.$scope.resetPasswordForm;

            if (!this.resetPasswordForm.$valid) {
                return;
            }

            const username = this.queryString.get("username");
            const resetToken = this.queryString.get("resetToken");

            this.sessionService.resetPasswordWithToken(username, this.confirmPassword, resetToken).then(
                (session: SessionModel) => { this.resetPasswordWithTokenCompleted(session); },
                (error: any) => { this.resetPasswordWithTokenFailed(error); });
        }

        protected resetPasswordWithTokenCompleted(session: SessionModel): void {
            const id = this.isResettingPassword ? "#popup-resetPasswordSuccess" : "#popup-accountActivationSuccess";

            this.coreService.displayModal(angular.element(id), () => {
                this.coreService.redirectToSignIn(false);
                this.$scope.$apply(); // redirect doesn't happen without this
            });
        }

        protected resetPasswordWithTokenFailed(error: any): void {
            this.changePasswordError = error.message;
        }
    }

    angular
        .module("insite")
        .controller("ResetPasswordController", ResetPasswordController);
}