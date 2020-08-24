///<reference path="angular.d.ts" />

declare module ng {
    interface IRequestShortcutConfig {
        bypassErrorInterceptor?: boolean;
        skipAddAccessToken?: boolean;
    }

    interface IRequestConfig {
        bypassErrorInterceptor?: boolean;
        skipAddAccessToken?: boolean;
    }
}