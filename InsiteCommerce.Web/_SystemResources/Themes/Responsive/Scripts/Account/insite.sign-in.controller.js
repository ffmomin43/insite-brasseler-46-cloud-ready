var insite;
(function (insite) {
    var account;
    (function (account_1) {
        "use strict";
        var SignInController = /** @class */ (function () {
            function SignInController($scope, $window, accountService, sessionService, customerService, coreService, spinnerService, $attrs, settingsService, cartService, queryString, accessToken, $timeout, $localStorage, wishListService, $q) {
                this.$scope = $scope;
                this.$window = $window;
                this.accountService = accountService;
                this.sessionService = sessionService;
                this.customerService = customerService;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.$attrs = $attrs;
                this.settingsService = settingsService;
                this.cartService = cartService;
                this.queryString = queryString;
                this.accessToken = accessToken;
                this.$timeout = $timeout;
                this.$localStorage = $localStorage;
                this.wishListService = wishListService;
                this.$q = $q;
                this.accessTokenString = "";
                this.signInError = "";
                this.disableSignIn = true;
            }
            SignInController.prototype.$onInit = function () {
                var _this = this;
                this.homePageUrl = this.$attrs.homePageUrl;
                this.changeCustomerPageUrl = this.$attrs.changeCustomerPageUrl;
                this.dashboardUrl = this.$attrs.dashboardUrl;
                this.addressesUrl = this.$attrs.addressesUrl;
                this.checkoutAddressUrl = this.$attrs.checkoutAddressUrl;
                this.reviewAndPayUrl = this.$attrs.reviewAndPayUrl;
                this.myListDetailUrl = this.$attrs.myListDetailUrl;
                this.staticListUrl = this.$attrs.staticListUrl;
                this.cartUrl = this.$attrs.cartUrl;
                this.orderConfirmationUrl = this.$attrs.orderConfirmationUrl;
                this.returnUrl = this.queryString.get("returnUrl");
                if (!this.returnUrl || this.returnUrl.indexOf(this.orderConfirmationUrl) !== -1) {
                    this.returnUrl = this.homePageUrl;
                }
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.cart = this.cartService.getLoadedCurrentCart();
                if (!this.cart) {
                    this.$scope.$on("cartLoaded", function (event, cart) { _this.onCartLoaded(cart); });
                }
                var lowerCaseReturnUrl = this.returnUrl.toLowerCase();
                if (lowerCaseReturnUrl.indexOf(this.reviewAndPayUrl.toLowerCase()) > -1) {
                    this.isFromReviewAndPay = true;
                }
                if (lowerCaseReturnUrl.indexOf(this.myListDetailUrl.toLowerCase()) > -1 && lowerCaseReturnUrl.indexOf("invite") > -1) {
                    this.invitedToList = true;
                }
                var idParam = "?id=";
                if (lowerCaseReturnUrl.indexOf(this.staticListUrl.toLowerCase()) > -1 && !this.queryString.get("clientRedirect") && lowerCaseReturnUrl.indexOf(idParam) > -1) {
                    this.listId = lowerCaseReturnUrl.substr(lowerCaseReturnUrl.indexOf(idParam) + idParam.length, 36);
                    this.navigatedFromStaticList = true;
                }
                this.isFromCheckoutAddress = lowerCaseReturnUrl.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1;
            };
            SignInController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.disableSignIn = false;
                if (session.isAuthenticated && !session.isGuest) {
                    this.$window.location.href = this.dashboardUrl;
                }
                else if (this.invitedToList) {
                    this.coreService.displayModal("#popup-sign-in-required");
                }
                else if (this.navigatedFromStaticList) {
                    this.getList();
                }
            };
            SignInController.prototype.getSessionFailed = function (error) {
            };
            SignInController.prototype.getList = function () {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getListById(this.listId, "excludelistlines,staticlist").then(function (list) { _this.getListCompleted(list); }, function (error) { _this.getListFailed(error); });
            };
            SignInController.prototype.getListCompleted = function (list) {
                this.spinnerService.hide();
                this.listOwner = list.sharedByDisplayName;
                this.coreService.displayModal("#popup-sign-in-required");
            };
            SignInController.prototype.getListFailed = function (error) {
                this.spinnerService.hide();
            };
            SignInController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
            };
            SignInController.prototype.getSettingsFailed = function (error) {
            };
            SignInController.prototype.onCartLoaded = function (cart) {
                this.cart = cart;
            };
            SignInController.prototype.signIn = function (errorMessage) {
                var _this = this;
                if (this.disableSignIn) {
                    return;
                }
                this.signInError = "";
                if (this.signInForm.$invalid) {
                    return;
                }
                this.disableSignIn = true;
                this.spinnerService.show("mainLayout", true);
                this.signOutIfGuestSignedIn().then(function (signOutResult) { _this.signOutIfGuestSignedInCompleted(signOutResult); }, function (error) { _this.signOutIfGuestSignedInFailed(error); });
            };
            SignInController.prototype.unassignCartFromGuest = function () {
                if (this.cart && this.cart.lineCount > 0) {
                    this.cart.unassignCart = true;
                    return this.cartService.updateCart(this.cart);
                }
                var defer = this.$q.defer();
                defer.resolve();
                return defer.promise;
            };
            SignInController.prototype.signOutIfGuestSignedIn = function () {
                var _this = this;
                if (this.session.isAuthenticated && this.session.isGuest) {
                    return this.unassignCartFromGuest().then(function (result) { return _this.sessionService.signOut(); });
                }
                var defer = this.$q.defer();
                defer.resolve();
                return defer.promise;
            };
            SignInController.prototype.signOutIfGuestSignedInCompleted = function (signOutResult) {
                var _this = this;
                this.accessToken.remove();
                this.accessToken.generate(this.userName, this.password).then(function (accessTokenDto) { _this.generateAccessTokenOnSignInCompleted(accessTokenDto); }, function (error) { _this.generateAccessTokenOnSignInFailed(error); });
            };
            SignInController.prototype.signOutIfGuestSignedInFailed = function (error) {
                this.signInError = error.message;
                this.disableSignIn = false;
                this.spinnerService.hide("mainLayout");
            };
            SignInController.prototype.generateAccessTokenOnSignInCompleted = function (accessTokenDto) {
                this.accessTokenString = accessTokenDto.accessToken;
                this.signUserIn();
            };
            SignInController.prototype.generateAccessTokenOnSignInFailed = function (error) {
                this.signInError = error.message;
                this.disableSignIn = false;
                this.spinnerService.hide("mainLayout");
            };
            SignInController.prototype.selectCustomer = function (session) {
                var _this = this;
                if (session.redirectToChangeCustomerPageOnSignIn) {
                    var shouldAddReturnUrl = this.returnUrl && this.returnUrl !== this.homePageUrl;
                    this.$window.location.href = this.changeCustomerPageUrl + (shouldAddReturnUrl ? "?returnUrl=" + encodeURIComponent(this.returnUrl) : "");
                }
                else {
                    this.cartService.expand = "cartlines,hiddenproducts";
                    this.cartService.getCart(this.cart.id).then(function (cart) { _this.getCartCompleted(session, cart); }, function (error) { _this.getCartFailed(error); });
                }
            };
            SignInController.prototype.encodeUriComponent = function (url) {
                return this.$window.encodeURIComponent(url);
            };
            SignInController.prototype.getCartCompleted = function (session, cart) {
                this.cartService.expand = "";
                this.sessionService.redirectAfterSelectCustomer(session, this.cart.canBypassCheckoutAddress, this.dashboardUrl, this.returnUrl, this.checkoutAddressUrl, this.reviewAndPayUrl, this.addressesUrl, this.cartUrl, this.cart.canCheckOut);
            };
            SignInController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
            };
            SignInController.prototype.showGuestCheckout = function () {
                return this.settings && this.settings.allowGuestCheckout && this.session && !this.session.isAuthenticated && this.isFromCheckoutAddress;
            };
            SignInController.prototype.guestCheckout = function () {
                var _this = this;
                var account = { isGuest: true };
                if (this.session) {
                    account.defaultFulfillmentMethod = this.session.fulfillmentMethod;
                    if (this.session.pickUpWarehouse) {
                        account.defaultWarehouseId = this.session.pickUpWarehouse.id;
                    }
                }
                this.spinnerService.show("mainLayout", true);
                this.accountService.createAccount(account).then(function (createdAccount) { _this.createAccountCompleted(createdAccount); }, function (error) { _this.createAccountFailed(error); });
            };
            SignInController.prototype.createAccountCompleted = function (account) {
                var _this = this;
                this.accessToken.generate(account.userName, account.password).then(function (accessTokenDto) { _this.generateAccessTokenForAccountCreationCompleted(accessTokenDto); }, function (error) { _this.generateAccessTokenForAccountCreationFailed(error); });
            };
            SignInController.prototype.createAccountFailed = function (error) {
                this.signInError = error.message;
            };
            SignInController.prototype.generateAccessTokenForAccountCreationCompleted = function (accessTokenDto) {
                this.accessToken.set(accessTokenDto.accessToken);
                this.$window.location.href = this.returnUrl;
            };
            SignInController.prototype.generateAccessTokenForAccountCreationFailed = function (error) {
                this.signInError = error.message;
            };
            SignInController.prototype.resetForgotPasswordPopup = function () {
                this.email = "";
                this.userNameToReset = "";
                this.resetPasswordSuccess = false;
                return true;
            };
            SignInController.prototype.changePassword = function () {
                var _this = this;
                this.changePasswordError = "";
                var valid = $("#changePasswordForm").validate().form();
                if (!valid) {
                    return;
                }
                var session = {
                    userName: this.userName,
                    password: this.password,
                    newPassword: this.newPassword
                };
                this.sessionService.changePassword(session, this.accessTokenString).then(function (sessionResult) { _this.changePasswordCompleted(sessionResult); }, function (error) { _this.changePasswordFailed(error); });
            };
            SignInController.prototype.changePasswordCompleted = function (session) {
                this.password = this.newPassword;
                this.signUserIn();
            };
            SignInController.prototype.changePasswordFailed = function (error) {
                this.changePasswordError = error.message;
            };
            SignInController.prototype.resetPassword = function () {
                var _this = this;
                this.resetPasswordError = "";
                var valid = $("#resetPasswordForm").validate().form();
                if (!valid) {
                    return;
                }
                this.sessionService.sendResetPasswordEmail(this.userNameToReset).then(function (session) { _this.sendResetPasswordEmailCompleted(session); }, function (error) { _this.sendResetPasswordEmailFailed(error); });
            };
            SignInController.prototype.sendResetPasswordEmailCompleted = function (session) {
                this.resetPasswordSuccess = true;
            };
            SignInController.prototype.sendResetPasswordEmailFailed = function (error) {
                this.resetPasswordError = error.message;
            };
            SignInController.prototype.signUserIn = function () {
                var _this = this;
                this.sessionService.signIn(this.accessTokenString, this.userName, this.password, this.rememberMe).then(function (session) { _this.signInCompleted(session); }, function (error) { _this.signInFailed(error); });
            };
            SignInController.prototype.signInCompleted = function (session) {
                var _this = this;
                this.sessionService.setContextFromSession(session);
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
                    this.selectCustomer(session);
                }
            };
            SignInController.prototype.signInFailed = function (error) {
                this.disableSignIn = false;
                if (error.status === 422) {
                    this.coreService.displayModal(angular.element("#changePasswordPopup"));
                }
                else {
                    if (error.message) {
                        this.signInError = error.message;
                    }
                    else {
                        this.signInError = error;
                    }
                }
            };
            SignInController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            SignInController.$inject = ["$scope",
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
                "$q"
            ];
            return SignInController;
        }());
        account_1.SignInController = SignInController;
        angular
            .module("insite")
            .controller("SignInController", SignInController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.sign-in.controller.js.map