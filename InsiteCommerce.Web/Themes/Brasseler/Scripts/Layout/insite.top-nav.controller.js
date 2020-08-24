var insite;
(function (insite) {
    var layout;
    (function (layout) {
        "use strict";
        var TopNavController = /** @class */ (function () {
            function TopNavController($scope, $window, $attrs, sessionService, websiteService, coreService, settingsService, deliveryMethodPopupService) {
                this.$scope = $scope;
                this.$window = $window;
                this.$attrs = $attrs;
                this.sessionService = sessionService;
                this.websiteService = websiteService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.deliveryMethodPopupService = deliveryMethodPopupService;
            }
            TopNavController.prototype.$onInit = function () {
                var _this = this;
                this.dashboardUrl = this.$attrs.dashboardUrl;
                // TODO ISC-4406
                // TODO ISC-2937 SPA kill all of the things that depend on broadcast for session and convert them to this, assuming we can properly cache this call
                // otherwise determine some method for a child to say "I expect my parent to have a session, and I want to use it" broadcast will not work for that
                this.getSession();
                this.getSettings();
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
                this.$scope.$on("updateHeaderSession", function () {
                    _this.getSession();
                });
            };
            TopNavController.prototype.onSessionUpdated = function (session) {
                this.session = session;
            };
            TopNavController.prototype.getSession = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            TopNavController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.getWebsite("languages,currencies");
            };
            TopNavController.prototype.getSessionFailed = function (error) {
            };
            TopNavController.prototype.getSettings = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            TopNavController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.accountSettings = settingsCollection.accountSettings;
            };
            TopNavController.prototype.getSettingsFailed = function (error) {
            };
            TopNavController.prototype.getWebsite = function (expand) {
                var _this = this;
                this.websiteService.getWebsite(expand).then(function (website) { _this.getWebsiteCompleted(website); }, function (error) { _this.getWebsitedFailed(error); });
            };
            TopNavController.prototype.getWebsiteCompleted = function (website) {
                var _this = this;
                this.languages = website.languages.languages.filter(function (l) { return l.isLive; });
                this.currencies = website.currencies.currencies;
                this.checkCurrentPageForMessages();
                angular.forEach(this.languages, function (language) {
                    if (language.id === _this.session.language.id) {
                        _this.session.language = language;
                    }
                });
                angular.forEach(this.currencies, function (currency) {
                    if (currency.id === _this.session.currency.id) {
                        _this.session.currency = currency;
                    }
                });
            };
            TopNavController.prototype.getWebsitedFailed = function (error) {
            };
            TopNavController.prototype.setLanguage = function (languageId) {
                var _this = this;
                languageId = languageId ? languageId : this.session.language.id;
                this.sessionService.setLanguage(languageId).then(function (session) { _this.setLanguageCompleted(session); }, function (error) { _this.setLanguageFailed(error); });
            };
            TopNavController.prototype.setLanguageCompleted = function (session) {
                if (this.$window.location.href.indexOf("AutoSwitchContext") === -1) {
                    if (this.$window.location.href.indexOf("?") === -1) {
                        this.$window.location.href = this.$window.location.href + "?AutoSwitchContext=false";
                    }
                    else {
                        this.$window.location.href = this.$window.location.href + "&AutoSwitchContext=false";
                    }
                }
                else {
                    this.$window.location.reload();
                }
            };
            TopNavController.prototype.setLanguageFailed = function (error) {
            };
            TopNavController.prototype.setCurrency = function (currencyId) {
                var _this = this;
                currencyId = currencyId ? currencyId : this.session.currency.id;
                this.sessionService.setCurrency(currencyId).then(function (session) { _this.setCurrencyCompleted(session); }, function (error) { _this.setCurrencyFailed(error); });
            };
            TopNavController.prototype.setCurrencyCompleted = function (session) {
                this.$window.location.reload();
            };
            TopNavController.prototype.setCurrencyFailed = function (error) {
            };
            TopNavController.prototype.signOut = function (returnUrl) {
                var _this = this;
                this.sessionService.signOut().then(function (signOutResult) { _this.signOutCompleted(signOutResult, returnUrl); }, function (error) { _this.signOutFailed(error); });
            };
            TopNavController.prototype.signOutCompleted = function (signOutResult, returnUrl) {
                this.$window.location.href = returnUrl;
            };
            TopNavController.prototype.signOutFailed = function (error) {
            };
            TopNavController.prototype.checkCurrentPageForMessages = function () {
                var currentUrl = this.coreService.getCurrentPath();
                var index = currentUrl.indexOf(this.dashboardUrl.toLowerCase());
                var show = index === -1 || (index + this.dashboardUrl.length !== currentUrl.length);
                if (!show && this.session.hasRfqUpdates) {
                    this.closeQuoteInformation();
                }
            };
            TopNavController.prototype.closeQuoteInformation = function () {
                this.session.hasRfqUpdates = false;
                var session = {};
                session.hasRfqUpdates = false;
                this.updateSession(session);
            };
            TopNavController.prototype.updateSession = function (session) {
                var _this = this;
                this.sessionService.updateSession(session).then(function (sessionResult) { _this.updateSessionCompleted(sessionResult); }, function (error) { _this.updateSessionFailed(error); });
            };
            TopNavController.prototype.updateSessionCompleted = function (session) {
            };
            TopNavController.prototype.updateSessionFailed = function (error) {
            };
            TopNavController.prototype.openDeliveryMethodPopup = function () {
                this.deliveryMethodPopupService.display({
                    session: this.session
                });
            };
            TopNavController.$inject = ["$scope", "$window", "$attrs", "sessionService", "websiteService", "coreService", "settingsService", "deliveryMethodPopupService"];
            return TopNavController;
        }());
        layout.TopNavController = TopNavController;
        angular
            .module("insite")
            .controller("TopNavController", TopNavController);
    })(layout = insite.layout || (insite.layout = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.top-nav.controller.js.map