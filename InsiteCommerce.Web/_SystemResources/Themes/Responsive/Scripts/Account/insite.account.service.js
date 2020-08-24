var insite;
(function (insite) {
    var account;
    (function (account_1) {
        "use strict";
        var AccountService = /** @class */ (function () {
            function AccountService($http, $window, httpWrapperService) {
                this.$http = $http;
                this.$window = $window;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/accounts";
                this.settingsUri = "/api/v1/settings/account";
                this.expand = "";
            }
            AccountService.prototype.getAccountSettings = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.settingsUri, method: "GET" }), this.getAccountSettingsCompleted, this.getAccountSettingsFailed);
            };
            AccountService.prototype.getAccountSettingsCompleted = function (response) {
            };
            AccountService.prototype.getAccountSettingsFailed = function (error) {
            };
            AccountService.prototype.getAccounts = function (searchText, pagination, sort) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri, method: "GET", params: this.getAccountsParams(searchText, pagination, sort) }), this.getAccountsCompleted, this.getAccountsFailed);
            };
            AccountService.prototype.getAccountsParams = function (searchText, pagination, sort) {
                var params = {
                    searchText: searchText,
                    sort: sort
                };
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            AccountService.prototype.getAccountsCompleted = function (response) {
            };
            AccountService.prototype.getAccountsFailed = function (error) {
            };
            AccountService.prototype.getAccount = function (accountId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/" + (!accountId ? "current" : accountId), method: "GET", params: this.getAccountParams() }), this.getAccountCompleted, this.getAccountFailed);
            };
            AccountService.prototype.getAccountParams = function () {
                return this.expand ? { expand: this.expand } : {};
            };
            AccountService.prototype.getAccountCompleted = function (response) {
            };
            AccountService.prototype.getAccountFailed = function (error) {
            };
            AccountService.prototype.getExternalProviders = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: "/identity/externalproviders" + this.$window.location.search, method: "GET" }), this.getExternalProvidersCompleted, this.getExternalProvidersFailed);
            };
            AccountService.prototype.getExternalProvidersCompleted = function (response) {
            };
            AccountService.prototype.getExternalProvidersFailed = function (error) {
            };
            AccountService.prototype.createAccount = function (account) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.serviceUri, account), this.createAccountCompleted, this.createAccountFailed);
            };
            AccountService.prototype.createAccountCompleted = function (response) {
            };
            AccountService.prototype.createAccountFailed = function (error) {
            };
            AccountService.prototype.updateAccount = function (account, accountId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + "/" + (!accountId ? "current" : accountId), data: account }), this.updateAccountCompleted, this.updateAccountFailed);
            };
            AccountService.prototype.updateAccountCompleted = function (response) {
            };
            AccountService.prototype.updateAccountFailed = function (error) {
            };
            AccountService.prototype.getPaymentProfiles = function (expand, pagination, sort) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/current/paymentprofiles", method: "GET", params: this.getPaymentProfilesParams(expand, pagination, sort) }), this.getPaymentProfilesCompleted, this.getPaymentProfilesFailed);
            };
            AccountService.prototype.getPaymentProfilesParams = function (expand, pagination, sort) {
                var params = {
                    sort: sort
                };
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            AccountService.prototype.getPaymentProfilesCompleted = function (response) {
            };
            AccountService.prototype.getPaymentProfilesFailed = function (error) {
            };
            AccountService.prototype.addPaymentProfile = function (paymentProfile) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/current/paymentprofiles", method: "POST", data: paymentProfile }), this.addPaymentProfileCompleted, this.addPaymentProfileFailed);
            };
            AccountService.prototype.addPaymentProfileCompleted = function (response) {
            };
            AccountService.prototype.addPaymentProfileFailed = function (error) {
            };
            AccountService.prototype.updatePaymentProfile = function (paymentProfileId, paymentProfile) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/current/paymentprofiles/" + paymentProfileId, method: "PATCH", data: paymentProfile }), this.updatePaymentProfileCompleted, this.updatePaymentProfileFailed);
            };
            AccountService.prototype.updatePaymentProfileCompleted = function (response) {
            };
            AccountService.prototype.updatePaymentProfileFailed = function (error) {
            };
            AccountService.prototype.deletePaymentProfiles = function (paymentProfileId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri + "/current/paymentprofiles/" + paymentProfileId, method: "DELETE" }), this.deletePaymentProfileCompleted, this.deletePaymentProfileFailed);
            };
            AccountService.prototype.deletePaymentProfileCompleted = function (response) {
            };
            AccountService.prototype.deletePaymentProfileFailed = function (error) {
            };
            AccountService.$inject = ["$http", "$window", "httpWrapperService"];
            return AccountService;
        }());
        account_1.AccountService = AccountService;
        angular
            .module("insite")
            .service("accountService", AccountService);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.account.service.js.map