module insite.language {
    "use strict";

    export class LanguageController {
        session: any;
        languages: any[];
        showLanguagesMenu: boolean;
        languageButton: any;

        static $inject = ["$scope", "$window", "$timeout", "sessionService", "websiteService"];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected $timeout: ng.ITimeoutService,
            protected sessionService: account.ISessionService,
            protected websiteService: websites.IWebsiteService) {
        }

        $onInit(): void {
            angular.element(window.document).bind("click", event => {
                if (this.languageButton && this.languageButton !== event.target && this.languageButton.find(event.target).length === 0) {
                    this.showLanguagesMenu = false;
                    this.$scope.$apply();
                }
            });

            this.getSession();
        }

        protected getSession(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.getWebsite("languages");
        }

        protected getSessionFailed(error: any): void {
        }

        protected getWebsite(expand: string): void {
            this.websiteService.getWebsite(expand).then(
                (website: WebsiteModel) => { this.getWebsiteCompleted(website); },
                (error: any) => { this.getWebsitedFailed(error); });
        }

        protected getWebsiteCompleted(website: WebsiteModel): void {
            this.languages = website.languages.languages.filter(l => l.isLive);

            angular.forEach(this.languages, (language: any) => {
                if (language.id === this.session.language.id) {
                    this.session.language = language;
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

        protected openLanguagesMenu(event): void {
            this.showLanguagesMenu = !this.showLanguagesMenu;
            this.$timeout(() => {
                this.languageButton = angular.element(event.currentTarget);
                const languagesMenu = angular.element(event.currentTarget).find(".languages-menu");
                const eOffset = this.languageButton.offset();
                let top = eOffset.top;

                angular.element("body").append(languagesMenu.detach());

                if (top > languagesMenu.height()) {
                    top = top - languagesMenu.height();
                } else {
                    top = top + this.languageButton.height();
                }

                languagesMenu.css({ "top": top, "left": eOffset.left, "visibility": "visible" });
            });
        }
    }

    angular
        .module("insite")
        .controller("LanguageController", LanguageController);
}