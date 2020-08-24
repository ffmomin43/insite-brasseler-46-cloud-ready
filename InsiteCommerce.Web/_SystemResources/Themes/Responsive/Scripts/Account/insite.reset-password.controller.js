var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var ResetPasswordController = /** @class */ (function () {
            function ResetPasswordController($scope, sessionService, coreService, settingsService, queryString) {
                this.$scope = $scope;
                this.sessionService = sessionService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.changePasswordError = "";
                this.password = "";
                this.confirmPassword = "";
                this.isResettingPassword = true; // true = show reset password ui, false = show activate account ui
                this.resetPasswordForm = null;
            }
            ResetPasswordController.prototype.$onInit = function () {
                var _this = this;
                this.isResettingPassword = this.queryString.get("reset").toLowerCase() === "true";
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            ResetPasswordController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
                this.hasAnyRule = this.settings.passwordMinimumRequiredLength > 0 ||
                    this.settings.passwordRequiresSpecialCharacter ||
                    this.settings.passwordRequiresUppercase ||
                    this.settings.passwordRequiresLowercase ||
                    this.settings.passwordRequiresDigit;
            };
            ResetPasswordController.prototype.getSettingsFailed = function (error) {
            };
            ResetPasswordController.prototype.changePassword = function () {
                var _this = this;
                this.changePasswordError = "";
                this.resetPasswordForm = this.$scope.resetPasswordForm;
                if (!this.resetPasswordForm.$valid) {
                    return;
                }
                var username = this.queryString.get("username");
                var resetToken = this.queryString.get("resetToken");
                this.sessionService.resetPasswordWithToken(username, this.confirmPassword, resetToken).then(function (session) { _this.resetPasswordWithTokenCompleted(session); }, function (error) { _this.resetPasswordWithTokenFailed(error); });
            };
            ResetPasswordController.prototype.resetPasswordWithTokenCompleted = function (session) {
                var _this = this;
                var id = this.isResettingPassword ? "#popup-resetPasswordSuccess" : "#popup-accountActivationSuccess";
                this.coreService.displayModal(angular.element(id), function () {
                    _this.coreService.redirectToSignIn(false);
                    _this.$scope.$apply(); // redirect doesn't happen without this
                });
            };
            ResetPasswordController.prototype.resetPasswordWithTokenFailed = function (error) {
                this.changePasswordError = error.message;
            };
            ResetPasswordController.$inject = ["$scope", "sessionService", "coreService", "settingsService", "queryString"];
            return ResetPasswordController;
        }());
        account.ResetPasswordController = ResetPasswordController;
        angular
            .module("insite")
            .controller("ResetPasswordController", ResetPasswordController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.reset-password.controller.js.map