module insite.order {
    "use strict";

    export class CookiePrivacyPolicyPopupController {
        showPopup: boolean;
        enableCookiePrivacyPolicyPopup: boolean;

        static $inject = ["$scope", "settingsService", "ipCookie"];

        constructor(
            protected $scope: ng.IScope,
            protected settingsService: core.ISettingsService,
            protected ipCookie: any) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("$locationChangeStart", () => {
                this.showPopupIfRequired();
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.enableCookiePrivacyPolicyPopup = settingsCollection.websiteSettings.enableCookiePrivacyPolicyPopup;
            this.showPopupIfRequired();
        }

        protected getSettingsFailed(error: any): void {
        }

        showPopupIfRequired(): void {
            if (this.enableCookiePrivacyPolicyPopup && !this.ipCookie("acceptCookies")) {
                this.showPopup = true;
            }
        }

        accept(): void {
            this.ipCookie("acceptCookies", true, { path: "/", expires: 365 });
            this.showPopup = false;
        }

        hidePopup(): void {
            this.showPopup = false;
        }
    }

    angular
        .module("insite")
        .controller("CookiePrivacyPolicyPopupController", CookiePrivacyPolicyPopupController);
}