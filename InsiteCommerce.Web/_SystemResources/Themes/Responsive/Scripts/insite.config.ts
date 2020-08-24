module insite {
    "use strict";

    export interface IContentPageStateParams extends angular.ui.IStateParamsService {
        path: string;
        bypassFilters: boolean;
        experimentMode: boolean;
    }

    export interface ISearchMicrositeStateParams extends angular.ui.IStateParamsService {
        microsite: string;
    }

    export class Config {
        static $inject = ["$httpProvider", "$sceDelegateProvider", "$compileProvider", "$stateProvider", "$urlRouterProvider", "$locationProvider", "$provide"];

        constructor(
            protected $httpProvider: ng.IHttpProvider,
            protected $sceDelegateProvider: ng.ISCEDelegateProvider,
            protected $compileProvider: ng.ICompileProvider,
            protected $stateProvider: angular.ui.IStateProvider,
            protected $urlRouterProvider: angular.ui.IUrlRouterProvider,
            protected $locationProvider: ng.ILocationProvider,
            protected $provide: ng.auto.IProvideService) {
            const baseUri = $("body").attr("data-webApiRoot");
            const sirvUrlRegExp = new RegExp("^(https?):\\/\\/(w{3}\\.)?([a-zA-Z0-9][a-zA-Z0-9-_]*\\.)sirv\.com\\/.+$");
            if (typeof (baseUri) !== "undefined" && baseUri !== "") {
                $sceDelegateProvider.resourceUrlWhitelist(["self", `${baseUri}/**`, sirvUrlRegExp]);
                $httpProvider.defaults.withCredentials = true;
            } else {
                $sceDelegateProvider.resourceUrlWhitelist(["self", sirvUrlRegExp]);
            }

            // set ASP.NET IsAjaxRequest to 'true'
            $httpProvider.defaults.headers.common = $httpProvider.defaults.headers.common || {};
            $httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

            $httpProvider.interceptors.push("authenticationInterceptor");
            $httpProvider.interceptors.push("httpErrorsInterceptor");

            $compileProvider.debugInfoEnabled(false);

            // turn off router on first page view because we render it server side. AppRunService will turn it back on.
            $urlRouterProvider.deferIntercept();

            setTimeout(() => {
                const cmsFrameService = angular.element("body").injector().get("cmsFrameService");
                if (typeof (cmsFrameService) !== "undefined") {
                    cmsFrameService.enableQuickReloads();
                }
            }, 100);


            // all pages are the same state and make requests for the partials on the server
            $stateProvider
                .state("search", {
                    url: "/search?criteria&includeSuggestions",
                    templateUrl: () => "/search"
                })
                .state("search_microsite", {
                    url: "/:microsite/search?criteria&includeSuggestions",
                    templateUrl: (stateParams: ISearchMicrositeStateParams) => `/${stateParams.microsite}/search`
                })
                .state("content", {
                    url: "*path?stateChange&bypassFilters&experimentMode",
                    templateUrl: (stateParams: IContentPageStateParams) => {
                        let url = stateParams.path;
                        if (typeof (stateParams.bypassFilters) !== "undefined") {
                            url += `?bypassFilters=${stateParams.bypassFilters}`;
                        }
                        if (typeof (stateParams.experimentMode) !== "undefined") {
                            url += (url.indexOf("?") >= 0 ? "&" : "?") + `experimentMode=${stateParams.experimentMode}`;
                        }
                        return url;
                    }
                });

            $locationProvider.html5Mode(true);

            $provide.decorator("$exceptionHandler", ["$delegate", ($delegate: ng.IExceptionHandlerService) => (exception: Error, cause: string) => {
                if (typeof (window.recordError) === "function") {
                    window.recordError(exception.message);
                }
                $delegate(exception, cause);
            }]);
        }
    }

    angular
        .module("insite")
        .config(["$httpProvider", "$sceDelegateProvider", "$compileProvider", "$stateProvider", "$urlRouterProvider", "$locationProvider", "$provide",
            ($httpProvider: ng.IHttpProvider, $sceDelegateProvider: ng.ISCEDelegateProvider, $compileProvider: ng.ICompileProvider, $stateProvider: angular.ui.IStateProvider, $urlRouterProvider: angular.ui.IUrlRouterProvider, $locationProvider: ng.ILocationProvider, $provide: ng.auto.IProvideService) =>
                new Config($httpProvider, $sceDelegateProvider, $compileProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide)]);
}