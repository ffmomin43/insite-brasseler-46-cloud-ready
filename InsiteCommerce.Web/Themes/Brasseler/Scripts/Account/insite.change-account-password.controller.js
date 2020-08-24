var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var ChangeAccountPasswordController = /** @class */ (function () {
            function ChangeAccountPasswordController($scope, sessionService, $localStorage, $attrs, settingsService, coreService) {
                this.$scope = $scope;
                this.sessionService = sessionService;
                this.$localStorage = $localStorage;
                this.$attrs = $attrs;
                this.settingsService = settingsService;
                this.coreService = coreService;
                this.changePasswordError = "";
                this.password = "";
                this.newPassword = "";
            }
            ChangeAccountPasswordController.prototype.$onInit = function () {
                var _this = this;
                this.successUrl = this.$attrs.successUrl;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            ChangeAccountPasswordController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
            };
            ChangeAccountPasswordController.prototype.getSettingsFailed = function (error) {
            };
            ChangeAccountPasswordController.prototype.changePassword = function () {
                var _this = this;
                this.changePasswordError = "";
                if (!this.$scope.changePasswordForm.$valid) {
                    return;
                }
                var session = {
                    password: this.password,
                    newPassword: this.newPassword
                };
                this.sessionService.changePassword(session).then(function (updatedSession) { _this.changePasswordCompleted(updatedSession); }, function (error) { _this.changePasswordFailed(error); });
            };
            ChangeAccountPasswordController.prototype.changePasswordCompleted = function (session) {
                this.$localStorage.set("changePasswordDate", (new Date()).toLocaleString());
                this.coreService.redirectToPath(this.successUrl);
            };
            ChangeAccountPasswordController.prototype.changePasswordFailed = function (error) {
                this.changePasswordError = error.message;
            };
            ChangeAccountPasswordController.$inject = ["$scope", "sessionService", "$localStorage", "$attrs", "settingsService", "coreService"];
            return ChangeAccountPasswordController;
        }());
        account.ChangeAccountPasswordController = ChangeAccountPasswordController;
        angular
            .module("insite")
            .controller("ChangeAccountPasswordController", ChangeAccountPasswordController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.change-account-password.controller.js.map