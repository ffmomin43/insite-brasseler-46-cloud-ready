declare let insiteMicrositeUriPrefix: any;
declare let insiteBasicAuthHeader: any;
declare let insiteScope: any;

module insite.core {
    "use strict";

    export class AuthenticationInterceptor {
        static $inject = ["$window", "$q", "spinnerService"];

        constructor(
            protected $window: ng.IWindowService,
            protected $q: ng.IQService,
            protected spinnerService: core.ISpinnerService) {
        }

        request = (config: ng.IRequestConfig): ng.IRequestConfig => {
            config.headers = config.headers || {};
            if (config.url.indexOf("account/isauthenticated") === -1 && this.$window.localStorage.getItem("accessToken")) {
                config.headers.Authorization = `Bearer ${this.$window.localStorage.getItem("accessToken")}`;
            }

            if (config.url.substr(0, 1) === "/" && insiteMicrositeUriPrefix && insiteMicrositeUriPrefix.length > 0) {
                if (config.url.toLocaleLowerCase().indexOf("/partialviews/") === -1) {
                    let addMicrositeToUrl = insiteMicrositeUriPrefix.substr(1);
                    if (config.url.indexOf("?") === -1) {
                        addMicrositeToUrl = `?microsite=${addMicrositeToUrl}`;
                    } else {
                        addMicrositeToUrl = `&microsite=${addMicrositeToUrl}`;
                    }

                    config.url += addMicrositeToUrl;
                } else {
                    config.url = `${insiteMicrositeUriPrefix}${config.url}`;
                }
            }

            return config;
        }

        responseError = (response: any): ng.IPromise<any> => {
            this.spinnerService.hide();

            if (response.status === 401) {
                // If we got a 401, but do have a local access token, then our access token has expired, need to remove it
                // Note: We can't use sessionService.isAuthenticated() because of circular dependency
                if (this.$window.localStorage.getItem("accessToken") !== null) {
                    this.$window.localStorage.removeItem("accessToken");

                    // force reload the browser window to invalidate all the etags and not get any stale data
                    this.$window.location.reload(true);
                }
            }

            return this.$q.reject(response);
        }
    }

    angular
        .module("insite")
        .factory("authenticationInterceptor", ["$window", "$q", "spinnerService",
            ($window: ng.IWindowService, $q: ng.IQService, spinnerService: ISpinnerService) =>
                new AuthenticationInterceptor($window, $q, spinnerService)]);
}