var insite;
(function (insite) {
    "use strict";
    var AppRunService = /** @class */ (function () {
        function AppRunService(coreService, $localStorage, $window, $rootScope, $urlRouter, spinnerService, $location, $anchorScroll) {
            this.coreService = coreService;
            this.$localStorage = $localStorage;
            this.$window = $window;
            this.$rootScope = $rootScope;
            this.$urlRouter = $urlRouter;
            this.spinnerService = spinnerService;
            this.$location = $location;
            this.$anchorScroll = $anchorScroll;
            this.filesExtensionForOpenInNewTab = ["jpg", "pdf", "gif", "jpeg", "xlsx", "xls", "txt"];
        }
        AppRunService.prototype.run = function () {
            var _this = this;
            window.coreService = this.coreService;
            this.baseUrl = this.$location.host();
            // If access_token is included in the query string, set it in local storage, this is used for authenticated swagger calls
            var hash = this.queryString(this.$window.location.pathname.split("&"));
            var accessToken = hash.access_token;
            if (accessToken) {
                this.$localStorage.set("accessToken", accessToken);
                var startHash = this.$window.location.pathname.indexOf("id_token");
                this.$window.location.pathname = this.$window.location.pathname.substring(0, startHash);
            }
            if (!accessToken) {
                var queryString = this.queryString(this.$window.location.search.replace(/^\?/, '').split("&"));
                if (queryString.access_token) {
                    this.$localStorage.set("accessToken", queryString.access_token);
                }
            }
            this.$rootScope.firstPage = true;
            this.$rootScope.$on("$locationChangeSuccess", function (event, newUrl, oldUrl) { _this.onLocationChangeSuccess(newUrl, oldUrl); });
            this.$rootScope.$on("$locationChangeStart", function (event, newUrl, oldUrl) { _this.actualOnLocationChangeStart(event, newUrl, oldUrl); });
            this.$rootScope.$on("$stateChangeStart", function () { _this.onLocationChangeStart(); });
            this.$rootScope.$on("$stateChangeSuccess", function () { _this.onStateChangeSuccess(); });
            // this seems to wait for rendering to be done but i dont think its bullet proof
            this.$rootScope.$on("$viewContentLoaded", function () { _this.onViewContentLoaded(); });
        };
        AppRunService.prototype.onLocationChangeSuccess = function (newUrl, oldUrl) {
            if (this.$rootScope.firstPage) {
                newUrl = newUrl.split("#").shift();
                oldUrl = oldUrl.split("#").shift();
                if (newUrl === oldUrl) {
                    return;
                }
                this.$rootScope.firstPage = false;
                this.$urlRouter.sync();
                this.$urlRouter.listen();
            }
        };
        AppRunService.prototype.onLocationChangeStart = function () {
            this.spinnerService.show("mainLayout");
        };
        AppRunService.prototype.onStateChangeSuccess = function () {
            this.spinnerService.hide("mainLayout");
        };
        AppRunService.prototype.actualOnLocationChangeStart = function (event, newUrl, oldUrl) {
            if (newUrl.toLowerCase() === oldUrl.toLowerCase()) {
                return;
            }
            if (newUrl.indexOf(this.baseUrl) !== -1 && this.filesExtensionForOpenInNewTab.some(function (fileExt) { return newUrl.indexOf("." + fileExt) !== -1; })) {
                event.preventDefault();
                this.$window.open(newUrl, "_blank");
            }
        };
        AppRunService.prototype.onViewContentLoaded = function () {
            $(document).foundation();
            if (!this.$rootScope.firstPage) {
                this.sendGoogleAnalytics();
            }
            this.sendVirtualPageView();
            this.$anchorScroll();
        };
        AppRunService.prototype.sendGoogleAnalytics = function () {
            if (typeof ga !== "undefined") {
                ga("set", "location", this.$location.absUrl());
                ga("set", "page", this.$location.url());
                ga("send", "pageview");
            }
        };
        AppRunService.prototype.sendVirtualPageView = function () {
            if (window.dataLayer && window.google_tag_manager) {
                window.dataLayer.push({
                    event: "virtualPageView",
                    page: {
                        title: window.document.title,
                        url: this.$location.url()
                    }
                });
            }
        };
        AppRunService.prototype.queryString = function (a) {
            if (!a) {
                return {};
            }
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split("=");
                if (p.length !== 2) {
                    continue;
                }
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        };
        AppRunService.$inject = ["coreService", "$localStorage", "$window", "$rootScope", "$urlRouter", "spinnerService", "$location", "$anchorScroll"];
        return AppRunService;
    }());
    insite.AppRunService = AppRunService;
    angular
        .module("insite", [
        "insite-common",
        "insite-cmsShell",
        "ngSanitize",
        "ipCookie",
        "angular.filter",
        "ngMap",
        "ab-base64",
        "kendo.directives",
        "ui.router",
        "ui.router.state.events",
        "ui.sortable"
    ])
        .run(["appRunService", function ($appRunService) { $appRunService.run(); }])
        .service("appRunService", AppRunService);
    angular
        .module("ngMap")
        .directive("map", function () {
        return {
            priority: 100,
            terminal: true
        };
    });
})(insite || (insite = {}));
//# sourceMappingURL=insite.module.js.map