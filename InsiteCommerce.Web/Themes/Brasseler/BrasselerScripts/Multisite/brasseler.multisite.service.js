var insite;
(function (insite) {
    var multisite;
    (function (multisite) {
        var MultiSiteController = /** @class */ (function () {
            function MultiSiteController($scope, $http, $window, sessionService, websiteService, accountService, coreService, ipCookie) {
                this.$scope = $scope;
                this.$http = $http;
                this.$window = $window;
                this.sessionService = sessionService;
                this.websiteService = websiteService;
                this.accountService = accountService;
                this.coreService = coreService;
                this.ipCookie = ipCookie;
                this.canadaLanguages = [];
                this.init();
            }
            MultiSiteController.prototype.init = function () {
                var _this = this;
                this.getLanguages().success(function (languages) {
                    var lang = JSON.parse(languages.properties['allLanguages']);
                    lang.forEach(function (l) {
                        if (l.length >= 1) {
                            l.forEach(function (lang) {
                                if (lang.website == 'BrasselerCanada') {
                                    _this.canadaLanguages.push(lang);
                                    if (lang.id == _this.ipCookie("CurrentLanguageId")) {
                                        _this.preferedLanguage = lang.id;
                                        _this.resetLang = _this.preferedLanguage;
                                    }
                                }
                                else if (lang.website == 'BrasselerUSA') {
                                    _this.usLanguages = lang;
                                }
                            });
                        }
                    });
                });
            };
            MultiSiteController.prototype.getLanguages = function () {
                var serviceUri = "/api/v1/websites/current/languages";
                //var uri = serviceUri;
                return this.$http.get(serviceUri);
            };
            MultiSiteController.prototype.setLanguage = function (languageId) {
                var _this = this;
                languageId = languageId;
                this.sessionService.setLanguage(languageId).then(function () {
                    if (_this.$window.location.href.indexOf("AutoSwitchContext") === -1) {
                        if (_this.$window.location.href.indexOf("?") === -1) {
                            _this.$window.location.href = _this.$window.location.href + "?AutoSwitchContext=false";
                        }
                        else {
                            _this.$window.location.href = _this.$window.location.href + "&AutoSwitchContext=false";
                        }
                    }
                    else {
                        _this.$window.location.reload();
                    }
                });
            };
            MultiSiteController.prototype.setCookie = function () {
                this.ipCookie("siteHit", true, { path: "/" });
            };
            MultiSiteController.prototype.redirect = function () {
                this.$window.location.href = 'http://' + this.language.domain.split(",")[0] + '?Lang=' + this.language.id;
            };
            MultiSiteController.prototype.resetLanguage = function () {
                this.preferedLanguage = this.resetLang;
            };
            MultiSiteController.prototype.setProfileLanguage = function () {
                var _this = this;
                this.setLanguage(this.preferedLanguage);
                // Populate Account with the Language
                this.accountService.getAccount().then(function (account) {
                    account.properties["userLanguage"] = _this.preferedLanguage;
                    _this.accountService.updateAccount(account);
                });
            };
            MultiSiteController.$inject = [
                "$scope",
                "$http",
                "$window",
                "sessionService",
                "websiteService",
                "accountService",
                "coreService",
                "ipCookie"
            ];
            return MultiSiteController;
        }());
        multisite.MultiSiteController = MultiSiteController;
        angular
            .module("insite")
            .controller("MultiSiteController", MultiSiteController);
    })(multisite = insite.multisite || (insite.multisite = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.multisite.service.js.map