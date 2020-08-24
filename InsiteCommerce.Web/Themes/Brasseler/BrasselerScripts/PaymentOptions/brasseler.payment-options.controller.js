var insite;
(function (insite) {
    var paymentoptions;
    (function (paymentoptions) {
        "use strict";
        var PaymentOptionsController = /** @class */ (function () {
            function PaymentOptionsController($scope, $window, $rootScope, accountService, sessionService, spinnerService, userPaymentProfileService, coreService, cartService) {
                this.$scope = $scope;
                this.$window = $window;
                this.$rootScope = $rootScope;
                this.accountService = accountService;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.userPaymentProfileService = userPaymentProfileService;
                this.coreService = coreService;
                this.cartService = cartService;
                this.updateCardError = false;
                this.expiryCardError = false;
                this.init();
            }
            PaymentOptionsController.prototype.init = function () {
                var _this = this;
                this.getPaymentProfile();
                this.accountService.getAccount().then(function (model) {
                    _this.account = model;
                });
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
                this.cartService.getCart(this.cartId).then(function (cart) {
                    _this.cart = cart;
                });
            };
            PaymentOptionsController.prototype.getPaymentProfile = function () {
                var _this = this;
                this.userPaymentProfileService.getUserPaymentProfiles().success(function (data) {
                    _this.UserPaymentProfileCollectionModel = data;
                    _this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
                    _this.defaultCard = data.properties["defaultCardId"];
                    data.properties["defaultCardId"] = 'newcard';
                }).error(function (error) {
                    _this.validationMessage = error.exceptionMessage;
                });
            };
            PaymentOptionsController.prototype.deleteCard = function (cardId) {
                var _this = this;
                this.spinnerService.show("mainLayout", true);
                this.userPaymentProfile = this.userPaymentProfileCollection.filter(function (x) { return x.id === cardId; })[0];
                this.userPaymentProfileService.deleteUserPaymentProfile(this.userPaymentProfile).success(function () {
                    _this.getPaymentProfile();
                    _this.spinnerService.hide();
                }).error(function (error) {
                    if (error == 'Resource is Forbidden.') {
                        var $popup = angular.element("#removeCardErrorPopup");
                        _this.coreService.displayModal($popup);
                    }
                });
            };
            PaymentOptionsController.prototype.saveDefaultCard = function (cardId) {
                this.account.properties["defaultCardId"] = cardId.toString();
                this.accountService.updateAccount(this.account);
                this.UserPaymentProfileCollectionModel.properties["defaultCardId"] = cardId.toString();
                this.defaultCard = cardId.toString();
            };
            PaymentOptionsController.prototype.calculateExpiryDate = function (expiryDate) {
                var today = new Date(); // gets the current date
                var today_mm = today.getMonth() + 1; // extracts the month portion
                var today_yy = today.getFullYear() % 100; // extracts the year portion and changes it from yyyy to yy format
                var cc_month = parseInt(expiryDate.substring(0, 2));
                var cc_year = parseInt(expiryDate.substring(4, 2));
                if (cc_month < 10) {
                    this.dateFormat = "0" + cc_month + "/20" + cc_year;
                }
                else {
                    this.dateFormat = cc_month + "/20" + cc_year;
                }
                if (cc_year > today_yy || (cc_year == today_yy && cc_month > today_mm)) {
                    return false;
                }
                else {
                    return true;
                }
            };
            PaymentOptionsController.prototype.editCard = function (userPaymentProfileId) {
                $("#editCard_" + userPaymentProfileId).attr("style", "display:none");
                $("#editDate_" + userPaymentProfileId).attr("style", "display:block");
                $("#saveCard_" + userPaymentProfileId).attr("style", "display:block");
                $("#cancelCard_" + userPaymentProfileId).attr("style", "display:block");
                $("#expired-date_" + userPaymentProfileId).attr("style", "display:none");
                $("#setDefaultCard_" + userPaymentProfileId).attr("style", "display:none");
                $("#defaultCard_" + userPaymentProfileId).attr("style", "display:none");
                $("#expires-date_" + userPaymentProfileId).attr("style", "display:none");
                $("#cardImages_" + userPaymentProfileId).attr("class", "edit-click");
            };
            PaymentOptionsController.prototype.cancelCard = function (userPaymentProfileId) {
                $("#editCard_" + userPaymentProfileId).attr("style", "display:inline-block");
                $("#editDate_" + userPaymentProfileId).attr("style", "display:none");
                $("#saveCard_" + userPaymentProfileId).attr("style", "display:none");
                $("#cancelCard_" + userPaymentProfileId).attr("style", "display:none");
                $("#expired-date_" + userPaymentProfileId).attr("style", "display:block");
                $("#setDefaultCard_" + userPaymentProfileId).attr("style", "display:inline-block");
                $("#defaultCard_" + userPaymentProfileId).attr("style", "display:inline-block");
                $("#expires-date_" + userPaymentProfileId).attr("style", "display:inline-block");
                $("#cardImages_" + userPaymentProfileId).attr("class", "");
            };
            //BUSA-1122 Allowing user to update expiry date of existing CC.
            PaymentOptionsController.prototype.updateCard = function (userPaymentProfileId) {
                var _this = this;
                this.expiryCardError = false;
                var now = new Date();
                if (this.cart.paymentOptions.creditCard.expirationMonth <= (now.getMonth() + 1)) {
                    if ((this.cart.paymentOptions.creditCard.expirationYear < now.getFullYear()) || (this.cart.paymentOptions.creditCard.expirationYear == now.getFullYear())) {
                        this.expiryCardError = true;
                    }
                    else {
                        this.expiryCardError = false;
                    }
                }
                else {
                    this.expiryCardError = false;
                }
                if (this.expiryCardError) {
                    $("html, body").animate({
                        scrollTop: $("#paymentErrors").offset().top
                    }, 3000);
                    return;
                }
                this.spinnerService.show("mainLayout", true);
                this.userPaymentProfile = this.userPaymentProfileCollection.filter(function (x) { return x.id === userPaymentProfileId; })[0];
                this.userPaymentProfile.expirationDate = ("0" + this.cart.paymentOptions.creditCard.expirationMonth.toString()).slice(-2) + this.cart.paymentOptions.creditCard.expirationYear.toString().slice(2);
                this.userPaymentProfileService.updateUserPaymentProfile(this.userPaymentProfile, true).then(function (response) {
                    _this.init();
                    _this.spinnerService.hide();
                }, function (error) {
                    _this.updateCardError = true;
                    _this.spinnerService.hide();
                    $("html, body").animate({
                        scrollTop: $("#paymentErrors").offset().top
                    }, 3000);
                });
            };
            PaymentOptionsController.$inject = [
                "$scope",
                "$window",
                "$rootScope",
                "accountService",
                "sessionService",
                "spinnerService",
                "userPaymentProfileService",
                "coreService",
                "cartService"
            ];
            return PaymentOptionsController;
        }());
        paymentoptions.PaymentOptionsController = PaymentOptionsController;
        angular
            .module("insite")
            .controller("PaymentOptionsController", PaymentOptionsController);
    })(paymentoptions = insite.paymentoptions || (insite.paymentoptions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.payment-options.controller.js.map