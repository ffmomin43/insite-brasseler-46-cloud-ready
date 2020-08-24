module insite.layout {
    "use strict";

    export interface ITopNavControllerAttributes extends ng.IAttributes {
        dashboardUrl: string;
    }

    export class TopNavController {
        languages: any[];
        currencies: any[];
        session: any;
        dashboardUrl: string;
        accountSettings: AccountSettingsModel;

        static $inject = ["$scope", "$window", "$attrs", "sessionService", "websiteService", "coreService", "settingsService", "deliveryMethodPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected $attrs: ITopNavControllerAttributes,
            protected sessionService: account.ISessionService,
            protected websiteService: websites.IWebsiteService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected deliveryMethodPopupService: account.IDeliveryMethodPopupService) {
        }

        $onInit(): void {
            this.dashboardUrl = this.$attrs.dashboardUrl;
            // TODO ISC-4406
            // TODO ISC-2937 SPA kill all of the things that depend on broadcast for session and convert them to this, assuming we can properly cache this call
            // otherwise determine some method for a child to say "I expect my parent to have a session, and I want to use it" broadcast will not work for that
            this.getSession();
            this.getSettings();

            this.$scope.$on("sessionUpdated", (event, session) => {
                this.onSessionUpdated(session);
            });

            this.$scope.$on("updateHeaderSession", () => {
                this.getSession();
            });
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.session = session;
        }

        protected getSession(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.getWebsite("languages,currencies");
        }

        protected getSessionFailed(error: any): void {
        }

        protected getSettings(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.accountSettings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getWebsite(expand: string): void {
            this.websiteService.getWebsite(expand).then(
                (website: WebsiteModel) => { this.getWebsiteCompleted(website); },
                (error: any) => { this.getWebsitedFailed(error); });
        }

        protected getWebsiteCompleted(website: WebsiteModel): void {
            this.languages = website.languages.languages.filter(l => l.isLive);
            this.currencies = website.currencies.currencies;

            this.checkCurrentPageForMessages();

            angular.forEach(this.languages, (language: any) => {
                if (language.id === this.session.language.id) {
                    this.session.language = language;
                }
            });

            angular.forEach(this.currencies, (currency: any) => {
                if (currency.id === this.session.currency.id) {
                    this.session.currency = currency;
                }
            });
        }

        protected getWebsitedFailed(error: any): void {
        }

        setLanguage(languageId: string): void {
            languageId = languageId ? languageId : this.session.language.id;

            this.sessionService.setLanguage(languageId).then(
                (session: SessionModel) => { this.setLanguageCompleted(session); },
                (error: any) => { this.setLanguageFailed(error); });
        }

        protected setLanguageCompleted(session: SessionModel): void {
            if (this.$window.location.href.indexOf("AutoSwitchContext") === -1) {
                if (this.$window.location.href.indexOf("?") === -1) {
                    this.$window.location.href = `${this.$window.location.href}?AutoSwitchContext=false`;
                } else {
                    this.$window.location.href = `${this.$window.location.href}&AutoSwitchContext=false`;
                }
            } else {
                this.$window.location.reload();
            }
        }

        protected setLanguageFailed(error: any): void {
        }

        setCurrency(currencyId: string): void {
            currencyId = currencyId ? currencyId : this.session.currency.id;

            this.sessionService.setCurrency(currencyId).then(
                (session: SessionModel) => { this.setCurrencyCompleted(session); },
                (error: any) => { this.setCurrencyFailed(error); });
        }

        protected setCurrencyCompleted(session: SessionModel): void {
            this.$window.location.reload();
        }

        protected setCurrencyFailed(error: any): void {
        }

        signOut(returnUrl: string): void {
            this.sessionService.signOut().then(
                (signOutResult: string) => { this.signOutCompleted(signOutResult, returnUrl); },
                (error: any) => { this.signOutFailed(error); });
        }

        protected signOutCompleted(signOutResult: string, returnUrl: string): void {
            this.$window.location.href = returnUrl;
        }

        protected signOutFailed(error: any): void {
        }

        protected checkCurrentPageForMessages(): void {
            const currentUrl = this.coreService.getCurrentPath();
            const index = currentUrl.indexOf(this.dashboardUrl.toLowerCase());
            const show = index === -1 || (index + this.dashboardUrl.length !== currentUrl.length);

            if (!show && this.session.hasRfqUpdates) {
                this.closeQuoteInformation();
            }
        }

        protected closeQuoteInformation(): void {
            this.session.hasRfqUpdates = false;

            const session = <SessionModel>{};
            session.hasRfqUpdates = false;

            this.updateSession(session);
        }

        protected updateSession(session: SessionModel): void {
            this.sessionService.updateSession(session).then(
                (sessionResult: SessionModel) => { this.updateSessionCompleted(sessionResult); },
                (error: any) => { this.updateSessionFailed(error); });
        }

        protected updateSessionCompleted(session: SessionModel): void {
        }

        protected updateSessionFailed(error: any): void {
        }

        protected openDeliveryMethodPopup() {
            this.deliveryMethodPopupService.display({
                session: this.session
            });
        }
    }

    angular
        .module("insite")
        .controller("TopNavController", TopNavController);
}