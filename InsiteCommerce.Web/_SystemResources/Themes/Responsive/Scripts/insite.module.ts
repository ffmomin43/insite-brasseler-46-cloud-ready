interface Window {
    javaScriptErrors: string[];
    recordError(errorMessage: string): void;
    dataLayer: any;
    currentVersion: string;
    safariBackUrl: string;
    safariBackState: any;
    disablePendo: boolean;
}

module insite {
    "use strict";

    export interface IAppRootScope extends ng.IRootScopeService {
        firstPage: boolean;
    }

    export interface IAppRunService {
        run: () => void;
    }

    export class AppRunService implements IAppRunService {
        filesExtensionForOpenInNewTab = ["jpg", "pdf", "gif", "jpeg", "xlsx", "xls", "txt"];
        baseUrl: string;

        static $inject = ["coreService", "$localStorage", "$window", "$rootScope", "$urlRouter", "spinnerService", "$location", "$anchorScroll"];

        constructor(
            protected coreService: core.ICoreService,
            protected $localStorage: common.IWindowStorage,
            protected $window: ng.IWindowService,
            protected $rootScope: IAppRootScope,
            protected $urlRouter: angular.ui.IUrlRouterService,
            protected spinnerService: core.ISpinnerService,
            protected $location: ng.ILocationService,
            protected $anchorScroll: ng.IAnchorScrollService) {
        }

        run(): void {
            (window as any).coreService = this.coreService;
            this.baseUrl = this.$location.host();
            // If access_token is included in the query string, set it in local storage, this is used for authenticated swagger calls
            const hash: any = this.queryString(this.$window.location.pathname.split("&"));
            let accessToken = hash.access_token;
            if (accessToken) {
                this.$localStorage.set("accessToken", accessToken);
                const startHash = this.$window.location.pathname.indexOf("id_token");
                this.$window.location.pathname = this.$window.location.pathname.substring(0, startHash);
            }

            if (!accessToken) {
                const queryString: any = this.queryString(this.$window.location.search.replace(/^\?/, '').split("&"));
                if (queryString.access_token) {
                    this.$localStorage.set("accessToken", queryString.access_token);
                }
            }

            this.$rootScope.firstPage = true;

            this.$rootScope.$on("$locationChangeSuccess", (event, newUrl, oldUrl) => { this.onLocationChangeSuccess(newUrl, oldUrl); });
            this.$rootScope.$on("$locationChangeStart", (event, newUrl, oldUrl) => { this.actualOnLocationChangeStart(event, newUrl, oldUrl); });
            this.$rootScope.$on("$stateChangeStart", () => { this.onLocationChangeStart(); });

            this.$rootScope.$on("$stateChangeSuccess", () => { this.onStateChangeSuccess(); });

            // this seems to wait for rendering to be done but i dont think its bullet proof
            this.$rootScope.$on("$viewContentLoaded", () => { this.onViewContentLoaded(); });
        }

        protected onLocationChangeSuccess(newUrl, oldUrl): void {
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
        }

        protected onLocationChangeStart(): void {
            this.spinnerService.show("mainLayout");
        }

        protected onStateChangeSuccess(): void {
            this.spinnerService.hide("mainLayout");
        }

        protected actualOnLocationChangeStart(event, newUrl, oldUrl): void {
            if (newUrl.toLowerCase() === oldUrl.toLowerCase()) {
                return;
            }

            if (newUrl.indexOf(this.baseUrl) !== -1 && this.filesExtensionForOpenInNewTab.some(fileExt => newUrl.indexOf(`.${fileExt}`) !== -1)) {
                event.preventDefault();
                this.$window.open(newUrl, "_blank");
            }
        }

        protected onViewContentLoaded(): void {
            ($(document) as any).foundation();
            if (!this.$rootScope.firstPage) {
                this.sendGoogleAnalytics();
            }
            this.sendVirtualPageView();
            this.$anchorScroll();
        }

        sendGoogleAnalytics(): void {
            if (typeof ga !== "undefined") {
                ga("set", "location", this.$location.absUrl());
                ga("set", "page", this.$location.url());
                ga("send", "pageview");
            }
        }

        sendVirtualPageView(): void {
            if (window.dataLayer && (window as any).google_tag_manager) {
                window.dataLayer.push({
                    event: "virtualPageView",
                    page: {
                        title: window.document.title,
                        url: this.$location.url()
                    }
                });
            }
        }

        protected queryString(a: string[]): { [key: string]: string; } {
            if (!a) {
                return {};
            }
            const b: { [key: string]: string; } = {};
            for (let i = 0; i < a.length; ++i) {
                const p = a[i].split("=");
                if (p.length !== 2) {
                    continue;
                }
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        }
    }

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
        .run(["appRunService", ($appRunService: IAppRunService) => { $appRunService.run(); }])
        .service("appRunService", AppRunService);

    angular
        .module("ngMap")
        .directive("map", () => {
            return {
                priority: 100,
                terminal: true
            }
        });
}