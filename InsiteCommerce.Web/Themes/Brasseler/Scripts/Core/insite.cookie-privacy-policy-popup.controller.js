var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var CookiePrivacyPolicyPopupController = /** @class */ (function () {
            function CookiePrivacyPolicyPopupController($scope, settingsService, ipCookie) {
                this.$scope = $scope;
                this.settingsService = settingsService;
                this.ipCookie = ipCookie;
            }
            CookiePrivacyPolicyPopupController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("$locationChangeStart", function () {
                    _this.showPopupIfRequired();
                });
            };
            CookiePrivacyPolicyPopupController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.enableCookiePrivacyPolicyPopup = settingsCollection.websiteSettings.enableCookiePrivacyPolicyPopup;
                this.showPopupIfRequired();
            };
            CookiePrivacyPolicyPopupController.prototype.getSettingsFailed = function (error) {
            };
            CookiePrivacyPolicyPopupController.prototype.showPopupIfRequired = function () {
                if (this.enableCookiePrivacyPolicyPopup && !this.ipCookie("acceptCookies")) {
                    this.showPopup = true;
                }
            };
            CookiePrivacyPolicyPopupController.prototype.accept = function () {
                this.ipCookie("acceptCookies", true, { path: "/", expires: 365 });
                this.showPopup = false;
            };
            CookiePrivacyPolicyPopupController.prototype.hidePopup = function () {
                this.showPopup = false;
            };
            CookiePrivacyPolicyPopupController.$inject = ["$scope", "settingsService", "ipCookie"];
            return CookiePrivacyPolicyPopupController;
        }());
        order.CookiePrivacyPolicyPopupController = CookiePrivacyPolicyPopupController;
        angular
            .module("insite")
            .controller("CookiePrivacyPolicyPopupController", CookiePrivacyPolicyPopupController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.cookie-privacy-policy-popup.controller.js.map