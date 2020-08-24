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
    (function (account_1) {
        "use strict";
        var BrasselerAccountSettingsController = /** @class */ (function (_super) {
            __extends(BrasselerAccountSettingsController, _super);
            function BrasselerAccountSettingsController(accountService, $localStorage, settingsService, coreService, sessionService) {
                var _this = _super.call(this, accountService, $localStorage, settingsService, coreService, sessionService) || this;
                _this.accountService = accountService;
                _this.$localStorage = $localStorage;
                _this.settingsService = settingsService;
                _this.coreService = coreService;
                _this.sessionService = sessionService;
                _this.$onInit();
                return _this;
            }
            BrasselerAccountSettingsController.prototype.updateAccountCompleted = function (account) {
                this.savedAccountEmail = account.email;
            };
            BrasselerAccountSettingsController.$inject = ["accountService", "$localStorage", "settingsService", "coreService", "sessionService"];
            return BrasselerAccountSettingsController;
        }(account_1.AccountSettingsController));
        account_1.BrasselerAccountSettingsController = BrasselerAccountSettingsController;
        angular
            .module("insite")
            .controller("AccountSettingsController", BrasselerAccountSettingsController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.account-settings.controller.js.map