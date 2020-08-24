var insite;
(function (insite) {
    var account;
    (function (account_1) {
        "use strict";
        var AccountSettingsController = /** @class */ (function () {
            function AccountSettingsController(accountService, $localStorage, settingsService, coreService, sessionService) {
                this.accountService = accountService;
                this.$localStorage = $localStorage;
                this.settingsService = settingsService;
                this.coreService = coreService;
                this.sessionService = sessionService;
                this.isAccountPasswordChanged = false;
                this.changeSubscriptionError = "";
                this.changeEmailAddressError = "";
            }
            AccountSettingsController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.accountService.getAccount().then(function (account) { _this.getAccountCompleted(account); }, function (error) { _this.getAccountFailed(error); });
                this.checkIfAccountPasswordChanged();
            };
            AccountSettingsController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
            };
            AccountSettingsController.prototype.getSettingsFailed = function (error) {
            };
            AccountSettingsController.prototype.getAccountCompleted = function (account) {
                this.account = account;
                this.savedAccountEmail = account.email;
                this.newAccountEmail = account.email;
            };
            AccountSettingsController.prototype.getAccountFailed = function (error) {
            };
            AccountSettingsController.prototype.checkIfAccountPasswordChanged = function () {
                var _this = this;
                var dateValue = this.$localStorage.get("changePasswordDate");
                if (dateValue) {
                    var diff = Math.abs((new Date(dateValue)) - (new Date()));
                    var minutes = Math.floor((diff / 1000) / 60);
                    if (minutes <= 10) {
                        this.isAccountPasswordChanged = true;
                        setTimeout(function () {
                            _this.isAccountPasswordChanged = false;
                        }, 10000);
                    }
                    this.$localStorage.remove("changePasswordDate");
                }
            };
            AccountSettingsController.prototype.changeSubscription = function () {
                var _this = this;
                this.accountService.updateAccount(this.account).then(function (account) { _this.updateSubscriptionCompleted(account); }, function (error) { _this.updateSubscriptionFailed(error); });
            };
            AccountSettingsController.prototype.updateSubscriptionCompleted = function (account) {
                angular.element("#manageSubscriptionSuccess").foundation("reveal", "open");
            };
            AccountSettingsController.prototype.updateSubscriptionFailed = function (error) {
                this.changeSubscriptionError = error.message;
            };
            AccountSettingsController.prototype.showChangeEmailAddressPopup = function () {
                this.coreService.displayModal(angular.element("#changeEmailAddressPopup"));
            };
            AccountSettingsController.prototype.hideChangeEmailAddressPopup = function () {
                this.coreService.closeModal("#changeEmailAddressPopup");
            };
            AccountSettingsController.prototype.changeEmailAddress = function () {
                var _this = this;
                if (!this.changeEmailAddressForm.$valid) {
                    return;
                }
                this.changeEmailAddressError = "";
                this.account.email = this.newAccountEmail;
                this.accountService.updateAccount(this.account).then(function (account) { _this.updateEmailAddressCompleted(account); }, function (error) { _this.updateEmailAddressFailed(error); });
            };
            AccountSettingsController.prototype.updateEmailAddressCompleted = function (account) {
                this.hideChangeEmailAddressPopup();
                this.savedAccountEmail = account.email;
                this.newAccountEmail = account.email;
                if (this.settings.useEmailAsUserName) {
                    this.updateSession();
                }
            };
            AccountSettingsController.prototype.updateEmailAddressFailed = function (error) {
                this.changeEmailAddressError = error.message;
                this.account.email = this.savedAccountEmail;
            };
            AccountSettingsController.prototype.updateSession = function () {
                var _this = this;
                this.sessionService.updateSession({}).then(function (session) { _this.updateSessionCompleted(session); }, function (error) { _this.updateSessionFailed(error); });
            };
            AccountSettingsController.prototype.updateSessionCompleted = function (session) {
            };
            AccountSettingsController.prototype.updateSessionFailed = function (error) {
            };
            AccountSettingsController.$inject = ["accountService", "$localStorage", "settingsService", "coreService", "sessionService"];
            return AccountSettingsController;
        }());
        account_1.AccountSettingsController = AccountSettingsController;
        angular
            .module("insite")
            .controller("AccountSettingsController", AccountSettingsController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.account-settings.controller.js.map