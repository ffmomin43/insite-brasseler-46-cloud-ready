module insite.core {
    "use strict";

    interface ICustomRequestConfig extends ng.IRequestConfig {
        bypassErrorInterceptor?: boolean;
    }

    export class HttpErrorsInterceptor {
        xhrCreations = 0;
        xhrResolutions = 0;

        static $inject = ["$q", "$rootScope", "spinnerService"];

        constructor(
            protected $q: ng.IQService,
            protected $rootScope: ng.IRootScopeService,
            protected spinnerService: core.ISpinnerService) {
        }

        request = (config: ng.IRequestConfig): ng.IRequestConfig => {
            this.xhrCreations++;
            return config;
        }

        requestError = (rejection: any): ng.IPromise<any> => {
            this.xhrResolutions++;
            this.updateLoadingStatus();
            return this.$q.reject(rejection);
        }

        response = (response: any): ng.IRequestConfig => {
            this.xhrResolutions++;
            this.updateLoadingStatus();
            return response;
        }

        responseError = (response: ng.IHttpPromiseCallbackArg<any>): ng.IPromise<any> => {
            this.xhrResolutions++;
            this.updateLoadingStatus();
            const config: ICustomRequestConfig = response.config;
            // TODO ditch bypassError completely?
            if (config.bypassErrorInterceptor) {
                return this.$q.reject(response);
            }
            if (response.status === 500) {
                this.$rootScope.$broadcast("displayApiErrorPopup", response.data);
            }
            if (response.status === 404 && !this.isApiRequest(config)) {
                return this.$q.when(response);
            }

            return this.$q.reject(response);
        }

        protected updateLoadingStatus(): void {
            if (this.xhrResolutions >= this.xhrCreations) {
                this.spinnerService.hideAll();
            }
        }

        protected isApiRequest(config: ng.IRequestConfig): boolean {
            return config.url.length >= 5 && config.url.toLocaleLowerCase().substr(0, 5) === "/api/";
        }
    }

    angular
        .module("insite")
        .factory("httpErrorsInterceptor", ["$q", "$rootScope", "spinnerService",
            ($q: ng.IQService, $rootScope: ng.IRootScopeService, spinnerService: ISpinnerService) =>
                new HttpErrorsInterceptor($q, $rootScope, spinnerService)]);
}