var insite;
(function (insite) {
    var paymentoptions;
    (function (paymentoptions) {
        "use strict";
        var AddNewCardController = /** @class */ (function () {
            function AddNewCardController($scope, $window, cartService, websiteService, sessionService, coreService, queryString, userPaymentProfileService, spinnerService) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.websiteService = websiteService;
                this.sessionService = sessionService;
                this.coreService = coreService;
                this.queryString = queryString;
                this.userPaymentProfileService = userPaymentProfileService;
                this.spinnerService = spinnerService;
                this.init();
            }
            AddNewCardController.prototype.init = function () {
                var _this = this;
                this.submitting = false;
                this.$scope.$watch("vm.address", function (useBillingAddress) { _this.onUseBillingAddressChanged(useBillingAddress); });
                this.$scope.$watch("vm.creditCardBillingCountry", function (country) { _this.onCreditCardBillingCountryChanged(country); });
                this.$scope.$watch("vm.creditCardBillingState", function (state) { _this.onCreditCardBillingStateChanged(state); });
                this.websiteService.getCountries("states").then(function (result) {
                    _this.countries = result.countries;
                    //Generic state for website level.
                    if (_this.countries.filter(function (c) { return c.abbreviation == _this.countries[0].abbreviation; }).length > 0) {
                        _this.states = _this.countries.filter(function (c) { return c.abbreviation == _this.countries[0].abbreviation; })[0].states;
                    }
                });
                //$("#addressOptions").validate();
                //this.$scope.$watch("vm.cart.paymentOptions.creditCard.expirationYear", (value) => {
                //    if (value) {
                //        var now = new Date();
                //        var minMonth = now.getFullYear() === value ? now.getMonth() : 0;
                //        $("#expirationMonth").rules("add", { min: minMonth });
                //        $("#expirationMonth").valid();
                //    }
                //});
                //BUSA - 592 start : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.
                angular.element("#AddNewCardContainer").foundation("reveal", {
                    "close": function () {
                        _this.isSuccess = false;
                        _this.isError = false;
                        _this.$scope.$apply();
                        _this.submitErrorMessage = "";
                    }
                });
                angular.element("#whatsThisPopup").foundation("reveal", {
                    "close": function () {
                        angular.element("#AddNewCardContainer").foundation('reveal', 'open');
                    }
                });
                $('a.AddNewCardButton').click(function () {
                    angular.element("#AddNewCardContainer").foundation('reveal', 'open');
                    _this.getUserStoredCards();
                });
                //BUSA - 592 end : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.
                this.get(true);
            };
            AddNewCardController.prototype.get = function (isInit) {
                var _this = this;
                var paymentMethod, saveCardType, saveCardHolderName, saveCardNumber, saveExpirationMonth, saveExpirationYear, saveSecurityCode;
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
                this.cartService.getCart(this.cartId).then(function (cart) {
                    var payerId = _this.queryString.get("PayerID").toUpperCase();
                    var token = _this.queryString.get("token").toUpperCase();
                    // save transients
                    if (_this.cart && _this.cart.paymentOptions) {
                        paymentMethod = _this.cart.paymentMethod;
                        saveCardType = _this.cart.paymentOptions.creditCard.cardType;
                        saveCardHolderName = _this.cart.paymentOptions.creditCard.cardHolderName;
                        saveCardNumber = _this.cart.paymentOptions.creditCard.cardNumber;
                        saveExpirationMonth = _this.cart.paymentOptions.creditCard.expirationMonth;
                        saveExpirationYear = _this.cart.paymentOptions.creditCard.expirationYear;
                        saveSecurityCode = _this.cart.paymentOptions.creditCard.securityCode;
                    }
                    _this.cart = cart;
                    _this.billTo = _this.cart.billTo;
                    _this.cartIdParam = _this.cart.id === "current" ? "" : "?cartId=" + _this.cart.id;
                    // restore transients
                    if (saveCardType) {
                        _this.cart.paymentOptions.creditCard.cardType = saveCardType;
                        _this.cart.paymentOptions.creditCard.cardHolderName = saveCardHolderName;
                        _this.cart.paymentOptions.creditCard.cardNumber = saveCardNumber;
                        _this.cart.paymentOptions.creditCard.expirationMonth = saveExpirationMonth;
                        _this.cart.paymentOptions.creditCard.expirationYear = saveExpirationYear;
                        _this.cart.paymentOptions.creditCard.securityCode = saveSecurityCode;
                    }
                    if (payerId && token) {
                        _this.cart.paymentOptions.isPayPal = true;
                        _this.cart.status = "Cart";
                        _this.cart.paymentOptions.payPalToken = token;
                        _this.cart.paymentOptions.payPalPayerId = payerId;
                        _this.cart.paymentMethod = null;
                    }
                });
            };
            //mapData() {
            //    this.cart.properties["ccAddress1"] = this.ccAddress1;
            //    this.cart.properties["ccAddress2"] = this.ccAddress2;
            //    this.cart.properties["ccCountry"] = this.Country.name;
            //    this.cart.properties["ccState"] = this.newAddState.name;
            //    this.cart.properties["ccStateCode"] = this.newAddState.abbreviation;
            //    this.cart.properties["ccCity"] = this.ccCity;
            //    this.cart.properties["ccPostalCode"] = this.ccPostalCode;
            //    this.cart.properties["ccEmailId"] = this.ccEmailId;
            //    this.cart.properties["ccPhone"] = this.ccPhone;
            //}
            AddNewCardController.prototype.getUserStoredCards = function () {
                var _this = this;
                this.userPaymentProfileService.getUserPaymentProfiles().success(function (data) {
                    _this.UserPaymentProfileCollectionModel = data;
                    _this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
                });
            };
            AddNewCardController.prototype.addcard = function (redirectURI) {
                var _this = this;
                this.spinnerService.showAll();
                var error = false;
                //this.submitting = true;
                this.canAddCard = true;
                //BUSA-607 start: iPad Specific: Clicking on an error message opens up expiration date drop down.
                var now = new Date();
                if (this.cart.paymentOptions.creditCard.expirationMonth < now.getMonth()) {
                    if ((this.cart.paymentOptions.creditCard.expirationYear < now.getFullYear()) || (this.cart.paymentOptions.creditCard.expirationYear == now.getFullYear())) {
                        error = true;
                        $("#expiryerror").attr("style", "display:block");
                        $("#expiryerror").attr("style", "color:#f04124");
                    }
                    else {
                        error = false;
                        $("#expiryerror").attr("style", "display:none");
                    }
                }
                else {
                    error = false;
                    $("#expiryerror").attr("style", "display:none");
                }
                //BUSA-607 end: iPad Specific: Clicking on an error message opens up expiration date drop down.
                //BUSA - 592 start : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.
                if (this.cart.paymentOptions.creditCard.cardNumber != null) {
                    if (this.userPaymentProfileCollection.length != 0) {
                        this.userPaymentProfileCollection.forEach(function (x) {
                            var cc = x.maskedCardNumber.substr(x.maskedCardNumber.length - 4, 4);
                            var ccType = x.cardType;
                            var newCC = _this.cart.paymentOptions.creditCard.cardNumber.substr(x.maskedCardNumber.length - 4, 4);
                            var newCCType = _this.cart.paymentOptions.creditCard.cardType;
                            if (cc == newCC && ccType == newCCType) {
                                _this.submitErrorMessage = 'Credit Card with this number is already saved in our records';
                                _this.submitting = false;
                                _this.canAddCard = false;
                                _this.spinnerService.hideAll();
                                return;
                            }
                        });
                    }
                }
                //BUSA-600 : Please enter at least 3 characters error message is displayed for American Express Card start.
                var cardRegEx = null;
                var cardCVVRegEx = null;
                switch (this.cart.paymentOptions.creditCard.cardType) {
                    case "VISA":
                        cardRegEx = new RegExp("^4[0-9]{12}(?:[0-9]{3})?$");
                        cardCVVRegEx = new RegExp("^([0-9]{3})$");
                        break;
                    case "AMERICAN EXPRESS":
                        cardRegEx = new RegExp("^3[47][0-9]{13}$");
                        cardCVVRegEx = new RegExp("^([0-9]{4})$");
                        break;
                    case "DISCOVER":
                        cardRegEx = new RegExp("^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$");
                        cardCVVRegEx = new RegExp("^([0-9]{3})$");
                        break;
                    case "MASTERCARD":
                        cardRegEx = new RegExp("^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$");
                        cardCVVRegEx = new RegExp("^([0-9]{3})$");
                        break;
                    default:
                        break;
                }
                if (this.cart.paymentOptions.creditCard.cardType) {
                    if (!cardRegEx.test(this.cart.paymentOptions.creditCard.cardNumber)) {
                        error = true;
                        $("#cardNumbertypeerror").attr("style", "display:block");
                        $("#cardNumbertypeerror").attr("style", "color:#f04124");
                    }
                    else {
                        $("#cardNumbertypeerror").attr("style", "display:none");
                    }
                    if (!cardCVVRegEx.test(this.cart.paymentOptions.creditCard.securityCode)) {
                        $("#cardCVVeerror").attr("style", "display:block");
                        $("#cardCVVeerror").attr("style", "color:#f04124");
                        error = true;
                    }
                    else {
                        $("#cardCVVeerror").attr("style", "display:none");
                    }
                }
                //BUSA-600 : Please enter at least 3 characters error message is displayed for American Express Card end.
                //BUSA - 592 end : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.
                if (this.canAddCard) {
                    var valid = $("#addressOptions").validate().form();
                    if (!valid || error) {
                        $("#addressOptions").find(".error:eq(0)").focus();
                        this.submitting = false;
                        this.spinnerService.hideAll();
                        return;
                    }
                    if (this.address == 'UseAnotherAddress')
                        this.cart.paymentOptions.creditCard.useBillingAddress = false;
                    this.cart.status = "SaveNewCard";
                    this.cart.properties["AddNewCard"] = "true";
                    //this.cart.paymentMethod.isCreditCard = true;
                    //BUSA-619 : Card Information popup becomes unresponsive on clicking save button start.
                    if (this.cart.paymentMethod != null && this.cart.paymentOptions.paymentMethods != null) {
                        this.cart.paymentMethod.isCreditCard = true;
                    }
                    else {
                    }
                    //BUSA-619 : Card Information popup becomes unresponsive on clicking save button end.
                    this.spinnerService.show("mainLayout", true);
                    this.cartService.updateCart(this.cart, true).then(function (result) {
                        angular.element("#AddNewCardContainer").foundation('reveal', 'close');
                        _this.$window.location.reload(true);
                    }).catch(function (error) {
                        _this.submitting = false;
                        _this.cart.paymentOptions.isPayPal = false;
                        _this.submitErrorMessage = error.message;
                        _this.spinnerService.hideAll();
                    });
                }
            };
            AddNewCardController.prototype.onUseBillingAddressChanged = function (useBillingAddress) {
                if (!useBillingAddress) {
                    if (typeof (this.countries) !== "undefined" && this.countries.length === 1) {
                        this.creditCardBillingCountry = this.countries[0];
                    }
                }
            };
            AddNewCardController.prototype.onCreditCardBillingCountryChanged = function (country) {
                if (typeof (country) !== "undefined") {
                    if (country != null) {
                        this.cart.paymentOptions.creditCard.country = country.name;
                        this.cart.paymentOptions.creditCard.countryAbbreviation = country.abbreviation;
                    }
                    else {
                        this.cart.paymentOptions.creditCard.country = "";
                        this.cart.paymentOptions.creditCard.countryAbbreviation = "";
                    }
                }
            };
            AddNewCardController.prototype.onCreditCardBillingStateChanged = function (state) {
                if (typeof (state) !== "undefined") {
                    if (state != null) {
                        this.cart.paymentOptions.creditCard.state = state.name;
                        this.cart.paymentOptions.creditCard.stateAbbreviation = state.abbreviation;
                    }
                    else {
                        this.cart.paymentOptions.creditCard.state = "";
                        this.cart.paymentOptions.creditCard.stateAbbreviation = "";
                    }
                }
            };
            AddNewCardController.$inject = [
                "$scope",
                "$window",
                "cartService",
                "websiteService",
                "sessionService",
                "coreService",
                "queryString",
                "userPaymentProfileService",
                "spinnerService"
            ];
            return AddNewCardController;
        }());
        paymentoptions.AddNewCardController = AddNewCardController;
        angular
            .module("insite")
            .controller("AddNewCardController", AddNewCardController);
    })(paymentoptions = insite.paymentoptions || (insite.paymentoptions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.add-new-card.controller.js.map