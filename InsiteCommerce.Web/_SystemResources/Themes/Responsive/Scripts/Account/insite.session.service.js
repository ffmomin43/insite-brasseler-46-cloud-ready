var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var SessionService = /** @class */ (function () {
            function SessionService($http, $rootScope, $q, $localStorage, $window, ipCookie, accessToken, $location, httpWrapperService, coreService, settingsService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.$localStorage = $localStorage;
                this.$window = $window;
                this.ipCookie = ipCookie;
                this.accessToken = accessToken;
                this.$location = $location;
                this.httpWrapperService = httpWrapperService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.isAuthenticatedOnServerUri = "/account/isauthenticated";
                this.serviceUri = "/api/v1/sessions";
                this.authRetryCount = 0;
                this.checkForSessionTimeout = false;
                this.init();
            }
            SessionService.prototype.init = function () {
                var _this = this;
                this.$rootScope.$on("$stateChangeSuccess", function () { _this.onStateChangeSuccess(); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            SessionService.prototype.getSettingsCompleted = function (settingsCollection) {
                this.accountSettings = settingsCollection.accountSettings;
            };
            SessionService.prototype.getSettingsFailed = function (error) {
            };
            SessionService.prototype.onStateChangeSuccess = function () {
                var _this = this;
                // if session times out in spa, we have to manually refresh here on the page change
                if (this.checkForSessionTimeout) {
                    this.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                }
            };
            SessionService.prototype.getSessionCompleted = function (session) {
                if (!session.isAuthenticated) {
                    this.refreshPage();
                }
            };
            SessionService.prototype.getSessionFailed = function (error) {
            };
            SessionService.prototype.refreshPage = function () {
                this.$window.location.href = this.$location.url();
            };
            SessionService.prototype.getSession = function () {
                var _this = this;
                if (typeof (this.getSessionPromise) !== "undefined" && this.getSessionPromise !== null) {
                    if (!this.isAuthenticated) {
                        return this.getSessionPromise;
                    }
                    var lastGetSessionCallTime = this.lastGetSessionCallTime;
                    if (lastGetSessionCallTime instanceof Date && !isNaN(lastGetSessionCallTime.valueOf())) {
                        if ((new Date()).getTime() - lastGetSessionCallTime.getTime() < 5000) {
                            return this.getSessionPromise;
                        }
                    }
                }
                this.lastGetSessionCallTime = new Date();
                var deferred = this.$q.defer();
                this.getIsAuthenticatedOnServer().then(function (isAuthenticatedOnServer) { _this.getSessionIsAuthenticatedOnServerCompleted(isAuthenticatedOnServer, deferred); }, function (error) { _this.getSessionIsAuthenticatedOnServerFailed(error, deferred); });
                this.getSessionPromise = deferred.promise;
                return this.getSessionPromise;
            };
            SessionService.prototype.getSessionIsAuthenticatedOnServerCompleted = function (isAuthenticatedOnServer, deferred) {
                this.isAuthenticated = isAuthenticatedOnServer;
                if (!isAuthenticatedOnServer && this.accessToken.exists()) {
                    this.notAuthenticatedOnServerButHasAccessToken(deferred);
                }
                else if (isAuthenticatedOnServer && !this.accessToken.exists()) {
                    this.authenticatedOnServerButHasNoAccessToken(deferred);
                }
                else {
                    this.authenticatedOnServerAndHasAccessToken(deferred);
                }
            };
            SessionService.prototype.getSessionIsAuthenticatedOnServerFailed = function (error, deferred) {
                deferred.reject(error);
            };
            SessionService.prototype.notAuthenticatedOnServerButHasAccessToken = function (deferred) {
                this.checkForSessionTimeout = false;
                this.removeAuthentication();
                this.invalidateEtagsAndRefreshPage(deferred);
            };
            SessionService.prototype.authenticatedOnServerButHasNoAccessToken = function (deferred) {
                var _this = this;
                this.getAccessToken().then(function (response) {
                    _this.accessToken.set(response.access_token);
                    _this.invalidateEtagsAndRefreshPage(deferred);
                }, function (error) { deferred.reject(error); });
            };
            SessionService.prototype.authenticatedOnServerAndHasAccessToken = function (deferred) {
                this.getSessionFromServer().then(function (session) { deferred.resolve(session); }, function (error) { deferred.reject(error); });
            };
            SessionService.prototype.invalidateEtagsAndRefreshPage = function (deferred) {
                var _this = this;
                this.invalidateEtagsOnServer().then(function () {
                    _this.getSessionFromServer().then(function (session) {
                        _this.refreshPage();
                        deferred.resolve(session);
                    }, function (error) { deferred.reject(error); });
                }, function (error) { deferred.reject(error); });
            };
            SessionService.prototype.getAccessToken = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post("/account/accesstoken", null), this.getAccessTokenCompleted, this.getAccessTokenFailed);
            };
            SessionService.prototype.getAccessTokenCompleted = function (response) {
            };
            SessionService.prototype.getAccessTokenFailed = function (error) {
            };
            SessionService.prototype.getSessionFromServer = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/current", method: "GET" }), this.getSessionFromServerCompleted, this.getSessionFromServerFailed);
            };
            SessionService.prototype.getSessionFromServerCompleted = function (response) {
                var _this = this;
                if (!response.data.isAuthenticated && this.accessToken.exists()) {
                    this.removeAuthentication();
                    this.invalidateEtagsOnServer().then(function () {
                        _this.refreshPage();
                    });
                    return;
                }
                this.checkForSessionTimeout = response.data.isAuthenticated;
                this.setContextFromSession(response.data);
                this.$rootScope.$broadcast("sessionLoaded", response.data);
            };
            SessionService.prototype.getSessionFromServerFailed = function (error) {
            };
            SessionService.prototype.getContext = function () {
                var context = {
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
            };
            SessionService.prototype.setContext = function (context) {
                var _this = this;
                if (!this.accountSettings) {
                    this.settingsService.getSettings().then(function (settingsCollection) {
                        _this.getSettingsCompleted(settingsCollection);
                        _this.setContext(context);
                    }, function (error) { _this.getSettingsFailed(error); });
                    return;
                }
                var isRememberedUser = !!this.ipCookie("SetRememberedUserId");
                if (context.billToId) {
                    this.ipCookie("CurrentBillToId", context.billToId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
                }
                else if (!isRememberedUser) {
                    this.ipCookie.remove("CurrentBillToId", { path: "/" });
                }
                if (context.shipToId) {
                    this.ipCookie("CurrentShipToId", context.shipToId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
                }
                else if (!isRememberedUser) {
                    this.ipCookie.remove("CurrentShipToId", { path: "/" });
                }
                if (context.currencyId) {
                    this.ipCookie("CurrentCurrencyId", context.currencyId, { path: "/" });
                }
                else {
                    this.ipCookie.remove("CurrentCurrencyId", { path: "/" });
                }
                if (context.languageId) {
                    this.ipCookie("CurrentLanguageId", context.languageId, { path: "/" });
                }
                else {
                    this.ipCookie.remove("CurrentLanguageId", { path: "/" });
                }
                if (context.fulfillmentMethod) {
                    this.ipCookie("CurrentFulfillmentMethod", context.fulfillmentMethod, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
                }
                else if (!isRememberedUser) {
                    this.ipCookie.remove("CurrentFulfillmentMethod", { path: "/" });
                }
                if (context.pickUpWarehouseId) {
                    this.ipCookie("CurrentPickUpWarehouseId", context.pickUpWarehouseId, { path: "/", expires: isRememberedUser ? this.accountSettings.daysToRetainUser : null });
                }
                else if (!isRememberedUser) {
                    this.ipCookie.remove("CurrentPickUpWarehouseId", { path: "/" });
                }
            };
            SessionService.prototype.setContextFromSession = function (session) {
                var context = {
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
            };
            SessionService.prototype.getIsAuthenticated = function () {
                var _this = this;
                var getIsAuthenticatedOnServerResponse = this.getIsAuthenticatedOnServer();
                getIsAuthenticatedOnServerResponse.then(function (response) { _this.getIsAuthenticatedCompleted(response); }, function (error) { _this.getIsAuthenticatedFailed(error); });
                return getIsAuthenticatedOnServerResponse;
            };
            SessionService.prototype.getIsAuthenticatedCompleted = function (isAuthenticatedOnServer) {
                if (!isAuthenticatedOnServer && this.accessToken.exists()) {
                    this.removeAuthentication();
                    this.invalidateEtagsOnServer();
                }
            };
            SessionService.prototype.getIsAuthenticatedFailed = function (error) {
            };
            SessionService.prototype.getIsAuthenticatedOnServer = function () {
                var deferred = this.$q.defer();
                this.$http.get(this.isAuthenticatedOnServerUri + "?timestamp=" + Date.now()).then(function (response) { deferred.resolve(response.data.isAuthenticatedOnServer); }, function (error) { deferred.reject(error); });
                return deferred.promise;
            };
            SessionService.prototype.invalidateEtagsOnServer = function () {
                return this.$http({ method: "PATCH", url: this.serviceUri + "/current" });
            };
            SessionService.prototype.removeAuthentication = function () {
                this.isAuthenticated = false;
                this.accessToken.remove();
                var currentContext = this.getContext();
                currentContext.billToId = null;
                currentContext.shipToId = null;
                this.setContext(currentContext);
            };
            SessionService.prototype.signIn = function (accessToken, username, password, rememberMe) {
                if (rememberMe === void 0) { rememberMe = false; }
                this.accessToken.set(accessToken);
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.serviceUri, this.signInParams(username, password, rememberMe), { bypassErrorInterceptor: true }), this.signInCompleted, this.signInFailed);
            };
            SessionService.prototype.signInParams = function (username, password, rememberMe) {
                return { "username": username, "password": password, "rememberMe": rememberMe };
            };
            SessionService.prototype.signInCompleted = function (response) {
            };
            SessionService.prototype.signInFailed = function (error) {
                this.accessToken.remove();
                if (error.status === 422) {
                    this.coreService.displayModal(angular.element("#changePasswordPopup"));
                }
            };
            SessionService.prototype.signOut = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(this.serviceUri + "/current"), this.signOutCompleted, this.signOutFailed);
            };
            SessionService.prototype.signOutCompleted = function (response) {
                this.removeAuthentication();
            };
            SessionService.prototype.signOutFailed = function (error) {
            };
            SessionService.prototype.setLanguage = function (languageId) {
                var _this = this;
                var session = {
                    language: { id: languageId }
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session }), function (response) { _this.setLanguageCompleted(response, languageId); }, this.setLanguageFailed);
            };
            SessionService.prototype.setLanguageCompleted = function (response, languageId) {
                var currentContext = this.getContext();
                currentContext.languageId = languageId;
                this.setContext(currentContext);
            };
            SessionService.prototype.setLanguageFailed = function (error) {
            };
            SessionService.prototype.setCurrency = function (currencyId) {
                var _this = this;
                var session = {
                    currency: { id: currencyId }
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session }), function (response) { _this.setCurrencyCompleted(response, currencyId); }, this.setCurrencyFailed);
            };
            SessionService.prototype.setCurrencyCompleted = function (response, currencyId) {
                var currentContext = this.getContext();
                currentContext.currencyId = currencyId;
                this.setContext(currentContext);
            };
            SessionService.prototype.setCurrencyFailed = function (error) {
            };
            SessionService.prototype.setCustomer = function (billToId, shipToId, useDefaultCustomer, customerWasUpdated) {
                var _this = this;
                if (useDefaultCustomer === void 0) { useDefaultCustomer = false; }
                if (customerWasUpdated === void 0) { customerWasUpdated = false; }
                var session = {
                    customerWasUpdated: customerWasUpdated,
                    billTo: { id: billToId, isDefault: useDefaultCustomer },
                    shipTo: { id: shipToId }
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), function (response) { _this.setCustomerCompleted(response, billToId, shipToId); }, this.setCustomerFailed);
            };
            SessionService.prototype.setCustomerCompleted = function (response, billToId, shipToId) {
                var currentContext = this.getContext();
                currentContext.billToId = billToId;
                currentContext.shipToId = shipToId;
                this.setContext(currentContext);
            };
            SessionService.prototype.setCustomerFailed = function (error) {
            };
            SessionService.prototype.updateSession = function (session) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session }), this.updateSessionCompleted, this.updateSessionFailed);
            };
            SessionService.prototype.updateSessionCompleted = function (response) {
                this.getSessionPromise = null;
                this.$rootScope.$broadcast("sessionUpdated", response.data);
            };
            SessionService.prototype.updateSessionFailed = function (error) {
            };
            SessionService.prototype.changePassword = function (session, accessToken) {
                var _this = this;
                if (accessToken) {
                    this.accessToken.set(accessToken);
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), this.changePasswordCompleted, function (error) { _this.changePasswordFailed(error, accessToken); });
            };
            SessionService.prototype.changePasswordCompleted = function (response) {
            };
            SessionService.prototype.changePasswordFailed = function (error, accessToken) {
                if (accessToken) {
                    this.accessToken.remove();
                }
            };
            SessionService.prototype.resetPasswordWithToken = function (username, newPassword, resetToken) {
                var session = {
                    username: username,
                    newPassword: newPassword,
                    resetToken: resetToken
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), this.resetPasswordWithTokenCompleted, this.resetPasswordWithTokenFailed);
            };
            SessionService.prototype.resetPasswordWithTokenCompleted = function (response) {
            };
            SessionService.prototype.resetPasswordWithTokenFailed = function (error) {
            };
            SessionService.prototype.sendResetPasswordEmail = function (username) {
                var session = {
                    userName: username,
                    resetPassword: true
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), this.sendResetPasswordEmailCompleted, this.sendResetPasswordEmailFailed);
            };
            SessionService.prototype.sendResetPasswordEmailCompleted = function (response) {
            };
            SessionService.prototype.sendResetPasswordEmailFailed = function (error) {
            };
            SessionService.prototype.sendAccountActivationEmail = function (username) {
                var session = {
                    userName: username,
                    activateAccount: true
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), this.sendAccountActivationEmailCompleted, this.sendAccountActivationEmailFailed);
            };
            SessionService.prototype.sendAccountActivationEmailCompleted = function (response) {
            };
            SessionService.prototype.sendAccountActivationEmailFailed = function (error) {
            };
            SessionService.prototype.redirectAfterSelectCustomer = function (sessionModel, byPassAddressPage, dashboardUrl, returnUrl, checkoutAddressUrl, reviewAndPayUrl, addressesUrl, cartUrl, canCheckOut) {
                if (sessionModel.dashboardIsHomepage) {
                    returnUrl = dashboardUrl;
                }
                else if (sessionModel.customLandingPage) {
                    returnUrl = sessionModel.customLandingPage;
                }
                else if (sessionModel.shipTo.isNew) {
                    returnUrl = addressesUrl + "?isNewShipTo=true";
                }
                if (returnUrl.toLowerCase() === checkoutAddressUrl.toLowerCase()) {
                    if (!canCheckOut || sessionModel.isRestrictedProductExistInCart) {
                        returnUrl = cartUrl;
                    }
                    else if (byPassAddressPage) {
                        returnUrl = reviewAndPayUrl;
                    }
                }
                if (this.coreService.isSafari()) {
                    // A varied query string prevents Safari from deleting the CurrentBillToId and CurrentShipToId cookies.
                    returnUrl += (returnUrl.indexOf("?") > -1 ? "&_=" : "?_=") + new Date().getTime();
                }
                // full refresh to get nav from server
                this.$window.location.href = returnUrl;
            };
            SessionService.prototype.unsubscribeFromCartReminders = function (parameters) {
                var session = {
                    userName: parameters.username,
                    cartReminderUnsubscribeToken: parameters.unsubscribeToken
                };
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/current", data: session, bypassErrorInterceptor: true }), this.unsubscribeFromCartRemindersCompleted, this.unsubscribeFromCartRemindersFailed);
            };
            SessionService.prototype.unsubscribeFromCartRemindersCompleted = function (response) {
            };
            SessionService.prototype.unsubscribeFromCartRemindersFailed = function (error) {
            };
            SessionService.$inject = ["$http", "$rootScope", "$q", "$localStorage", "$window", "ipCookie", "accessToken", "$location", "httpWrapperService", "coreService", "settingsService"];
            return SessionService;
        }());
        account.SessionService = SessionService;
        angular
            .module("insite")
            .service("sessionService", SessionService);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.session.service.js.map