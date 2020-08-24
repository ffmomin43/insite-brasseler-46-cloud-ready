

module insite.paymentoptions {
    "use strict";

    export class OutstandingInvoicesPaymentController {
        cart: CartModel;
        cartId: string;
        cartIdParam: string;
        cartUrl: string;
        userProfileId: string;
        validationMessage: string;
        states: StateModel[];
        newAddState: StateModel;
        countries: CountryModel[];
        Country: CountryModel;
        isSuccess: boolean;
        isError: boolean;
        billTo: BillToModel;
        submitting: boolean;
        submitErrorMessage: string;
        ccAddress1: string;
        ccAddress2: string;
        ccCity: string;
        ccPostalCode: string;
        ccEmailId: string;
        ccPhone: string;
        canAddCard: boolean;
        address: string;
        userPaymentProfile: UserPaymentProfileModel;
        userPaymentProfileCollection: UserPaymentProfileModel[];
        UserPaymentProfileCollectionModel: UserPaymentProfileCollectionModel;
        creditCardBillingCountry: CountryModel;
        creditCardBillingState: StateModel;
        saveCheckBox: boolean;
        payOtherAmount: number = 0;
        payInvoiceBalance: string;
        invoiceNumber: string;
        fixedAmt: boolean = true;
        invoiceList: any[] = [];
        disable: boolean = false;
        static $inject = [
            "$scope"
            , "$window"
            , "cartService"
            , "websiteService"
            , "sessionService"
            , "coreService"
            , "queryString"
            , "userPaymentProfileService"
            , "spinnerService"
        ];


        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected cartService: cart.ICartService,
            protected websiteService: websites.IWebsiteService,
            protected sessionService: account.ISessionService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected userPaymentProfileService: paymentoptions.IUserPaymentProfileService,
            protected spinnerService: core.ISpinnerService) {
            this.init();
        }

