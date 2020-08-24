module insite.account {
    "use strict";

    export interface IChangeAccountPasswordControllerAttributes extends ng.IAttributes {
        successUrl: string;
    }

    export interface IChangeAccountPasswordControllerScope extends ng.IScope {
        changePasswordForm: any;
    }

    export class ChangeAccountPasswordController {
        settings: AccountSettingsModel;
        successUrl: string;
        changePasswordError = "";
        password = "";
        newPassword = "";

        static $inject = ["$scope", "sessionService", "$localStorage", "$attrs", "settingsService", "coreService"];

        constructor(
            protected $scope: IChangeAccountPasswordControllerScope,
            protected sessionService: account.ISessionService,
            protected $localStorage: common.IWindowStorage,
            protected $attrs: IChangeAccountPasswordControllerAttributes,
            protected settingsService: core.ISettingsService,
            protected coreService: core.ICoreService) {
        }

        $onInit(): void {
            this.successUrl = this.$attrs.successUrl;
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        changePassword(): void {
            this.changePasswordError = "";

            if (!this.$scope.changePasswordForm.$valid) {
                return;
            }

            const session: SessionModel = {
                password: this.password,
                newPassword: this.newPassword
            } as any;

            this.sessionService.changePassword(session).then(
                (updatedSession: SessionModel) => { this.changePasswordCompleted(updatedSession); },
                (error: any) => { this.changePasswordFailed(error); });
        }

        protected changePasswordCompleted(session: SessionModel): void {
            this.$localStorage.set("changePasswordDate", (new Date()).toLocaleString());
            this.coreService.redirectToPath(this.successUrl);
        }

        protected changePasswordFailed(error: any): void {
            this.changePasswordError = error.message;
        }
    }

    angular
        .module("insite")
        .controller("ChangeAccountPasswordController", ChangeAccountPasswordController);
}