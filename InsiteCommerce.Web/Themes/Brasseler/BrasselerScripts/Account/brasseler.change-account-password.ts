module insite.account {
    "use strict";

    export class BrasselerChangeAccountPasswordController extends ChangeAccountPasswordController {
        settings: AccountSettingsModel;
        successUrl: string;
        changePasswordError = "";
        password = "";
        newPassword = "";

        static $inject =["$scope", "sessionService", "$localStorage", "$attrs", "settingsService", "coreService"];

        constructor(
            protected $scope: IChangeAccountPasswordControllerScope,
            protected sessionService: account.ISessionService,
            protected $localStorage: common.IWindowStorage,
            protected $attrs: IChangeAccountPasswordControllerAttributes,
            protected settingsService: core.ISettingsService,
            protected coreService: core.ICoreService) {
            super($scope, sessionService, $localStorage, $attrs, settingsService, coreService);
        }

        togglePasswordField(fieldId, iconId): void {
            if ($("#" + fieldId).attr("type") == "password") {
                $("#" + fieldId).attr("type", "text");
                $("#" + iconId).removeClass("fa-eye-slash").addClass("fa-eye");
            } else {
                $("#" + fieldId).attr("type", "password");
                $("#" + iconId).removeClass("fa-eye").addClass("fa-eye-slash");
            }
        }
        
    }
    angular
        .module("insite")
        .controller("ChangeAccountPasswordController", BrasselerChangeAccountPasswordController);

}