var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var BrasselerChangeAccountPasswordController = /** @class */ (function (_super) {
            __extends(BrasselerChangeAccountPasswordController, _super);
            function BrasselerChangeAccountPasswordController($scope, sessionService, $localStorage, $attrs, settingsService, coreService) {
                var _this = _super.call(this, $scope, sessionService, $localStorage, $attrs, settingsService, coreService) || this;
                _this.$scope = $scope;
                _this.sessionService = sessionService;
                _this.$localStorage = $localStorage;
                _this.$attrs = $attrs;
                _this.settingsService = settingsService;
                _this.coreService = coreService;
                _this.changePasswordError = "";
                _this.password = "";
                _this.newPassword = "";
                return _this;
            }
            BrasselerChangeAccountPasswordController.prototype.togglePasswordField = function (fieldId, iconId) {
                if ($("#" + fieldId).attr("type") == "password") {
                    $("#" + fieldId).attr("type", "text");
                    $("#" + iconId).removeClass("fa-eye-slash").addClass("fa-eye");
                }
                else {
                    $("#" + fieldId).attr("type", "password");
                    $("#" + iconId).removeClass("fa-eye").addClass("fa-eye-slash");
                }
            };
            BrasselerChangeAccountPasswordController.$inject = ["$scope", "sessionService", "$localStorage", "$attrs", "settingsService", "coreService"];
            return BrasselerChangeAccountPasswordController;
        }(account.ChangeAccountPasswordController));
        account.BrasselerChangeAccountPasswordController = BrasselerChangeAccountPasswordController;
        angular
            .module("insite")
            .controller("ChangeAccountPasswordController", BrasselerChangeAccountPasswordController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.change-account-password.js.map