        init(): void {
            this.submitting = false;

            this.$scope.$watch("vm.address", (useBillingAddress: boolean) => { this.onUseBillingAddressChanged(useBillingAddress); });
            this.$scope.$watch("vm.creditCardBillingCountry", (country: CountryModel) => { this.onCreditCardBillingCountryChanged(country); });
            this.$scope.$watch("vm.creditCardBillingState", (state: StateModel) => { this.onCreditCardBillingStateChanged(state); });

            this.websiteService.getCountries("states").then(result => {
                this.countries = result.countries;
                this.creditCardBillingCountry = this.countries[0];
                //Generic state for website level.
                if (this.countries.filter(c => c.abbreviation == this.countries[0].abbreviation).length > 0) {
                    this.states = this.countries.filter(c => c.abbreviation == this.countries[0].abbreviation)[0].states;
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
            (<any>angular.element("#OutstandingInvoicesPaymentPopUp")).foundation("reveal", {
                "close": () => {
                    this.isSuccess = false;
                    this.isError = false;
                    this.submitErrorMessage = "";
                }
            });

            //BUSA-PIO loading all stored cards for invoice payment.
            this.getUserStoredCards();


            //BUSA - 592 end : Card Information Pop up gets disappeared on clicking "What's This?" link in Add Card Section.

            this.get(true);
        }

        get(isInit?: boolean) {
            var paymentMethod: Insite.Cart.Services.Dtos.PaymentMethodDto,
                saveCardType: string,
                saveCardHolderName: string,
                saveCardNumber: string,
                saveExpirationMonth: number,
                saveExpirationYear: number,
                saveSecurityCode: string;

            this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
            this.cartService.getCart(this.cartId).then(cart => {
                var payerId = this.queryString.get("PayerID").toUpperCase();
                var token = this.queryString.get("token").toUpperCase();
                this.cart = cart;
                this.billTo = this.cart.billTo;

                // save transients
                if (this.cart && this.cart.paymentOptions) {
                    paymentMethod = this.cart.paymentMethod;
                    saveCardType = this.cart.paymentOptions.creditCard.cardType;
                    saveCardHolderName = this.cart.paymentOptions.creditCard.cardHolderName;
                    saveCardNumber = this.cart.paymentOptions.creditCard.cardNumber;
                    saveExpirationMonth = this.cart.paymentOptions.creditCard.expirationMonth;
                    saveExpirationYear = this.cart.paymentOptions.creditCard.expirationYear;
                    saveSecurityCode = this.cart.paymentOptions.creditCard.securityCode;
                }

                this.cartIdParam = this.cart.id === "current" ? "" : "?cartId=" + this.cart.id;

                // restore transients
                if (saveCardType) {
                    this.cart.paymentOptions.creditCard.cardType = saveCardType;
                    this.cart.paymentOptions.creditCard.cardHolderName = saveCardHolderName;
                    this.cart.paymentOptions.creditCard.cardNumber = saveCardNumber;
                    this.cart.paymentOptions.creditCard.expirationMonth = saveExpirationMonth;
                    this.cart.paymentOptions.creditCard.expirationYear = saveExpirationYear;
                    this.cart.paymentOptions.creditCard.securityCode = saveSecurityCode;
                }

                if (payerId && token) {
                    this.cart.paymentOptions.isPayPal = true;
                    this.cart.status = "Cart";
                    this.cart.paymentOptions.payPalToken = token;
                    this.cart.paymentOptions.payPalPayerId = payerId;
                    this.cart.paymentMethod = null;
                }

                //BUSA-1162 Payment Options missing on outstanding invoices
                var indexOfOnAccount = 0
                this.cart.paymentOptions.paymentMethods.forEach(x => {
                    if (x.name == 'CK' && x.isCreditCard == false) {
                        this.cart.paymentOptions.paymentMethods.splice(indexOfOnAccount, 1);
                        return;
                    }
                    indexOfOnAccount += 1;
                });
                //BUSA-1162 Payment Options missing on outstanding invoices - END
            });

            this.$scope.$on("invoiceBalance", (event: any, outstandingBalance: any) => {
                this.payInvoiceBalance = this.$window.localStorage.getItem("currentBalance");
            });
            
            this.$scope.$on("selectedInvoices", (event: any, invoices: any) => {
                var total = 0;
                this.invoiceList = invoices;

                invoices.forEach(inv => { total += parseFloat(inv.PaymentAmount) });
                this.payInvoiceBalance = total.toString();
            });

            this.$scope.$on("outstandingBalance", (event: any, outstandingBalance: any) => {
                this.payInvoiceBalance = outstandingBalance;
            });
            this.$scope.$on("allInvoices", (event: any, allInvoices: any) => {
                this.invoiceList = allInvoices;
            });

        }

        getUserStoredCards(): void {
            this.userPaymentProfileService.getUserPaymentProfiles().success(data => {
                this.UserPaymentProfileCollectionModel = data;
                this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
            });
        }

        payInvoice(signInUri: string): void {

            var valid = $("#payInvoiceForm").validate().form();
            if (!valid) {
                this.submitting = false;
                return;
            }

            var valid1 = $("#PaymentOnly").validate().form();
            if (!valid1) {this.submitting = false;
                this.submitting = false;
                return;
            }
            
            if (this.cart.paymentOptions.creditCard.cardNumber != null) {
                if (this.userPaymentProfileCollection != null && this.userPaymentProfileCollection != undefined)
                    if (this.userPaymentProfileCollection.length != 0) {
                        this.userPaymentProfileCollection.forEach(x => {
                            var cc = x.maskedCardNumber.substr(x.maskedCardNumber.length - 4, 4);
                            var ccType = x.cardType;
                            var newCC = this.cart.paymentOptions.creditCard.cardNumber.substr(x.maskedCardNumber.length - 4, 4);
                            var newCCType = this.cart.paymentOptions.creditCard.cardType;
                            if (cc == newCC && ccType == newCCType) {
                                this.submitErrorMessage = 'Credit Card with this number is already saved in our records';
                                this.submitting = false;
                                this.canAddCard = false;
                                this.spinnerService.hideAll();
                                return;
                            }
                        });
                    }
            }

            var now = new Date();
            if (this.cart.paymentMethod.isCreditCard){
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
                } else {
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
                    } else {
                        $("#cardNumbertypeerror").attr("style", "display:none");
                    }

                    if (!cardCVVRegEx.test(this.cart.paymentOptions.creditCard.securityCode)) {
                        $("#cardCVVeerror").attr("style", "display:block");
                        $("#cardCVVeerror").attr("style", "color:#f04124");
                        valid = false;
                    } else {
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
            } else {
                this.cart.properties['payAmount'] = this.payOtherAmount.toString();
            }
            //this.cart.properties['outstandingInvoiceNumber'] = this.invoiceNumber;
            this.cart.properties['invoiceList'] = JSON.stringify(this.invoiceList);
            this.cart.paymentOptions.storePaymentProfile = this.saveCheckBox;

            this.sessionService.getIsAuthenticated()
                .then((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        this.cart.status = "PayInvoice";
                        this.spinnerService.show("invoice");
                        this.cartService.updateCart(this.cart, true).then(result => {
                            this.disable = false;
                            (<any>angular.element("#OutstandingInvoicesPaymentPopUp")).foundation('reveal', 'close');
                            var $popup: any = angular.element("#paymentPopup");
                            $popup.foundation('reveal', 'open');
                            var newBal = parseFloat(this.payInvoiceBalance) - parseFloat(this.cart.properties['payAmount'])
                            this.$window.localStorage.setItem("currentBalance", newBal.toString());
                            this.$window.localStorage.setItem("popup", "true");
                            setTimeout(() => { this.$window.location.reload(true) }, 2000);

                        }).catch(error => {
                            this.disable = false;
                            this.submitting = false;
                            this.cart.paymentOptions.isPayPal = false;
                            this.submitErrorMessage = error.message;
                            this.spinnerService.hideAll();
                        });
                    } else {
                        this.$window.location.href = signInUri + "?returnUrl=" + this.$window.location.href;
                    }
                });
        }

        protected onUseBillingAddressChanged(useBillingAddress: boolean): void {
            if (!useBillingAddress) {
                if (typeof (this.countries) !== "undefined" && this.countries.length === 1) {
                    this.creditCardBillingCountry = this.countries[0];
                }
            }
        }

        protected onCreditCardBillingCountryChanged(country: CountryModel): void {
            if (typeof (country) !== "undefined" && this.cart != null) {
                if (country != null) {
                    this.cart.paymentOptions.creditCard.country = country.name;
                    this.cart.paymentOptions.creditCard.countryAbbreviation = country.abbreviation;
                } else {
                    this.cart.paymentOptions.creditCard.country = "";
                    this.cart.paymentOptions.creditCard.countryAbbreviation = "";
                }
            }
        }

        protected onCreditCardBillingStateChanged(state: StateModel): void {
            if (typeof (state) !== "undefined") {
                if (state != null) {
                    this.cart.paymentOptions.creditCard.state = state.name;
                    this.cart.paymentOptions.creditCard.stateAbbreviation = state.abbreviation;
                } else {
                    this.cart.paymentOptions.creditCard.state = "";
                    this.cart.paymentOptions.creditCard.stateAbbreviation = "";
                }
            }
        }

    }

    angular
        .module("insite")
        .controller("OutstandingInvoicesPaymentController", OutstandingInvoicesPaymentController);
}