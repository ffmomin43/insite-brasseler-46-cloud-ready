import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;

module insite.paymentoptions {
    "use strict";

    export class AddNewCardController {
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
            (<any>angular.element("#AddNewCardContainer")).foundation("reveal", {
                "close": () => {
                    this.isSuccess = false;
                    this.isError = false;
                    this.$scope.$apply();
                    this.submitErrorMessage = "";
                }
            });


            (<any>angular.element("#whatsThisPopup")).foundation("reveal", {
                "close": () => {
                    (<any>angular.element("#AddNewCardContainer")).foundation('reveal', 'open');
                }
            });

            $('a.AddNewCardButton').click(() => {
                (<any>angular.element("#AddNewCardContainer")).foundation('reveal', 'open'); 
                this.getUserStoredCards();
            });
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

                this.cart = cart;
                this.billTo = this.cart.billTo;

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
            });
        }


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

        getUserStoredCards() {
            this.userPaymentProfileService.getUserPaymentProfiles().success(data => {
                this.UserPaymentProfileCollectionModel = data;
                this.userPaymentProfileCollection = data.listUserPaymentProfileModel;
            });
        }

        addcard(redirectURI: string) {
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
                } else {
                    $("#cardNumbertypeerror").attr("style", "display:none");
                }

                if (!cardCVVRegEx.test(this.cart.paymentOptions.creditCard.securityCode)) {
                    $("#cardCVVeerror").attr("style", "display:block");
                    $("#cardCVVeerror").attr("style", "color:#f04124");
                    error = true;
                } else {
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
                if (this.cart.paymentMethod != null && this.cart.paymentOptions.paymentMethods != null) { this.cart.paymentMethod.isCreditCard = true; }
                else {

                }
                //BUSA-619 : Card Information popup becomes unresponsive on clicking save button end.

                this.spinnerService.show("mainLayout", true);
                this.cartService.updateCart(this.cart, true).then(result => {
                    (<any>angular.element("#AddNewCardContainer")).foundation('reveal', 'close');
                    this.$window.location.reload(true);
                }).catch(error => {
                    this.submitting = false;
                    this.cart.paymentOptions.isPayPal = false;
                    this.submitErrorMessage = error.message;
                    this.spinnerService.hideAll();
                });
            }

        }



        protected onUseBillingAddressChanged(useBillingAddress: boolean): void {
            if (!useBillingAddress) {
                if (typeof (this.countries) !== "undefined" && this.countries.length === 1) {
                    this.creditCardBillingCountry = this.countries[0];
                }
            }
        }

        protected onCreditCardBillingCountryChanged(country: CountryModel): void {
            if (typeof (country) !== "undefined") {
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
        .controller("AddNewCardController", AddNewCardController);
}