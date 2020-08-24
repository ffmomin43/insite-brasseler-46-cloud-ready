var insite;
(function (insite) {
    var language;
    (function (language_1) {
        "use strict";
        var LanguageController = /** @class */ (function () {
            function LanguageController($scope, $window, $timeout, sessionService, websiteService) {
                this.$scope = $scope;
                this.$window = $window;
                this.$timeout = $timeout;
                this.sessionService = sessionService;
                this.websiteService = websiteService;
            }
            LanguageController.prototype.$onInit = function () {
                var _this = this;
                angular.element(window.document).bind("click", function (event) {
                    if (_this.languageButton && _this.languageButton !== event.target && _this.languageButton.find(event.target).length === 0) {
                        _this.showLanguagesMenu = false;
                        _this.$scope.$apply();
                    }
                });
                this.getSession();
            };
            LanguageController.prototype.getSession = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            LanguageController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.getWebsite("languages");
            };
            LanguageController.prototype.getSessionFailed = function (error) {
            };
            LanguageController.prototype.getWebsite = function (expand) {
                var _this = this;
                this.websiteService.getWebsite(expand).then(function (website) { _this.getWebsiteCompleted(website); }, function (error) { _this.getWebsitedFailed(error); });
            };
            LanguageController.prototype.getWebsiteCompleted = function (website) {
                var _this = this;
                this.languages = website.languages.languages.filter(function (l) { return l.isLive; });
                angular.forEach(this.languages, function (language) {
                    if (language.id === _this.session.language.id) {
                        _this.session.language = language;
                    }
                });
            };
            LanguageController.prototype.getWebsitedFailed = function (error) {
            };
            LanguageController.prototype.setLanguage = function (languageId) {
                var _this = this;
                languageId = languageId ? languageId : this.session.language.id;
                this.sessionService.setLanguage(languageId).then(function (session) { _this.setLanguageCompleted(session); }, function (error) { _this.setLanguageFailed(error); });
            };
            LanguageController.prototype.setLanguageCompleted = function (session) {
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
            LanguageController.prototype.setLanguageFailed = function (error) {
            };
            LanguageController.prototype.openLanguagesMenu = function (event) {
                var _this = this;
                this.showLanguagesMenu = !this.showLanguagesMenu;
                this.$timeout(function () {
                    _this.languageButton = angular.element(event.currentTarget);
                    var languagesMenu = angular.element(event.currentTarget).find(".languages-menu");
                    var eOffset = _this.languageButton.offset();
                    var top = eOffset.top;
                    angular.element("body").append(languagesMenu.detach());
                    if (top > languagesMenu.height()) {
                        top = top - languagesMenu.height();
                    }
                    else {
                        top = top + _this.languageButton.height();
                    }
                    languagesMenu.css({ "top": top, "left": eOffset.left, "visibility": "visible" });
                });
            };
            LanguageController.$inject = ["$scope", "$window", "$timeout", "sessionService", "websiteService"];
            return LanguageController;
        }());
        language_1.LanguageController = LanguageController;
        angular
            .module("insite")
            .controller("LanguageController", LanguageController);
    })(language = insite.language || (insite.language = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.language.controller.js.map