module insite.multisite {

    export class MultiSiteController {

        canadaLanguages: any[] = [];
        usLanguages: any;
        language: any ;
        preferedLanguage: any;
        resetLang: any;
        session: any;

        static $inject = [
            "$scope",
            "$http",
            "$window",
            "sessionService",
            "websiteService",
            "accountService",
            "coreService",
            "ipCookie"];

        constructor(
            protected $scope: ng.IScope,
            protected $http: ng.IHttpService,
            protected $window: ng.IWindowService,
            protected sessionService: account.ISessionService,
            protected websiteService: websites.IWebsiteService,
            protected accountService: account.IAccountService,
            protected coreService: core.ICoreService,
            protected ipCookie: any) {
            this.init();
        }

        init() {

            this.getLanguages().success(languages => {
                var lang = JSON.parse(languages.properties['allLanguages']);

                lang.forEach(l=> {
                    if (l.length >= 1) {
                        l.forEach(lang => {
                            if (lang.website == 'BrasselerCanada') {
                                this.canadaLanguages.push(lang);
                                if (lang.id == this.ipCookie("CurrentLanguageId")) {
                                    this.preferedLanguage = lang.id;
                                    this.resetLang = this.preferedLanguage;
                                }
                            } else if (lang.website == 'BrasselerUSA') {
                                this.usLanguages = lang;
                            }
                        });
                    }
                });
            });
        }

        getLanguages(): ng.IHttpPromise<WebsiteModel> {
            var serviceUri = "/api/v1/websites/current/languages";
            //var uri = serviceUri;
            return this.$http.get(serviceUri);
        }

        setLanguage(languageId: string): void {
           
            languageId = languageId;
            this.sessionService.setLanguage(languageId).then(() => {
                if (this.$window.location.href.indexOf("AutoSwitchContext") === -1) {
                    if (this.$window.location.href.indexOf("?") === -1) {
                        this.$window.location.href = this.$window.location.href + "?AutoSwitchContext=false";
                    } else {
                        this.$window.location.href = this.$window.location.href + "&AutoSwitchContext=false";
                    }
                } else {
                    this.$window.location.reload();
                }
            });
        }

        setCookie() {
            this.ipCookie("siteHit", true, { path: "/" });
        }

        redirect() {
            this.$window.location.href = 'http://' + this.language.domain.split(",")[0] + '?Lang=' + this.language.id;
        }

        resetLanguage() {
            this.preferedLanguage = this.resetLang;
        }

        setProfileLanguage() {

            this.setLanguage(this.preferedLanguage);
            // Populate Account with the Language
            this.accountService.getAccount().then(account => {
                account.properties["userLanguage"] = this.preferedLanguage;
                this.accountService.updateAccount(account);
            });
        }
    }

    angular
        .module("insite")
        .controller("MultiSiteController", MultiSiteController);
}