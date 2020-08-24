var insite;
(function (insite) {
    var paymentoptions;
    (function (paymentoptions) {
        "use strict";
        var OutstandingInvoicesPaymentController = /** @class */ (function () {
            function OutstandingInvoicesPaymentController($scope, $window, cartService, websiteService, sessionService, coreService, queryString, userPaymentProfileService, spinnerService) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.websiteService = websiteService;
                this.sessionService = sessionService;
                this.coreService = coreService;
                this.queryString = queryString;
                this.userPaymentProfileService = userPaymentProfileService;
                this.spinnerService = spinnerService;
                this.payOtherAmount = 0;
                this.fixedAmt = true;
                this.invoiceList = [];
                this.disable = false;
                this.init();
            }
            OutstandingInvoicesPaymentController.prototype.init = function () {
                var _this = this;
                this.submitting = false;
                this.$scope.$watch("vm.address", function (useBillingAddress) { _this.onUseBillingAddressChanged(useBillingAddress); });
                this.$scope.$watch("vm.creditCardBillingCountry", function (country) { _this.onCreditCardBillingCountryChanged(country); });
                this.$scope.$watch("vm.creditCardBillingState", function (state) { _this.onCreditCardBillingStateChanged(state); });
                this.websiteService.getCountries("states").then(function (result) {
                    _this.countries = result.countries;
                    _this.creditCardBillingCountry = _this.countries[0];
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
                angular.element("#OutstandingInvoicesPaymentPopUp").foundation("reveal", {
                    "close": function () {
                        _this.isSuccess = false;
                        _this.isError = false;
                        _this.submitErrorMessage = "";
                    }
                });
                //BUSA-PIO loading all stored cards for invoice payment.
                this.getUserStoredCards();
                //BUSA - 592 end : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.
                this.get(true);
            };
            OutstandingInvoicesPaymentController.prototype.get = function (isInit) {
                var _this = this;
                var paymentMethod, saveCardType, saveCardHolderName, saveCardNumber, saveExpirationMonth, saveExpirationYear, saveSecurityCode;
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
                this.cartService.getCart(this.cartId).then(function (cart) {
                    var payerId = _this.queryString.get("PayerID").toUpperCase();
                    var token = _this.queryString.get("token").toUpperCase();
                    _this.cart = cart;
                    _this.billTo = _this.cart.billTo;
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
                    //BUSA-1162 Payment Options missing on outstanding invoices
                    var indexOfOnAccount = 0;
                    _this.cart.paymentOptions.paymentMethods.forEach(function (x) {
                        if (x.name == 'CK' && x.isCreditCard == false) {
                            _this.cart.paymentOptions.paymentMethods.splice(indexOfOnAccount, 1);
                            return;
                        }
                        indexOfOnAccount += 1;
                    });
                    //BUSA-1162 Payment Options missing on outstanding invoices - END
                });
                this.$scope.$on("invoiceBalance", function (event, outstandingBalance) {
                    _this.payInvoiceBalance = _this.$window.localStorage.getItem("currentBalance");
                });
                this.$scope.$on("selectedInvoices", function (event, invoices) {
                    var total = 0;
                    _this.invoiceList = invoices;
                    invoices.forEach(function (inv) { total += parseFloat(inv.PaymentAmount); });
                    _this.payInvoiceBalance = total.toString();
                });
                this.$scope.$on("outstandingBalance", function (event, outstandingBalance) {
                    _this.payInvoiceBalance = outstandingBalance;
                });
                this.$scope.$on("allInvoices", function (event, allInvoices) {
                    _this.invoiceList = allInvoices;
                });
            };
            OutstandingInvoicesPaymentController.prototype.getUserStoredCards = function () {
                var _this = this;
                this.userPaymentProfileService.getUserPaymentProfiles().success(function (data) {
                    _this.UserPaymentProfileCollectionModel = data;
                    _this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
                });
            };
            OutstandingInvoicesPaymentController.prototype.payInvoice = function (signInUri) {
                var _this = this;
                var valid = $("#payInvoiceForm").validate().form();
                if (!valid) {
                    this.submitting = false;
                    return;
                }
                var valid1 = $("#PaymentOnly").validate().form();
                if (!valid1) {
                    this.submitting = false;
                    this.submitting = false;
                    return;
                }
                if (this.cart.paymentOptions.creditCard.cardNumber != null) {
                    if (this.userPaymentProfileCollection != null && this.userPaymentProfileCollection != undefined)
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
                var now = new Date();
                if (this.cart.paymentMethod.isCreditCard) {
                    if (this.cart.paymentOptions.creditCard.expirationMonth < now.getMonth()) {
                        if ((this.cart.paymentOptions.creditCard.expirationYear < now.getFullYear()) || (this.cart.paymentOptions.creditCard.expirationYear == now.getFullYear())) {
                            this.submitting = true;
                            $("#expiryerror").attr("style", "display:block");
                            $("#expiryerror").attr("style", "color:#f04124");
                            valid = false;
                        }
                        else {
                            this.submitting = false;
                            $("#expiryerror").attr("style", "display:none");
                        }
                    }
                    else {
                        this.submitting = false;
                        $("#expiryerror").attr("style", "display:none");
                    }
                }
                if (this.cart.paymentMethod.isPaymentProfile && !this.cart.requiresApproval) {
                    var cardRegEx = null;
                    var cardCVVRegEx = null;
                    this.saveCheckBox = false;
                    var savedCardType = this.cart.paymentMethod.description.slice(16, 19).trim();
                    switch (savedCardType) {
                        case "VI":
                            cardRegEx = new RegExp("^4[0-9]{12}(?:[0-9]{3})?$");
                            cardCVVRegEx = new RegExp("^([0-9]{3})$");
                            break;
                        case "AM":
                            cardRegEx = new RegExp("^3[47][0-9]{13}$");
                            cardCVVRegEx = new RegExp("^([0-9]{4})$");
                            break;
                        case "DC":
                            cardRegEx = new RegExp("^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$");
                            cardCVVRegEx = new RegExp("^([0-9]{3})$");
                            break;
                        case "MC":
                            cardRegEx = new RegExp("^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$");
                            cardCVVRegEx = new RegExp("^([0-9]{3})$");
                            break;
                        default:
                            break;
                    }
                    if (!cardCVVRegEx.test(this.cart.paymentOptions.creditCard.securityCode)) {
                        $("#cardCVVeerror1").attr("style", "display:block");
                        $("#cardCVVeerror1").attr("style", "color:#f04124");
                        valid = false;
                    }
                    else {
                        $("#cardCVVeerror1").attr("style", "display:none");
                    }
                }
                //BUSA_618: Checkout Payment Page: Please enter at least 3 characters error message is displayed for American Express Credit Card end.
                //BUSA-397-- added if condition  
                if (this.cart.paymentMethod.isCreditCard) {
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
                            valid = false;
                            $("#cardNumbertypeerror").attr("style", "display:block");
                            $("#cardNumbertypeerror").attr("style", "color:#f04124");
                        }
                        else {
                            $("#cardNumbertypeerror").attr("style", "display:none");
                        }
                        if (!cardCVVRegEx.test(this.cart.paymentOptions.creditCard.securityCode)) {
                            $("#cardCVVeerror").attr("style", "display:block");
                            $("#cardCVVeerror").attr("style", "color:#f04124");
                            valid = false;
                        }
                        else {
                            $("#cardCVVeerror").attr("style", "display:none");
                        }
                    }
                    //BUSA-933 : Invalid Postal Code
                    if (!this.cart.paymentOptions.creditCard.useBillingAddress) {
                        var postalCode = this.cart.paymentOptions.creditCard.postalCode;
                        //BUSA-1149 : CA Invoice Payment -> CA Postal Codes are NOT accepted in Make Payment Modal
                        this.cart.paymentOptions.creditCard.country = this.creditCardBillingCountry.name;
                        if (this.cart.paymentOptions.creditCard.country.toLowerCase() == "united states") {
                            var isValidPostalCode = /^\d{5}(-\d{4})?(?!-)$/.test(postalCode);
                        }
                        else {
                            var isValidPostalCode = /^((?:[a-zA-Z][0-9][a-zA-Z])\s[0-9][a-zA-Z][0-9])$/.test(postalCode);
                        }
                        //BUSA-1149 end
                        if (postalCode != null && postalCode != "") {
                            if (!isValidPostalCode) {
                                $("#validatePostalCode").text("Please Enter Valid Postal Code");
                                $("#validatePostalCode").show();
                                valid = false;
                            }
                            else {
                                $("#validatePostalCode").hide();
                            }
                        }
                    }
                    switch (this.cart.paymentOptions.creditCard.cardType) {
                        case "VISA":
                            this.cart.properties["cardType"] = "VI";
                            break;
                        case "AMERICAN EXPRESS":
                            this.cart.properties["cardType"] = "AM";
                            break;
                        case "DISCOVER":
                            this.cart.properties["cardType"] = "DC";
                            break;
                        case "MASTERCARD":
                            this.cart.properties["cardType"] = "MC";
                            break;
                        default:
                            this.cart.properties["cardType"] = "CK";
                            break;
                    }
                }
                if (!valid) {
                    this.submitting = false;
                    return;
                }
                this.disable = true;
                if (this.fixedAmt) {
                    this.cart.properties['payAmount'] = this.payInvoiceBalance;
                }
                else {
                    this.cart.properties['payAmount'] = this.payOtherAmount.toString();
                }
                //this.cart.properties['outstandingInvoiceNumber'] = this.invoiceNumber;
                this.cart.properties['invoiceList'] = JSON.stringify(this.invoiceList);
                this.cart.paymentOptions.storePaymentProfile = this.saveCheckBox;
                this.sessionService.getIsAuthenticated()
                    .then(function (isAuthenticated) {
                    if (isAuthenticated) {
                        _this.cart.status = "PayInvoice";
                        _this.spinnerService.show("invoice");
                        _this.cartService.updateCart(_this.cart, true).then(function (result) {
                            _this.disable = false;
                            angular.element("#OutstandingInvoicesPaymentPopUp").foundation('reveal', 'close');
                            var $popup = angular.element("#paymentPopup");
                            $popup.foundation('reveal', 'open');
                            var newBal = parseFloat(_this.payInvoiceBalance) - parseFloat(_this.cart.properties['payAmount']);
                            _this.$window.localStorage.setItem("currentBalance", newBal.toString());
                            _this.$window.localStorage.setItem("popup", "true");
                            setTimeout(function () { _this.$window.location.reload(true); }, 2000);
                        }).catch(function (error) {
                            _this.disable = false;
                            _this.submitting = false;
                            _this.cart.paymentOptions.isPayPal = false;
                            _this.submitErrorMessage = error.message;
                            _this.spinnerService.hideAll();
                        });
                    }
                    else {
                        _this.$window.location.href = signInUri + "?returnUrl=" + _this.$window.location.href;
                    }
                });
            };
            OutstandingInvoicesPaymentController.prototype.onUseBillingAddressChanged = function (useBillingAddress) {
                if (!useBillingAddress) {
                    if (typeof (this.countries) !== "undefined" && this.countries.length === 1) {
                        this.creditCardBillingCountry = this.countries[0];
                    }
                }
            };
            OutstandingInvoicesPaymentController.prototype.onCreditCardBillingCountryChanged = function (country) {
                if (typeof (country) !== "undefined" && this.cart != null) {
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
            OutstandingInvoicesPaymentController.prototype.onCreditCardBillingStateChanged = function (state) {
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
            OutstandingInvoicesPaymentController.$inject = [
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
            return OutstandingInvoicesPaymentController;
        }());
        paymentoptions.OutstandingInvoicesPaymentController = OutstandingInvoicesPaymentController;
        angular
            .module("insite")
            .controller("OutstandingInvoicesPaymentController", OutstandingInvoicesPaymentController);
    })(paymentoptions = insite.paymentoptions || (insite.paymentoptions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.outstanding-invoices-payment.controller.js.map