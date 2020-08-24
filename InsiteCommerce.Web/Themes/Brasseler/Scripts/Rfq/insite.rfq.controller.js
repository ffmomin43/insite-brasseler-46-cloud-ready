var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var RfqController = /** @class */ (function () {
            function RfqController(coreService, $scope, cartService, rfqService, accountService, sessionService, settingsService, $q) {
                this.coreService = coreService;
                this.$scope = $scope;
                this.cartService = cartService;
                this.rfqService = rfqService;
                this.accountService = accountService;
                this.sessionService = sessionService;
                this.settingsService = settingsService;
                this.$q = $q;
            }
            RfqController.prototype.$onInit = function () {
                this.initEvents();
                this.cartService.cartLoadCalled = true;
            };
            RfqController.prototype.initEvents = function () {
                var _this = this;
                this.$scope.$on("cartChanged", function (event) { return _this.onCartChanged(event); });
                this.$q.all([this.sessionService.getSession(), this.settingsService.getSettings()]).then(function (results) { _this.getSessionAndSettingsCompleted(results); }, function (error) { _this.getSessionAndSettingsFailed(error); });
            };
            RfqController.prototype.onCartChanged = function (event) {
                this.getCart();
            };
            RfqController.prototype.getSessionAndSettingsCompleted = function (results) {
                this.session = (results[0]);
                this.quoteSettings = (results[1]).quoteSettings;
                this.getCart();
            };
            RfqController.prototype.getSessionAndSettingsFailed = function (error) {
            };
            RfqController.prototype.getCart = function () {
                var _this = this;
                this.cartService.expand = "cartlines,costcodes";
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            RfqController.prototype.getCartCompleted = function (cart) {
                this.cartService.expand = "";
                if (!this.cart) {
                    this.mapData(cart);
                }
                this.cart = cart;
            };
            RfqController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
            };
            RfqController.prototype.mapData = function (cart) {
                this.notes = cart.notes;
                this.isSalesRep = cart.isSalesperson;
                if (this.isSalesRep) {
                    this.getSalesRepSpecificData();
                }
            };
            RfqController.prototype.getSalesRepSpecificData = function () {
                var _this = this;
                this.accountService.getAccounts().then(function (accountCollection) { _this.getAccountsCompleted(accountCollection); }, function (error) { _this.getAccountsFailed(error); });
            };
            RfqController.prototype.getAccountsCompleted = function (accountCollection) {
                var _this = this;
                var userCollection = accountCollection.accounts;
                this.users = userCollection
                    .filter(function (user) { return user.userName !== _this.session.userName; })
                    .sort(function (user1, user2) { return user1.userName.localeCompare(user2.userName); });
                this.users.forEach(function (user) {
                    if (user.firstName && user.lastName) {
                        user.displayName = user.firstName + " " + user.lastName;
                    }
                    else {
                        user.displayName = user.userName;
                    }
                });
            };
            RfqController.prototype.getAccountsFailed = function (result) {
            };
            RfqController.prototype.submitQuote = function (submitSuccessUri) {
                var _this = this;
                var valid = angular.element("#submitQuoteForm").validate().form();
                if (!valid) {
                    return;
                }
                var submitQuote = {
                    quoteId: this.cart.id,
                    userId: this.selectedUser,
                    note: this.notes,
                    jobName: this.jobName,
                    isJobQuote: this.isJobQuote
                };
                this.disableSubmit = true;
                this.rfqService.submitQuote(submitQuote).then(function (quote) { _this.submitQuoteCompleted(quote, submitSuccessUri); }, function (error) { _this.submitQuoteFailed(error); });
            };
            RfqController.prototype.submitQuoteCompleted = function (quote, successUri) {
                this.getCart();
                this.quoteCompletedRedirect(successUri, quote.id);
            };
            RfqController.prototype.submitQuoteFailed = function (error) {
                this.disableSubmit = false;
            };
            RfqController.prototype.quoteCompletedRedirect = function (successUri, quoteModelId) {
                if (this.isSalesRep) {
                    this.coreService.redirectToPath(successUri + "?quoteId=" + quoteModelId);
                }
                else {
                    this.coreService.redirectToPath(successUri + "?cartid=" + quoteModelId);
                }
            };
            RfqController.$inject = ["coreService", "$scope", "cartService", "rfqService", "accountService", "sessionService", "settingsService", "$q"];
            return RfqController;
        }());
        rfq.RfqController = RfqController;
        angular
            .module("insite")
            .controller("RfqController", RfqController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.rfq.controller.js.map