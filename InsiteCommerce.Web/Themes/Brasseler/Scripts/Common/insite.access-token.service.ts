module insite.common {
    "use strict";

    export interface IAccessTokenDto {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }

    export interface IAccessTokenService {
        generate(username: string, password: string): ng.IPromise<IAccessTokenDto>;
        refresh(refreshToken: string): ng.IPromise<IAccessTokenDto>;
        set(accessToken: string);
        get(): string;
        remove();
        exists(): boolean;
        clear();
    }

    export class AccessTokenService implements IAccessTokenService {
        tokenUri = "/identity/connect/token";

        static $inject = ["$http", "$rootScope", "$q", "$localStorage", "$window", "ipCookie", "base64"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected $localStorage: common.IWindowStorage,
            protected $window: ng.IWindowService,
            protected ipCookie: any,
            protected base64: any) {
        }

        generate(username: string, password: string): ng.IPromise<IAccessTokenDto> {
            const data = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&scope=${insiteScope} offline_access`;
            const config = {
                headers: {
                    "Authorization": `Basic ${this.base64.encode(insiteBasicAuthHeader)}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                bypassErrorInterceptor: true
            };

            return this.returnResult(data, config);
        }

        refresh(refreshToken: string): ng.IPromise<IAccessTokenDto> {
            const insiteBasicAuth = insiteBasicAuthHeader.split(":");
            const data = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}&client_id=${insiteBasicAuth[0]}&client_secret=${insiteBasicAuth[1]}`;
            const config = {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                bypassErrorInterceptor: true,
                skipAddAccessToken: true
            };

            return this.returnResult(data, config);
        }

        private returnResult(data: string, config: ng.IRequestShortcutConfig): ng.IPromise<IAccessTokenDto> {
            const deferred = this.$q.defer();
            this.$http.post(this.tokenUri, data, config)
                .success((result: any) => deferred.resolve({
                    accessToken: result.access_token,
                    refreshToken: result.refresh_token,
                    expiresIn: result.expires_in
                }))
                .error((error, status) => {
                    deferred.reject({
                        errorCode: error.error,
                        message: error.error_description,
                        status: status
                    });
                });
            return deferred.promise as any;
        }

        set(accessToken: string): void {
            this.$localStorage.set("accessToken", accessToken);
        }

        get(): string {
            return this.$localStorage.get("accessToken");
        }

        remove(): void {
            if (this.$localStorage.get("accessToken")) {
                this.$localStorage.remove("accessToken");
            }
        }

        exists(): boolean {
            return this.$localStorage.get("accessToken", null) !== null;
        }

        clear(): void {
            sessionStorage.clear();
            this.remove();
        }
    }

    angular
        .module("insite-common")
        .service("accessToken", AccessTokenService);
}