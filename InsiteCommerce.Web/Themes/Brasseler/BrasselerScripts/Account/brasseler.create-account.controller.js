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
        var BrasselerCreateAccountController = /** @class */ (function (_super) {
            __extends(BrasselerCreateAccountController, _super);
            function BrasselerCreateAccountController(accountService, sessionService, coreService, settingsService, queryString, accessToken, spinnerService, $q, $http, ipCookie) {
                var _this = _super.call(this, accountService, sessionService, coreService, settingsService, queryString, accessToken, spinnerService, $q) || this;
                _this.accountService = accountService;
                _this.sessionService = sessionService;
                _this.coreService = coreService;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.accessToken = accessToken;
                _this.spinnerService = spinnerService;
                _this.$q = $q;
                _this.$http = $http;
                _this.ipCookie = ipCookie;
                _this.isCustomerSelected = true;
                _this.actonFormPostUrl = "";
                _this.haveCustomer = false;
                _this.haveCM = false;
                _this.dontHaveCM = false;
                _this.errorOnAccIden = false;
                return _this;
            }
            BrasselerCreateAccountController.prototype.init = function () {
                var _this = this;
                _super.prototype.init.call(this);
                this.accountService.getAccountSettings().then(function (settings) {
                    if (settings.properties["actonFormPostUrl"] != null) {
                        _this.actonFormPostUrl = settings.properties["actonFormPostUrl"];
                    }
                });
            };
            BrasselerCreateAccountController.prototype.createAccount = function () {
                var _this = this;
                this.createError = "";
                var valid = $("#createAccountForm").validate().form();
                if (!valid || !(this.haveCM || this.dontHaveCM)) {
                    if (!(this.haveCM || this.dontHaveCM)) {
                        this.isCustomerSelected = false;
                    }
                    return;
                }
                var property = {};
                property["CustomerNumber"] = $('#CustomerNumber').val();
                property["ZipCode"] = $('#ZipCode').val();
                property["IsCustomerNumberProvided"] = $('#radio1').is(':checked') === true ? "1" : "0";
                property["userLanguage"] = this.ipCookie("CurrentLanguageId"); //BUSA-1076 :  adding current languageid in user profie wen new user getting created for email localisation 
                console.log("IsCustomerNumberProvided  :  " + property["IsCustomerNumberProvided"]);
                var account = {
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
                    .then(function (account) {
                    if (parseInt(account.properties["shipToCount"]) > 1) {
                        _this.returnUrl = "/MyAccount/ChangeCustomer";
                    }
                    _this.accessToken.generate(_this.email, _this.password)
                        .then(function (result) {
                        if (account.isSubscribed && _this.actonFormPostUrl != "") {
                            var data = "?E-mail=" + account.email + "&Opt In for Email=TRUE";
                            _this.$http.jsonp(_this.actonFormPostUrl + data + "&callback=JSON_CALLBACK");
                        }
                        _this.accessToken.set(result.accessToken);
                        var currentContext = _this.sessionService.getContext();
                        currentContext.billToId = account.billToId;
                        currentContext.shipToId = account.shipToId;
                        _this.sessionService.setContext(currentContext);
                        _this.coreService.redirectToPathAndRefreshPage(_this.returnUrl);
                    }, function (error) {
                        _this.spinnerService.hide("mainLayout");
                        _this.createError = error.message;
                    });
                }, function (error) {
                    _this.spinnerService.hide("mainLayout");
                    _this.createError = error.message;
                    if (error.message == "Provided CustomerNumber/ZipCode is incorrect") {
                        _this.errorOnAccIden = true;
                        _this.password = "";
                        _this.confirmPassword = "";
                        _this.isSubscribed = false;
                        $('#radio1').prop('checked', true);
                        $('#CustomerNumber').val("");
                        $('#ZipCode').val("");
                    }
                    else {
                        _this.errorOnAccIden = false;
                    }
                });
            };
            BrasselerCreateAccountController.prototype.clear = function () {
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
            };
            BrasselerCreateAccountController.prototype.isValidPassword = function () {
                var regexp = /^(?=(.*\d){1})(?=.*[a-zA-Z])(?=.*[!@#$%^&*.]).{7,12}$/;
                return regexp.test(this.password);
            };
            BrasselerCreateAccountController.prototype.customerSelection = function () {
                if ($('#radio1').is(':checked')) {
                    this.haveCustomer = true;
                }
                else {
                    this.haveCustomer = false;
                }
                this.isCustomerSelected = true;
            };
            // BUSA-1092 Added eye icon on password field to show/hide password on click
            BrasselerCreateAccountController.prototype.togglePasswordField = function (fieldId, iconId) {
                if ($("#" + fieldId).attr("type") == "password") {
                    $("#" + fieldId).attr("type", "text");
                    $("#" + iconId).removeClass("fa-eye-slash").addClass("fa-eye");
                }
                else {
                    $("#" + fieldId).attr("type", "password");
                    $("#" + iconId).removeClass("fa-eye").addClass("fa-eye-slash");
                }
            };
            BrasselerCreateAccountController.$inject = [
                "accountService",
                "sessionService",
                "coreService",
                "settingsService",
                "queryString",
                "accessToken",
                "spinnerService",
                "$q",
                "$http",
                "ipCookie" //BUSA-1076 :  adding current languageid in user profie wen new user getting created for email localisation 
            ];
            return BrasselerCreateAccountController;
        }(account_1.CreateAccountController));
        account_1.BrasselerCreateAccountController = BrasselerCreateAccountController;
        angular
            .module("insite")
            .controller("CreateAccountController", BrasselerCreateAccountController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.create-account.controller.js.map