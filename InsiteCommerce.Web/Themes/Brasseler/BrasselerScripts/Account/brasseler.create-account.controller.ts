module insite.account {
    "use strict";

    export class BrasselerCreateAccountController extends CreateAccountController {

        firstName: string;
        lastName: string;
        confirmPassword: string;
        isCustomerSelected: boolean = true;
        actonFormPostUrl = "";
        haveCustomer: boolean = false;
        haveCM: boolean = false;
        dontHaveCM: boolean = false;
        errorOnAccIden: boolean = false;

        static $inject = [
            "accountService",
            "sessionService",
            "coreService",
            "settingsService",
            "queryString",
            "accessToken",
            "spinnerService",
            "$q",
            "$http",
            "ipCookie"               //BUSA-1076 :  adding current languageid in user profie wen new user getting created for email localisation 
        ];

        constructor(

            protected accountService: IAccountService,
            protected sessionService: ISessionService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected accessToken: common.IAccessTokenService,
            protected spinnerService: core.SpinnerService,
            protected $q: ng.IQService,
            protected $http: ng.IHttpService,
            protected ipCookie: any) {        //BUSA-1076 :  adding current languageid in user profie wen new user getting created for email localisation 
            super(accountService, sessionService, coreService, settingsService, queryString, accessToken, spinnerService, $q);
        }


        init() {
            super.init();
            this.accountService.getAccountSettings().then(settings => {
                if (settings.properties["actonFormPostUrl"] != null) {
                    this.actonFormPostUrl = settings.properties["actonFormPostUrl"];
                }
            });
        }


        public createAccount() {
            this.createError = "";

            var valid = $("#createAccountForm").validate().form();
            if (!valid || !(this.haveCM || this.dontHaveCM)) {
                if (!(this.haveCM || this.dontHaveCM)) {
                    this.isCustomerSelected = false;
                }
                return;
            }

            var property: { [w: string]: string } = {};

            property["CustomerNumber"] = $('#CustomerNumber').val();
            property["ZipCode"] = $('#ZipCode').val();
            property["IsCustomerNumberProvided"] = $('#radio1').is(':checked') === true ? "1" : "0";
            property["userLanguage"] = this.ipCookie("CurrentLanguageId");        //BUSA-1076 :  adding current languageid in user profie wen new user getting created for email localisation 
            console.log("IsCustomerNumberProvided  :  "+ property["IsCustomerNumberProvided"]);
            var account = <AccountModel>{
                email: this.email,
                userName: this.email,
                firstName: this.firstName,
                lastName: this.lastName,
                password: this.password,
                isSubscribed: this.isSubscribed,
                properties: property
            };

            this.spinnerService.show("mainLayout");

            this.accountService.createAccount(account)
                .then((account: AccountModel) => {
                    if (parseInt(account.properties["shipToCount"]) > 1) {
                        this.returnUrl = "/MyAccount/ChangeCustomer";
                }
                this.accessToken.generate(this.email, this.password)
                .then(result => {
                    if (account.isSubscribed && this.actonFormPostUrl != "") {
                        var data = "?E-mail=" + account.email + "&Opt In for Email=TRUE";
                        this.$http.jsonp(this.actonFormPostUrl + data + "&callback=JSON_CALLBACK");
                    }
                    this.accessToken.set(result.accessToken);
                    var currentContext = this.sessionService.getContext();
                    currentContext.billToId = account.billToId;
                    currentContext.shipToId = account.shipToId;
                    this.sessionService.setContext(currentContext);
                    this.coreService.redirectToPathAndRefreshPage(this.returnUrl);
                    }, (error) => {
                        this.spinnerService.hide("mainLayout");
                        this.createError = error.message;
                    });

                   

                }, 
                (error) => {
                    this.spinnerService.hide("mainLayout");
                    this.createError = error.message;
                    if (error.message == "Provided CustomerNumber/ZipCode is incorrect") {
                        this.errorOnAccIden = true;
                        this.password = "";
                        this.confirmPassword = "";
                        this.isSubscribed = false;
                        $('#radio1').prop('checked', true);
                        $('#CustomerNumber').val("");
                        $('#ZipCode').val("");
                    }
                    else {
                        this.errorOnAccIden = false;
                    }
                });
        }

        clear() {
            this.firstName = "";
            this.lastName = "";
            this.email = "";
            this.password = "";
            this.confirmPassword = "";
            this.isSubscribed = false;
            $('#radio1').prop('checked', false);
            $('#radio2').prop('checked', false);
            $('#CustomerNumber').val("");
            $('#ZipCode').val("");
        }

        isValidPassword() {
            var regexp = /^(?=(.*\d){1})(?=.*[a-zA-Z])(?=.*[!@#$%^&*.]).{7,12}$/;
            return regexp.test(this.password);
        }

        customerSelection() {
            if ($('#radio1').is(':checked')) {
                this.haveCustomer = true;
            } else {
                this.haveCustomer = false;
            }
            this.isCustomerSelected = true;
        }

        // BUSA-1092 Added eye icon on password field to show/hide password on click
        togglePasswordField(fieldId,  iconId): void {
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
        .controller("CreateAccountController", BrasselerCreateAccountController);
        
}