module insite.account {
    "use strict";

    export class BrasselerAccountSettingsController extends AccountSettingsController {

        static $inject = ["accountService", "$localStorage", "settingsService"];

        constructor(
            protected accountService: account.IAccountService,
            protected $localStorage: common.IWindowStorage,
            protected settingsService: core.ISettingsService) {
            super(accountService, $localStorage, settingsService)
            this.init();
        }

        updateAccountCompleted(account: AccountModel): void {
            this.savedAccountEmail = account.email;
        }
    }

    angular
        .module("insite")
        .controller("AccountSettingsController", BrasselerAccountSettingsController);
}