import SessionModel = Insite.Account.WebApi.V1.ApiModels.SessionModel;
import CurrentContextModel = insite.core.CurrentContextModel;

module insite.account {
    "use strict";

    export interface ICartRemindersUnsubscribeParameters {
        username: string;
        unsubscribeToken: string;
    }

    export interface ISessionService {
        getSession(): ng.IPromise<SessionModel>;
        getContext(): CurrentContextModel;
        setContext(context: CurrentContextModel);
        setContextFromSession(session: SessionModel);
        getIsAuthenticated(): ng.IPromise<boolean>;
        signIn(accessToken: string, username: string, password: string, rememberMe?: boolean): ng.IPromise<SessionModel>;
        signOut(): ng.IPromise<string>;
        setLanguage(languageId: System.Guid): ng.IPromise<SessionModel>;
        setCurrency(currencyId: System.Guid): ng.IPromise<SessionModel>;
        setCustomer(billToId: System.Guid, shipToId: System.Guid, useDefaultCustomer?: boolean, customerWasUpdated?: boolean): ng.IPromise<SessionModel>;
        updateSession(session: SessionModel): ng.IPromise<SessionModel>;
        changePassword(session: SessionModel, accessToken?: string): ng.IPromise<SessionModel>;
        resetPasswordWithToken(username: string, newPassword: string, resetToken: string): ng.IPromise<SessionModel>;
        sendResetPasswordEmail(username: string): ng.IPromise<SessionModel>;
        sendAccountActivationEmail(username: string): ng.IPromise<SessionModel>;
        redirectAfterSelectCustomer(sessionModel: SessionModel, byPassAddressPage: boolean, dashboardUrl: string,
            returnUrl: string, checkoutAddressUrl: string, reviewAndPayUrl: string, addressesUrl: string, cartUrl: string, canCheckOut: boolean);
        unsubscribeFromCartReminders(parameters: ICartRemindersUnsubscribeParameters): ng.IPromise<SessionModel>;
    }

    export class SessionService implements ISessionService {
        isAuthenticatedOnServerUri = "/account/isauthenticated";
        serviceUri = "/api/v1/sessions";

        authRetryCount = 0;
        checkForSessionTimeout = false;
        accountSettings: AccountSettingsModel;
        getSessionPromise: ng.IPromise<SessionModel>;
        lastGetSessionCallTime: Date;
        isAuthenticated: boolean;

        static $inject = ["$http", "$rootScope", "$q", "$localStorage", "$window", "ipCookie", "accessToken", "$location", "httpWrapperService", "coreService", "settingsService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected $localStorage: common.IWindowStorage,
            protected $window: ng.IWindowService,
            protected ipCookie: any,
            protected accessToken: common.IAccessTokenService,
            protected $location: ng.ILocationService,
            protected httpWrapperService: core.HttpWrapperService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService) {
            this.init();
        }

