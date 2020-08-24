var insite;
(function (insite) {
    "use strict";
    var Config = /** @class */ (function () {
        function Config($httpProvider, $sceDelegateProvider, $compileProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide) {
            this.$httpProvider = $httpProvider;
            this.$sceDelegateProvider = $sceDelegateProvider;
            this.$compileProvider = $compileProvider;
            this.$stateProvider = $stateProvider;
            this.$urlRouterProvider = $urlRouterProvider;
            this.$locationProvider = $locationProvider;
            this.$provide = $provide;
            var baseUri = $("body").attr("data-webApiRoot");
            var sirvUrlRegExp = new RegExp("^(https?):\\/\\/(w{3}\\.)?([a-zA-Z0-9][a-zA-Z0-9-_]*\\.)sirv\.com\\/.+$");
            if (typeof (baseUri) !== "undefined" && baseUri !== "") {
                $sceDelegateProvider.resourceUrlWhitelist(["self", baseUri + "/**", sirvUrlRegExp]);
                $httpProvider.defaults.withCredentials = true;
            }
            else {
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
            setTimeout(function () {
                var cmsFrameService = angular.element("body").injector().get("cmsFrameService");
                if (typeof (cmsFrameService) !== "undefined") {
                    cmsFrameService.enableQuickReloads();
                }
            }, 100);
            // all pages are the same state and make requests for the partials on the server
            $stateProvider
                .state("search", {
                url: "/search?criteria&includeSuggestions",
                templateUrl: function () { return "/search"; }
            })
                .state("search_microsite", {
                url: "/:microsite/search?criteria&includeSuggestions",
                templateUrl: function (stateParams) { return "/" + stateParams.microsite + "/search"; }
            })
                .state("content", {
                url: "*path?stateChange&bypassFilters&experimentMode",
                templateUrl: function (stateParams) {
                    var url = stateParams.path;
                    if (typeof (stateParams.bypassFilters) !== "undefined") {
                        url += "?bypassFilters=" + stateParams.bypassFilters;
                    }
                    if (typeof (stateParams.experimentMode) !== "undefined") {
                        url += (url.indexOf("?") >= 0 ? "&" : "?") + ("experimentMode=" + stateParams.experimentMode);
                    }
                    return url;
                }
            });
            $locationProvider.html5Mode(true);
            $provide.decorator("$exceptionHandler", ["$delegate", function ($delegate) { return function (exception, cause) {
                    if (typeof (window.recordError) === "function") {
                        window.recordError(exception.message);
                    }
                    $delegate(exception, cause);
                }; }]);
        }
        Config.$inject = ["$httpProvider", "$sceDelegateProvider", "$compileProvider", "$stateProvider", "$urlRouterProvider", "$locationProvider", "$provide"];
        return Config;
    }());
    insite.Config = Config;
    angular
        .module("insite")
        .config(["$httpProvider", "$sceDelegateProvider", "$compileProvider", "$stateProvider", "$urlRouterProvider", "$locationProvider", "$provide",
        function ($httpProvider, $sceDelegateProvider, $compileProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide) {
            return new Config($httpProvider, $sceDelegateProvider, $compileProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide);
        }]);
})(insite || (insite = {}));
//# sourceMappingURL=insite.config.js.map