var insite;
(function (insite) {
    var useradministration;
    (function (useradministration) {
        "use strict";
        var UserDetailController = /** @class */ (function () {
            function UserDetailController($scope, accountService, coreService, sessionService, queryString, spinnerService, $rootScope, $location) {
                this.$scope = $scope;
                this.accountService = accountService;
                this.coreService = coreService;
                this.sessionService = sessionService;
                this.queryString = queryString;
                this.spinnerService = spinnerService;
                this.$rootScope = $rootScope;
                this.$location = $location;
                this.user = null;
                this.currentUser = null;
                this.retrievalError = false;
                this.isSubmitted = false;
                this.isNewUser = true;
                this.generalError = "";
                this.changesSaved = false;
                this.activationEmailSent = false;
                this.userCreated = false;
            }
            UserDetailController.prototype.$onInit = function () {
                this.userId = this.queryString.get("userId");
                if (this.userId) {
                    this.isNewUser = false;
                }
                this.getAccount();
                this.getCurrentAccount();
                this.getAccountSettings();
            };
            UserDetailController.prototype.getAccount = function () {
                var _this = this;
                this.accountService.expand = "approvers,roles";
                this.accountService.getAccount(this.userId).then(function (account) { _this.getAccountCompleted(account); }, function (error) { _this.getAccountFailed(error); });
            };
            UserDetailController.prototype.getAccountCompleted = function (account) {
                this.user = account;
                if (this.isNewUser) {
                    this.user.email = "";
                    this.user.userName = "";
                    this.user.firstName = "";
                    this.user.lastName = "";
                    this.user.role = "";
                    this.user.approver = "";
                    this.user.activationStatus = "";
                    this.user.isApproved = true;
                    this.user.requiresActivation = true;
                    this.user.lastLoginOn = null;
                    this.autoSendActivationEmail = true;
                }
                this.initialUserProfileEmail = this.user.email;
                this.retrievalError = false;
            };
            UserDetailController.prototype.getAccountFailed = function (error) {
                this.retrievalError = true;
            };
            UserDetailController.prototype.getCurrentAccount = function () {
                var _this = this;
                this.accountService.getAccount().then(function (account) { _this.getCurrentAccountCompleted(account); }, function (error) { _this.getCurrentAccountFailed(error); });
            };
            UserDetailController.prototype.getCurrentAccountCompleted = function (account) {
                this.currentUser = account;
            };
            UserDetailController.prototype.getCurrentAccountFailed = function (error) {
            };
            UserDetailController.prototype.getAccountSettings = function () {
                var _this = this;
                this.accountService.getAccountSettings().then(function (accountSettings) { _this.getAccountSettingsCompleted(accountSettings); }, function (error) { _this.getAccountSettingsFailed(error); });
            };
            UserDetailController.prototype.getAccountSettingsCompleted = function (accountSettings) {
                this.settings = accountSettings;
            };
            UserDetailController.prototype.getAccountSettingsFailed = function (error) {
            };
            UserDetailController.prototype.createUser = function () {
                var _this = this;
                this.generalError = "";
                this.isSubmitted = true;
                if (!this.$scope.usersetupform.$valid) {
                    return;
                }
                if (this.settings.useEmailAsUserName) {
                    this.user.userName = this.user.email;
                }
                this.resetNotification();
                this.spinnerService.show();
                this.accountService.createAccount(this.user).then(function (account) { _this.createAccountCompleted(account); }, function (error) { _this.createAccountFailed(error); });
            };
            UserDetailController.prototype.createAccountCompleted = function (account) {
                this.userCreated = true;
                this.userId = account.id;
                this.isNewUser = false;
                this.$location.search("userId", account.id);
                if (this.autoSendActivationEmail) {
                    this.sendActivationEmail();
                }
            };
            UserDetailController.prototype.createAccountFailed = function (error) {
                if (error.message) {
                    this.generalError = error.message;
                }
            };
            UserDetailController.prototype.updateUser = function () {
                var _this = this;
                this.generalError = "";
                this.isSubmitted = true;
                if (!this.$scope.usersetupform.$valid) {
                    return;
                }
                if (this.settings.useEmailAsUserName) {
                    this.user.userName = this.user.email;
                }
                this.resetNotification();
                this.spinnerService.show();
                this.accountService.updateAccount(this.user, this.userId).then(function (account) { _this.updateAccountCompleted(account); }, function (error) { _this.updateAccountFailed(error); });
            };
            UserDetailController.prototype.updateAccountCompleted = function (account) {
                if (this.settings.useEmailAsUserName && this.isCurrentUser() && this.user.email !== this.initialUserProfileEmail) {
                    this.updateSession();
                }
                this.changesSaved = true;
                this.user.activationStatus = account.activationStatus;
                this.initialUserProfileEmail = account.email;
            };
            UserDetailController.prototype.updateAccountFailed = function (error) {
                if (error.message) {
                    this.generalError = error.message;
                }
            };
            UserDetailController.prototype.updateSession = function () {
                var _this = this;
                this.sessionService.updateSession({}).then(function (session) { _this.updateSessionCompleted(session); }, function (error) { _this.updateSessionFailed(error); });
            };
            UserDetailController.prototype.updateSessionCompleted = function (session) {
            };
            UserDetailController.prototype.updateSessionFailed = function (error) {
            };
            UserDetailController.prototype.onSendActivationEmailClick = function () {
                this.resetNotification();
                this.spinnerService.show();
                this.sendActivationEmail();
            };
            UserDetailController.prototype.sendActivationEmail = function () {
                var _this = this;
                this.sessionService.sendAccountActivationEmail(this.user.userName).then(function (session) { _this.sendAccountActivationEmailCompleted(session); }, function (error) { _this.sendAccountActivationEmailFailed(error); });
            };
            UserDetailController.prototype.sendAccountActivationEmailCompleted = function (session) {
                this.activationEmailSent = true;
            };
            UserDetailController.prototype.sendAccountActivationEmailFailed = function (error) {
            };
            UserDetailController.prototype.displayModal = function (modalId) {
                this.coreService.displayModal("#" + modalId);
            };
            UserDetailController.prototype.resetNotification = function () {
                this.changesSaved = false;
                this.activationEmailSent = false;
                this.userCreated = false;
            };
            UserDetailController.prototype.isCurrentUser = function () {
                return this.currentUser && this.currentUser.id === this.userId;
            };
            UserDetailController.$inject = ["$scope", "accountService", "coreService", "sessionService", "queryString", "spinnerService", "$rootScope", "$location"];
            return UserDetailController;
        }());
        useradministration.UserDetailController = UserDetailController;
        angular
            .module("insite")
            .controller("UserDetailController", UserDetailController);
    })(useradministration = insite.useradministration || (insite.useradministration = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.user-detail.controller.js.map