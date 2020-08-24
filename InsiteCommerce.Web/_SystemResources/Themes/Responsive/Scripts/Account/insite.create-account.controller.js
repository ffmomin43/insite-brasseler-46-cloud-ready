var insite;
(function (insite) {
    var account;
    (function (account_1) {
        "use strict";
        var CreateAccountController = /** @class */ (function () {
            function CreateAccountController(accountService, cartService, sessionService, coreService, settingsService, queryString, accessToken, spinnerService, $q) {
                this.accountService = accountService;
                this.cartService = cartService;
                this.sessionService = sessionService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.accessToken = accessToken;
                this.spinnerService = spinnerService;
                this.$q = $q;
            }
            CreateAccountController.prototype.$onInit = function () {
                var _this = this;
                this.returnUrl = this.queryString.get("returnUrl");
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            CreateAccountController.prototype.getSessionCompleted = function (session) {
                this.session = session;
            };
            CreateAccountController.prototype.getSessionFailed = function (error) {
            };
            CreateAccountController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.accountSettings;
            };
            CreateAccountController.prototype.getSettingsFailed = function (error) {
            };
            CreateAccountController.prototype.createAccount = function () {
                var _this = this;
                this.createError = "";
                var trimRule = {
                    required: true,
                    normalizer: function (value) {
                        return $.trim(value);
                    }
                };
                var valid = $("#createAccountForm").validate({
                    rules: {
                        "CreateNewAccountInfo.UserName": trimRule,
                        "CreateNewAccountInfo.Password": trimRule,
                        "CreateNewAccountInfo.ConfirmPassword": trimRule
                    }
                }).form();
                if (!valid) {
                    return;
                }
                this.spinnerService.show("mainLayout", true);
                this.signOutIfGuestSignedIn().then(function (signOutResult) { _this.signOutIfGuestSignedInCompleted(signOutResult); }, function (error) { _this.signOutIfGuestSignedInFailed(error); });
            };
            CreateAccountController.prototype.unassignCartFromGuest = function () {
                var cart = this.cartService.getLoadedCurrentCart();
                if (cart && cart.lineCount > 0) {
                    cart.unassignCart = true;
                    return this.cartService.updateCart(cart);
                }
                var defer = this.$q.defer();
                defer.resolve();
                return defer.promise;
            };
            CreateAccountController.prototype.signOutIfGuestSignedIn = function () {
                var _this = this;
                if (this.session.isAuthenticated && this.session.isGuest) {
                    return this.unassignCartFromGuest().then(function (result) { return _this.sessionService.signOut(); });
                }
                var defer = this.$q.defer();
                defer.resolve();
                return defer.promise;
            };
            CreateAccountController.prototype.signOutIfGuestSignedInCompleted = function (signOutResult) {
                var _this = this;
                var account = {
                    email: this.email,
                    userName: this.userName,
                    password: this.password,
                    isSubscribed: this.isSubscribed
                };
                this.accountService.createAccount(account).then(function (createdAccount) { _this.createAccountCompleted(createdAccount); }, function (error) { _this.createAccountFailed(error); });
            };
            CreateAccountController.prototype.signOutIfGuestSignedInFailed = function (error) {
                this.createError = error.message;
            };
            CreateAccountController.prototype.createAccountCompleted = function (account) {
                var _this = this;
                this.accessToken.generate(account.userName, this.password).then(function (accessToken) { _this.generateAccessTokenCompleted(account, accessToken); }, function (error) { _this.generateAccessTokenFailed(error); });
            };
            CreateAccountController.prototype.createAccountFailed = function (error) {
                this.createError = error.message;
            };
            CreateAccountController.prototype.generateAccessTokenCompleted = function (account, accessToken) {
                this.accessToken.set(accessToken.accessToken);
                var currentContext = this.sessionService.getContext();
                currentContext.billToId = account.billToId;
                currentContext.shipToId = account.shipToId;
                this.sessionService.setContext(currentContext);
                this.coreService.redirectToPathAndRefreshPage(this.returnUrl);
            };
            CreateAccountController.prototype.generateAccessTokenFailed = function (error) {
                this.createError = error.message;
            };
            CreateAccountController.$inject = [
                "accountService",
                "cartService",
                "sessionService",
                "coreService",
                "settingsService",
                "queryString",
                "accessToken",
                "spinnerService",
                "$q"
            ];
            return CreateAccountController;
        }());
        account_1.CreateAccountController = CreateAccountController;
        angular
            .module("insite")
            .controller("CreateAccountController", CreateAccountController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.create-account.controller.js.map