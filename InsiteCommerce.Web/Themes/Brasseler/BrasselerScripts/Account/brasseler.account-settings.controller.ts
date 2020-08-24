module insite.account {
    "use strict";

    export class BrasselerAccountSettingsController extends AccountSettingsController {

        static $inject = ["accountService", "$localStorage", "settingsService", "coreService", "sessionService"];

        constructor(
            protected accountService: account.IAccountService,
            protected $localStorage: common.IWindowStorage,
            protected settingsService: core.ISettingsService,
            protected coreService: core.ICoreService,
            protected sessionService: account.ISessionService
        ) {
            super(accountService, $localStorage, settingsService, coreService, sessionService)
            this.$onInit();
        }

        updateAccountCompleted(account: AccountModel): void {
            this.savedAccountEmail = account.email;
        }
    }

    angular
        .module("insite")
        .controller("AccountSettingsController", BrasselerAccountSettingsController);
}