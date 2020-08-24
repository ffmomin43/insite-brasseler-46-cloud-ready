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
        var BrasselerSignInController = /** @class */ (function (_super) {
            __extends(BrasselerSignInController, _super);
            function BrasselerSignInController($scope, $window, accountService, sessionService, customerService, coreService, spinnerService, $attrs, settingsService, cartService, queryString, accessToken, $timeout, $localStorage, wishListService, $q) {
                var _this = _super.call(this, $scope, $window, accountService, sessionService, customerService, coreService, spinnerService, $attrs, settingsService, cartService, queryString, accessToken, $timeout, $localStorage, wishListService, $q) || this;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.accountService = accountService;
                _this.sessionService = sessionService;
                _this.customerService = customerService;
                _this.coreService = coreService;
                _this.spinnerService = spinnerService;
                _this.$attrs = $attrs;
                _this.settingsService = settingsService;
                _this.cartService = cartService;
                _this.queryString = queryString;
                _this.accessToken = accessToken;
                _this.$timeout = $timeout;
                _this.$localStorage = $localStorage;
                _this.wishListService = wishListService;
                _this.$q = $q;
                _this.signInError = "";
                _this.disableSignIn = false;
                _this.pageSkipper = true;
                _this.migratedUser = false;
                _super.prototype.resetPassword.bind(_this);
                _super.prototype.$onInit.call(_this);
                return _this;
            }
            BrasselerSignInController.prototype.resetForgotPasswordPopup = function () {
                //Get SiteKey for reset Password
                this.cartService.getCart();
                this.migratedUser = false;
                grecaptcha.render('lblrecapResultp', {
                    'sitekey': this.cart.properties['siteKey']
                });
                return _super.prototype.resetForgotPasswordPopup.call(this);
            };
            BrasselerSignInController.prototype.resetPassword = function () {
                var recaptchaResponse = grecaptcha.getResponse();
                if (recaptchaResponse.length === 0) {
                    $("#lblrecapResultp span").html("Incorrect Recaptcha answer.");
                    $("#lblrecapResultp span").css("color", "red");
                    $("#lblrecapResultp span").show();
                    return false;
                }
                else {
                    $("#lblrecapResultp span").hide();
                }
                grecaptcha.reset();
                this.userNameToReset = this.email;
                _super.prototype.resetPassword.call(this);
            };
            BrasselerSignInController.prototype.signIn = function (errorMessage) {
                var _this = this;
                this.signInError = "";
                if (this.signInForm.$invalid) {
                    return;
                }
                this.disableSignIn = true;
                this.spinnerService.showAll();
                var account = { isGuest: true, userName: this.userName, password: "1" };
                this.accountService.createAccount(account).catch(function (result) {
                    if (result.message == "IsMigratedUser") {
                        _this.email = "";
                        _this.migratedUser = true;
                        _this.resetPasswordSuccess = false;
                        _this.disableSignIn = false;
                        _this.coreService.displayModal(angular.element("#forgotPasswordPopup"));
                    }
                    else {
                        _this.migratedUser = false;
                        _this.signOutIfGuestSignedIn().then(function (signOutResult) { _this.signOutIfGuestSignedInCompleted(signOutResult); }, function (error) { _this.signOutIfGuestSignedInFailed(error); });
                    }
                });
            };
            BrasselerSignInController.prototype.generateAccessTokenOnSignInCompleted = function (accessTokenDto) {
                this.accessTokenString = accessTokenDto.accessToken;
                this.isSkip();
                this.signUserIn();
            };
            BrasselerSignInController.prototype.selectCustomer = function (session) {
                var _this = this;
                session.redirectToChangeCustomerPageOnSignIn = this.pageSkipper;
                if (session.redirectToChangeCustomerPageOnSignIn) {
                    var shouldAddReturnUrl = this.returnUrl && this.returnUrl !== this.homePageUrl;
                    this.$window.location.href = this.changeCustomerPageUrl + (shouldAddReturnUrl ? "?returnUrl=" + encodeURIComponent(this.returnUrl) : "");
                }
                else {
                    this.cartService.expand = "cartlines";
                    this.cartService.getCart(this.cart.id).then(function (cart) { _this.getCartCompleted(session, cart); }, function (error) { _this.getCartFailed(error); });
                }
            };
            BrasselerSignInController.prototype.isSkip = function () {
                var _this = this;
                this.customerService.getBillTos("shiptos,state").then(function (billToResult) {
                    if (billToResult.billTos.length === 1) {
                        var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
                        var shipTos = billToResult.billTos[0].shipTos.filter(function (shipTo) {
                            return !(chkIfOneTimeShipTo.test(shipTo.customerSequence));
                        });
                        if (shipTos.length == 1) {
                            _this.pageSkipper = false;
                        }
                    }
                });
            };
            BrasselerSignInController.prototype.signInCompleted = function (session) {
                var _this = this;
                this.spinnerService.showAll();
                this.accountService.getAccount().then(function (account) {
                    _this.sessionService.setContextFromSession(session);
                    var languageId = account.properties["userLanguage"];
                    languageId = languageId ? languageId : session.language.id;
                    _this.sessionService.setLanguage(languageId).then(function (x) {
                        session.language = x.language; //Set language null to get updated user language 
                        _this.selectCustomer(session);
                    });
                }).finally(function () {
                    _this.spinnerService.hideAll();
                });
                if (session.isRestrictedProductExistInCart) {
                    this.$localStorage.set("hasRestrictedProducts", true.toString());
                }
                if (this.invitedToList) {
                    var inviteParam = "invite=";
                    var lowerCaseReturnUrl = this.returnUrl.toLowerCase();
                    var invite = lowerCaseReturnUrl.substr(lowerCaseReturnUrl.indexOf(inviteParam) + inviteParam.length);
                    this.wishListService.activateInvite(invite).then(function (wishList) { _this.selectCustomer(session); }, function (error) { _this.selectCustomer(session); });
                }
                else {
                    this.accountService.getAccount().then(function (account) {
                        _this.sessionService.setContextFromSession(session);
                        var languageId = account.properties["userLanguage"];
                        languageId = languageId ? languageId : session.language.id;
                        _this.sessionService.setLanguage(languageId).then(function (x) {
                            session.language = x.language; //Set language null to get updated user language
                            _this.selectCustomer(session);
                        });
                    });
                }
            };
            // BUSA-1092 Added eye icon on password field to show/hide password on click
            BrasselerSignInController.prototype.togglePasswordField = function (fieldId, iconId) {
                if ($("#" + fieldId).attr("type") == "password") {
                    $("#" + fieldId).attr("type", "text");
                    $("#" + iconId).removeClass("fa-eye-slash").addClass("fa-eye");
                }
                else {
                    $("#" + fieldId).attr("type", "password");
                    $("#" + iconId).removeClass("fa-eye").addClass("fa-eye-slash");
                }
            };
            BrasselerSignInController.$inject = ["$scope",
                "$window",
                "accountService",
                "sessionService",
                "customerService",
                "coreService",
                "spinnerService",
                "$attrs",
                "settingsService",
                "cartService",
                "queryString",
                "accessToken",
                "$timeout",
                "$localStorage",
                "wishListService",
                "$q"];
            return BrasselerSignInController;
        }(account_1.SignInController));
        account_1.BrasselerSignInController = BrasselerSignInController;
        angular
            .module("insite")
            .controller("SignInController", BrasselerSignInController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.signin.controller.js.map