        init(): void {
            this.$rootScope.$on("$stateChangeSuccess", () => { this.onStateChangeSuccess(); });
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); }
            );
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.accountSettings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onStateChangeSuccess(): void {
            // if session times out in spa, we have to manually refresh here on the page change
            if (this.checkForSessionTimeout) {
                this.getSession().then(
                    (session: SessionModel) => { this.getSessionCompleted(session); },
                    (error: any) => { this.getSessionFailed(error); });
            }
        }

        protected getSessionCompleted(session: SessionModel): void {
            if (!session.isAuthenticated) {
                this.refreshPage();
            }
        }

        protected getSessionFailed(error: any): void {
        }

        refreshPage(): void {
            this.$window.location.href = this.$location.url();
        }

        getSession(): ng.IPromise<SessionModel> {
            if (typeof (this.getSessionPromise) !== "undefined" && this.getSessionPromise !== null) {
                if (!this.isAuthenticated) {
                    return this.getSessionPromise;
                }

                const lastGetSessionCallTime = this.lastGetSessionCallTime;
                if (lastGetSessionCallTime instanceof Date && !isNaN(lastGetSessionCallTime.valueOf())) {
                    if ((new Date()).getTime() - lastGetSessionCallTime.getTime() < 5000) {
                        return this.getSessionPromise;
                    }
                }
            }

            this.lastGetSessionCallTime = new Date();
            const deferred = this.$q.defer();

            this.getIsAuthenticatedOnServer().then(
                (isAuthenticatedOnServer: boolean) => { this.getSessionIsAuthenticatedOnServerCompleted(isAuthenticatedOnServer, deferred); },
                (error: any) => { this.getSessionIsAuthenticatedOnServerFailed(error, deferred); }
            );

            this.getSessionPromise = (deferred.promise as ng.IPromise<SessionModel>);
            return this.getSessionPromise;
        }

        protected getSessionIsAuthenticatedOnServerCompleted(isAuthenticatedOnServer: boolean, deferred: ng.IDeferred<{}>): void {
            this.isAuthenticated = isAuthenticatedOnServer;
            if (!isAuthenticatedOnServer && this.accessToken.exists()) {
                this.notAuthenticatedOnServerButHasAccessToken(deferred);
            } else if (isAuthenticatedOnServer && !this.accessToken.exists()) {
                this.authenticatedOnServerButHasNoAccessToken(deferred);
            } else {
                this.authenticatedOnServerAndHasAccessToken(deferred);
            }
        }

        protected getSessionIsAuthenticatedOnServerFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }

        protected notAuthenticatedOnServerButHasAccessToken(deferred: ng.IDeferred<{}>): void {
            this.checkForSessionTimeout = false;
            this.removeAuthentication();
            this.invalidateEtagsAndRefreshPage(deferred);
        }

        protected authenticatedOnServerButHasNoAccessToken(deferred: ng.IDeferred<{}>): void {
            this.getAccessToken().then((response: any) => {
                this.accessToken.set(response.access_token);
                this.invalidateEtagsAndRefreshPage(deferred);
            },
            (error: any) => { deferred.reject(error); });
        }

        protected authenticatedOnServerAndHasAccessToken(deferred: ng.IDeferred<{}>): void {
            this.getSessionFromServer().then(
                (session: SessionModel) => { deferred.resolve(session); },
                (error: any) => { deferred.reject(error); });
        }

        protected invalidateEtagsAndRefreshPage(deferred: ng.IDeferred<{}>): void {
            this.invalidateEtagsOnServer().then(() => {
                this.getSessionFromServer().then((session: SessionModel) => {
                    this.refreshPage();
                    deferred.resolve(session);
                },
                (error: any) => { deferred.reject(error); });
            },
            (error: any) => { deferred.reject(error); });
        }

        getAccessToken(): ng.IPromise<any> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post("/account/accesstoken", null),
                this.getAccessTokenCompleted,
                this.getAccessTokenFailed
            );
        }

        protected getAccessTokenCompleted(response: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected getAccessTokenFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getSessionFromServer(): ng.IPromise<SessionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: `${this.serviceUri}/current`, method: "GET" }),
                this.getSessionFromServerCompleted,
                this.getSessionFromServerFailed
            );
        }

        protected getSessionFromServerCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
            if (!response.data.isAuthenticated && this.accessToken.exists()) {
                this.removeAuthentication();
                this.invalidateEtagsOnServer().then(() => {
                    this.refreshPage();
                });
                return;
            }

            this.checkForSessionTimeout = response.data.isAuthenticated;
            this.setContextFromSession(response.data);
            this.$rootScope.$broadcast("sessionLoaded", response.data);
        }

        protected getSessionFromServerFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getContext(): CurrentContextModel {
            const context: CurrentContextModel = {
                pageUrl: "",
                billToId: this.ipCookie("CurrentBillToId"),
                shipToId: this.ipCookie("CurrentShipToId"),
                currencyId: this.ipCookie("CurrentCurrencyId"),
                languageId: this.ipCookie("CurrentLanguageId"),
                isRememberedUser: !!this.ipCookie("SetRememberedUserId"),
                fulfillmentMethod: this.ipCookie("CurrentFulfillmentMethod"),
                pickUpWarehouseId: this.ipCookie("CurrentPickUpWarehouseId")
            };

            return context;
        }

        setContext(context: CurrentContextModel): void {
            if (!this.accountSettings) {
                this.settingsService.getSettings().then(
                    (settingsCollection: core.SettingsCollection) => {
                        this.getSettingsCompleted(settingsCollection);
                        this.setContext(context);
                    },
                    (error: any) => { this.getSettingsFailed(error); }
                );
                return;
            }

            const isRememberedUser = !!this.ipCookie("SetRememberedUserId");
            if (context.billToId) {
                this.ipCookie("CurrentBillToId", context.billToId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
            } else if (!isRememberedUser) {
                this.ipCookie.remove("CurrentBillToId", { path: "/" });
            }

            if (context.shipToId) {
                this.ipCookie("CurrentShipToId", context.shipToId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
            } else if (!isRememberedUser) {
                this.ipCookie.remove("CurrentShipToId", { path: "/" });
            }

            if (context.currencyId) {
                this.ipCookie("CurrentCurrencyId", context.currencyId, { path: "/" });
            } else {
                this.ipCookie.remove("CurrentCurrencyId", { path: "/" });
            }

            if (context.languageId) {
                this.ipCookie("CurrentLanguageId", context.languageId, { path: "/" });
            } else {
                this.ipCookie.remove("CurrentLanguageId", { path: "/" });
            }

            if (context.fulfillmentMethod) {
                this.ipCookie("CurrentFulfillmentMethod", context.fulfillmentMethod, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
            } else if (!isRememberedUser) {
                this.ipCookie.remove("CurrentFulfillmentMethod", { path: "/" });
            }

            if (context.pickUpWarehouseId) {
                this.ipCookie("CurrentPickUpWarehouseId", context.pickUpWarehouseId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
            } else if (!isRememberedUser) {
                this.ipCookie.remove("CurrentPickUpWarehouseId", { path: "/" });
            }
        }

        setContextFromSession(session: SessionModel): void {
            const context: CurrentContextModel = {
                pageUrl: "",
                languageId: session.language.id,
                currencyId: session.currency.id,
                billToId: session.billTo ? session.billTo.id : null,
                shipToId: session.shipTo ? session.shipTo.id : null,
                isRememberedUser: session.rememberMe,
                fulfillmentMethod: session.fulfillmentMethod,
                pickUpWarehouseId: session.pickUpWarehouse ? session.pickUpWarehouse.id : null
            };

            this.setContext(context);
        }

        getIsAuthenticated(): ng.IPromise<boolean> {
            const getIsAuthenticatedOnServerResponse = this.getIsAuthenticatedOnServer();

            getIsAuthenticatedOnServerResponse.then(
                (response: boolean) => { this.getIsAuthenticatedCompleted(response); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getIsAuthenticatedFailed(error); });

            return getIsAuthenticatedOnServerResponse;
        }

        protected getIsAuthenticatedCompleted(isAuthenticatedOnServer: boolean): void {
            if (!isAuthenticatedOnServer && this.accessToken.exists()) {
                this.removeAuthentication();
                this.invalidateEtagsOnServer();
            }
        }

        protected getIsAuthenticatedFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected getIsAuthenticatedOnServer(): ng.IPromise<boolean> {
            const deferred = this.$q.defer();

            this.$http.get(`${this.isAuthenticatedOnServerUri}?timestamp=${Date.now()}`).then(
                (response: ng.IHttpPromiseCallbackArg<any>) => { deferred.resolve(response.data.isAuthenticatedOnServer); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { deferred.reject(error); });

            return deferred.promise as any;
        }

        protected invalidateEtagsOnServer(): ng.IPromise<SessionModel> {
            return this.$http({ method: "PATCH", url: `${this.serviceUri}/current` }) as any;
        }

        removeAuthentication(): void {
            this.isAuthenticated = false;
            this.accessToken.remove();
            const currentContext = this.getContext();
            currentContext.billToId = null;
            currentContext.shipToId = null;
            this.setContext(currentContext);
        }

        signIn(accessToken: string, username: string, password: string, rememberMe: boolean = false): ng.IPromise<SessionModel> {
            this.accessToken.set(accessToken);
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(this.serviceUri, this.signInParams(username, password, rememberMe), { bypassErrorInterceptor: true }),
                this.signInCompleted,
                this.signInFailed
            );
        }

        protected signInParams(username: string, password: string, rememberMe: boolean): any {
            return { "username": username, "password": password, "rememberMe": rememberMe };
        }

        protected signInCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected signInFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.accessToken.remove();

            if (error.status === 422) {
                this.coreService.displayModal(angular.element("#changePasswordPopup"));
            }
        }

        signOut(): ng.IPromise<string> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.delete(`${this.serviceUri}/current`),
                this.signOutCompleted,
                this.signOutFailed
            );
        }

        protected signOutCompleted(response: ng.IHttpPromiseCallbackArg<string>): void {
            this.removeAuthentication();
        }

        protected signOutFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        setLanguage(languageId: System.Guid): ng.IPromise<SessionModel> {
            const session: SessionModel = {
                language: { id: languageId }
            } as any;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session }),
                (response: ng.IHttpPromiseCallbackArg<SessionModel>) => { this.setLanguageCompleted(response, languageId); },
                this.setLanguageFailed
            );
        }

        protected setLanguageCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>, languageId: System.Guid): void {
            const currentContext = this.getContext();
            currentContext.languageId = languageId;
            this.setContext(currentContext);
        }

        protected setLanguageFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        setCurrency(currencyId: System.Guid): ng.IPromise<SessionModel> {
            const session: SessionModel = {
                currency: { id: currencyId }
            } as any;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session}),
                (response: ng.IHttpPromiseCallbackArg<SessionModel>) => { this.setCurrencyCompleted(response, currencyId); },
                this.setCurrencyFailed
            );
        }

        protected setCurrencyCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>, currencyId: System.Guid): void {
            const currentContext = this.getContext();
            currentContext.currencyId = currencyId;
            this.setContext(currentContext);
        }

        protected setCurrencyFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        setCustomer(billToId: System.Guid, shipToId: System.Guid, useDefaultCustomer = false, customerWasUpdated = false): ng.IPromise<SessionModel> {
            const session: SessionModel = {
                customerWasUpdated: customerWasUpdated,
                billTo: { id: billToId, isDefault: useDefaultCustomer },
                shipTo: { id: shipToId }
            } as any;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<SessionModel>) => { this.setCustomerCompleted(response, billToId, shipToId); },
                this.setCustomerFailed
            );
        }

        protected setCustomerCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>, billToId: System.Guid, shipToId: System.Guid): void {
            const currentContext = this.getContext();
            currentContext.billToId = billToId;
            currentContext.shipToId = shipToId;
            this.setContext(currentContext);
        }

        protected setCustomerFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateSession(session: SessionModel): ng.IPromise<SessionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session }),
                this.updateSessionCompleted,
                this.updateSessionFailed
            );
        }

        protected updateSessionCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
            this.getSessionPromise = null;
            this.$rootScope.$broadcast("sessionUpdated", response.data);
        }

        protected updateSessionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        changePassword(session: SessionModel, accessToken?: string): ng.IPromise<SessionModel> {
            if (accessToken) {
                this.accessToken.set(accessToken);
            }

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                this.changePasswordCompleted,
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.changePasswordFailed(error, accessToken); }
            );
        }

        protected changePasswordCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected changePasswordFailed(error: ng.IHttpPromiseCallbackArg<any>, accessToken?: string): void {
            if (accessToken) {
                this.accessToken.remove();
            }
        }

        resetPasswordWithToken(username: string, newPassword: string, resetToken: string): ng.IPromise<SessionModel> {
            const session: SessionModel = {
                username: username,
                newPassword: newPassword,
                resetToken: resetToken
            } as any;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                this.resetPasswordWithTokenCompleted,
                this.resetPasswordWithTokenFailed
            );
        }

        protected resetPasswordWithTokenCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected resetPasswordWithTokenFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        sendResetPasswordEmail(username: string): ng.IPromise<SessionModel> {
            const session = {
                userName: username,
                resetPassword: true
            } as SessionModel;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                this.sendResetPasswordEmailCompleted,
                this.sendResetPasswordEmailFailed
            );
        }

        protected sendResetPasswordEmailCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected sendResetPasswordEmailFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        sendAccountActivationEmail(username: string): ng.IPromise<SessionModel> {
            const session = {
                userName: username,
                activateAccount: true
            } as SessionModel;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                this.sendAccountActivationEmailCompleted,
                this.sendAccountActivationEmailFailed
            );
        }

        protected sendAccountActivationEmailCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected sendAccountActivationEmailFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        redirectAfterSelectCustomer(sessionModel: SessionModel, byPassAddressPage: boolean, dashboardUrl: string, returnUrl: string, checkoutAddressUrl: string, reviewAndPayUrl: string, addressesUrl: string, cartUrl: string, canCheckOut: boolean): void {
            if (sessionModel.dashboardIsHomepage) {
                returnUrl = dashboardUrl;
            } else if (sessionModel.customLandingPage) {
                returnUrl = sessionModel.customLandingPage;
            } else if (sessionModel.shipTo.isNew) {
                returnUrl = `${addressesUrl}?isNewShipTo=true`;
            }

            if (returnUrl.toLowerCase() === checkoutAddressUrl.toLowerCase()) {
                if (!canCheckOut || sessionModel.isRestrictedProductExistInCart) {
                    returnUrl = cartUrl;
                } else if (byPassAddressPage) {
                    returnUrl = reviewAndPayUrl;
                }
            }

            if(this.coreService.isSafari()) {
                // A varied query string prevents Safari from deleting the CurrentBillToId and CurrentShipToId cookies.
                returnUrl += (returnUrl.indexOf("?") > -1 ? "&_=" : "?_=") + new Date().getTime();
            }

            // full refresh to get nav from server
            this.$window.location.href = returnUrl;
        }

        unsubscribeFromCartReminders(parameters: ICartRemindersUnsubscribeParameters): ng.IPromise<SessionModel> {
            const session: SessionModel = {
                userName: parameters.username,
                cartReminderUnsubscribeToken: parameters.unsubscribeToken
            } as any;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/current`, data: session, bypassErrorInterceptor: true }),
                this.unsubscribeFromCartRemindersCompleted,
                this.unsubscribeFromCartRemindersFailed
            );
        }

        protected unsubscribeFromCartRemindersCompleted(response: ng.IHttpPromiseCallbackArg<SessionModel>): void {
        }

        protected unsubscribeFromCartRemindersFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("sessionService", SessionService);
}