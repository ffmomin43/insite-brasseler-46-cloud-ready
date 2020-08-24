module insite.layout {
    "use strict";

    export class BrasselerTopNavController extends TopNavController {

        static $inject = ["$scope", "$window", "$attrs", "sessionService", "websiteService", "coreService", "settingsService", "deliveryMethodPopupService", "ipCookie",];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected $attrs: ITopNavControllerAttributes,
            protected sessionService: account.ISessionService,
            protected websiteService: websites.IWebsiteService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected deliveryMethodPopupService: account.IDeliveryMethodPopupService,
            protected ipCookie: any) {
            super(
                $scope,
                $window,
                $attrs,
                sessionService,
                websiteService,
                coreService,
                settingsService,
                deliveryMethodPopupService
            );
            this.$onInit();
        }

        setLanguage(languageId: string): void {
            this.ipCookie("siteHit", true, { path: "/" });
            languageId = languageId ? languageId : this.session.language.id;

            this.sessionService.setLanguage(languageId).then(
                (session: SessionModel) => { this.setLanguageCompleted(session); },
                (error: any) => { this.setLanguageFailed(error); });
        }

        checkCurrentPageForMessages(): void {
            const currentUrl = this.coreService.getCurrentPath();
            if (this.dashboardUrl != null && this.dashboardUrl != "") {
                const index = currentUrl.indexOf(this.dashboardUrl.toLowerCase());
                const show = index === -1 || (index + this.dashboardUrl.length !== currentUrl.length);

                if (!show && this.session.hasRfqUpdates) {
                    this.closeQuoteInformation();
                }
            }
        }
    }

    angular
        .module("insite")
        .controller("TopNavController", BrasselerTopNavController);

}