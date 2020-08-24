var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var SettingsCollection = /** @class */ (function () {
            function SettingsCollection() {
            }
            return SettingsCollection;
        }());
        core.SettingsCollection = SettingsCollection;
        var TokenExDto = /** @class */ (function () {
            function TokenExDto() {
            }
            return TokenExDto;
        }());
        core.TokenExDto = TokenExDto;
        var SettingsService = /** @class */ (function () {
            function SettingsService($http, accessToken, $q, httpWrapperService) {
                this.$http = $http;
                this.accessToken = accessToken;
                this.$q = $q;
                this.httpWrapperService = httpWrapperService;
                this.settingsUri = "/api/v1/settings";
                this.tokenExConfigUri = "/api/v1/tokenexconfig";
                this.settingsCollections = {};
                this.deferredRequests = {};
            }
            SettingsService.prototype.getSettings = function () {
                var _this = this;
                var deferred = this.$q.defer();
                var isAuthenticated = this.accessToken.exists().toString();
                // using this to reference a property on an object makes it easy to remove duplication, but the code is harder to understand.
                if (typeof (this.settingsCollections[isAuthenticated]) !== "undefined") {
                    deferred.resolve(this.settingsCollections[isAuthenticated]);
                }
                else {
                    if (typeof (this.deferredRequests[isAuthenticated]) !== "undefined") {
                        this.deferredRequests[isAuthenticated].push(deferred);
                    }
                    else {
                        this.deferredRequests[isAuthenticated] = [];
                        this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.settingsUri + "?auth=" + isAuthenticated + "&timestamp=" + Date.now()), function (response) { _this.getSettingsCompleted(response, isAuthenticated, deferred); }, this.getSettingsFailed);
                    }
                }
                return deferred.promise;
            };
            SettingsService.prototype.getSettingsCompleted = function (response, isAuthenticated, deferred) {
                this.settingsCollections[isAuthenticated] = response.data.settingsCollection;
                deferred.resolve(this.settingsCollections[isAuthenticated]);
                for (var i = 0; i < this.deferredRequests[isAuthenticated].length; i++) {
                    this.deferredRequests[isAuthenticated][i].resolve(this.settingsCollections[isAuthenticated]);
                }
            };
            SettingsService.prototype.getSettingsFailed = function (error) {
                if (error.data.message && error.data.message.trim() === "Insite.Websites.Services.Handlers.GetSettingsCollectionHandler.ServerClientAuthenticationMismatch" && this.accessToken.exists()) {
                    this.accessToken.remove();
                }
            };
            SettingsService.prototype.getTokenExConfig = function (token) {
                var url = token ? this.tokenExConfigUri + "?token=" + token : "" + this.tokenExConfigUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(url), this.getTokenExConfigCompleted, this.getTokenExConfigFailed);
            };
            SettingsService.prototype.getTokenExConfigCompleted = function (response) {
            };
            SettingsService.prototype.getTokenExConfigFailed = function (error) {
            };
            SettingsService.$inject = ["$http", "accessToken", "$q", "httpWrapperService"];
            return SettingsService;
        }());
        core.SettingsService = SettingsService;
        angular
            .module("insite")
            .service("settingsService", SettingsService);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.settings.service.js.map