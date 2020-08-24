module insite.cart {
    "use strict";

    export class BrasselerReviewAndPayController extends ReviewAndPayController {
        cart: CartModel;
        cartId: string;
        cartIdParam: string;
        promotions: PromotionModel[];
        promotionAppliedMessage: string;
        promotionErrorMessage: string;
        submitErrorMessage: string;
        submitting: boolean;
        cartUrl: string;
        freeShipping: boolean;
        custDefaultCarrierId: string;
        saveCheckBox: boolean;
        qtyOrdered: number;
        isSubscribed = false;
        subscriptionFrequency: any;
        frequencyOpted: number;
        saveFrequencyReload: string;
        checkoutNextShipDate: string;
        saveSubscriptionName: string;
        parsedSourceCodes: any;
        isIncludeInitialSS: boolean = true;
        showPopUp: boolean = false;
        error: string;
        checkoutShipDate: Date;
        cartModelBrasseler: CartModelBrasseler = null;
        canEditNextDelieveryDate: boolean;
        paymentMethod: any;
        frequencyMap: any;
        nextShipDate: Date;
        showDropdown: boolean;
        showSaveCardInfo: boolean = true;
        newWebShopperCustomerNumber = "1055357";
        errorMessage: string;

        static $inject = [
            "$scope",
            "$window",
            "cartService",
            "promotionService",
            "sessionService",
            "coreService",
            "spinnerService",
            "$attrs",
            "settingsService",
            "queryString",
            "$localStorage",
            "websiteService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected cartService: ICartService,
            protected promotionService: promotions.IPromotionService,
            protected sessionService: account.ISessionService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected $attrs: IReviewAndPayControllerAttributes,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected $localStorage: common.IWindowStorage,
            protected websiteService: websites.IWebsiteService) {

            super($scope, $window, cartService, promotionService, sessionService, coreService, spinnerService,
                $attrs, settingsService, queryString, $localStorage, websiteService);
            //super.init();
        }

        init() {
            this.sessionService.getSession().then((session: SessionModel) => {
                if (session != null && session != undefined && session.billTo) {
                    if (String(session.billTo.customerNumber).includes(this.newWebShopperCustomerNumber)) {
                        this.showSaveCardInfo = false;
                    }
                }
            });
            this.freeShipping = false;
            this.spinnerService.show();
            this.cartService.forceRecalculation = false;
            super.init();
        }

        getCart(isInit?: boolean): void {
            this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
            if (this.$localStorage.get("hasRestrictedProducts") === true.toString()) {
                this.cartService.expand += ",restrictions";
            }
            this.cartService.forceRecalculation = true;
            this.cartService.getCart(this.cartId).then(
                (cart: CartModel) => {
                    this.getCartCompleted(cart, isInit);
                    if (isInit) {
                        this.postInit(cart);
                    }
                },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getCartCompleted(cart: CartModel, isInit: boolean): void {
            super.getCartCompleted(cart, isInit);

            var paymentMethod: Insite.Cart.Services.Dtos.PaymentMethodDto,
                sourcecode: string; //BUSA-717
            //Change for BUSA- 402
            //Earlier tax was commented but in case of new user it was not calculating tax, hence added tax calculation back.
                // save transients
                if (this.cart && this.cart.paymentOptions) {
                    paymentMethod = this.cart.paymentMethod;
                    this.saveCheckBox = this.cart.paymentOptions.storePaymentProfile;
                    sourcecode = this.cart.properties['salesSourceCode']; //BUSA-717
                    //BUSA 599 : Save card info checkbox gets unchecked when user changes the shipping method.
                }
                // BUSA-463 : To retain frequency on shipping method change.
                this.saveFrequencyReload = this.cart.properties['subscriptionFrequencyOpted'];
                this.checkoutNextShipDate = this.cart.properties['checkoutNextShipDate'];
                // BUSA-761 : Add name for Smart Supply order and force users enter a name while placing order(Retaining here).
                this.saveSubscriptionName = this.cart.properties['subscriptionName'];

                // restore transients
                if (paymentMethod) {
                    this.cart.paymentOptions.storePaymentProfile = this.saveCheckBox; //BUSA 599 : Save card info checkbox gets unchecked when user changes the shipping method.
                }
                // BUSA-463 : To retain frequency on shipping method change.
                this.cart.properties['subscriptionFrequencyOpted'] = this.saveFrequencyReload;
                // BUSA-761 : Add name for Smart Supply order and force users enter a name while placing order(Retaining here).
                this.cart.properties['checkoutNextShipDate'] = this.checkoutNextShipDate;
                this.cart.properties['subscriptionName'] = this.saveSubscriptionName;
                this.cart.properties['salesSourceCode'] = sourcecode;//BUSA-717

                //BUSA-599 start : Save card info checkbox gets unchecked when user changes the shipping method.
                var selectedMethod = "";
                if (this.cart.properties["defaultCardId"] != null && isInit) {
                    selectedMethod = this.cart.properties["defaultCardId"];
                }
                else {
                    if (paymentMethod != null || this.cart.paymentMethod != null) {//BUSA-783 : SmartSupply frequency drop down is not visible for specific customers on checkout payment page.
                        selectedMethod = paymentMethod.name || this.cart.paymentMethod.name;
                    }
                }
                //BUSA-1350: chrome performance issue, no need for this call its already getting called from super.getCartCompleted method.
                //this.promotionService.getCartPromotions("current").then((result: PromotionCollectionModel) => {
                //    this.promotions = result.promotions;
                //});

                if (this.cart.properties["subscriptionFrequency"] != null) {
                    this.subscriptionFrequency = JSON.parse(this.cart.properties["subscriptionFrequency"]);
                }
        }
        //BUSA-1082: SS Section Missing
        postInit(cart: CartModel) {
                var shippingCost = cart.shippingAndHandling;
                var fobCode = cart.properties["fobCode"];
                var defaultCarrierId = cart.properties["defaultCarrierId"];
                var custDefaultCarrierId = cart.properties["custDefaultCarrierId"];
                //var custDefaultCarrierCode = cart.properties["custDefaultCarrier"];
                var corpGroupId = cart.properties["corpGroupId"];
                //BUSA - 660: To make PO number mandatory for a specific Customer Class.
                //var PORequired = cart.properties["poNumRequired"];
                var corpGroupThresholds = [];
                cart.properties['checkoutNextShipDate'] = new Date().toDateString() //BUSA-871: preset calendar with current date.
                if (cart.carrier && cart.carrier.shipVias) {

                    this.custDefaultCarrierId = custDefaultCarrierId != "none" ? custDefaultCarrierId : defaultCarrierId;
                    var newCarrier = cart.carrier;
                    // FOB Code 02
                    if (fobCode == "02") {
                        if (this.custDefaultCarrierId != "none") {
                            cart.carriers.forEach(carrier => {
                                carrier.shipVias.forEach(shipVia => {
                                    if (shipVia.id == this.custDefaultCarrierId) {
                                        newCarrier = carrier;
                                    }
                                });
                            });
                            cart.carrier = newCarrier;
                            cart.shipVia = cart.carrier.shipVias.filter(sv => sv.id == this.custDefaultCarrierId)[0];
                        } else {
                            cart.carriers.forEach(carrier => {
                                carrier.shipVias.forEach(shipVia => {
                                    if (shipVia.isDefault) {
                                        newCarrier = carrier;
                                    }
                                });
                            });
                            //this.custDefaultCarrierId = defaultCarrierId;
                            cart.carrier = newCarrier;
                            cart.shipVia = cart.carrier.shipVias.filter(sv => sv.isDefault)[0];
                        }
                        shippingCost = 0;
                        this.freeShipping = true;
                    } // FOB Code not 02 or empty
                    else if (cart.orderSubTotal > 0 && fobCode != "") {
                        var corpGroupThresholdsSetting = cart.properties["corporateGroupThresholds"];
                        if (corpGroupThresholdsSetting != null && corpGroupThresholdsSetting != "") {
                            var array = corpGroupThresholdsSetting.split(";");
                            var tuples = [];
                            for (var i in array) {
                                var group = array[i].split(",")[0];
                                var threshold = array[i].split(",")[1];
                                var tuple = [group, threshold];
                                tuples.push(tuple);
                            }
                            if (tuples.length > 0) {
                                corpGroupThresholds = tuples;
                            }
                        }
                        if (corpGroupId != "none" && corpGroupThresholds.length > 0) {
                            var corpGroupThreshold = corpGroupThresholds.filter(cgt => cgt[0] == corpGroupId)[0][1];
                            // Customer belongs to corporate group and order total above group threshold
                            if (cart.orderSubTotal >= (corpGroupThreshold)) {
                                shippingCost = 0;
                                this.freeShipping = true;
                                cart.carriers.forEach(carrier => {
                                    carrier.shipVias.forEach(shipVia => {
                                        if (shipVia.id == this.custDefaultCarrierId) {
                                            newCarrier = carrier;
                                        }
                                    });
                                });
                                cart.carrier = newCarrier;
                                cart.shipVia = cart.carrier.shipVias.filter(sv => sv.id == this.custDefaultCarrierId)[0];
                            } // Customer belongs to corporate group and order total below group threshold
                            else {
                                if (this.custDefaultCarrierId != "none") {
                                    cart.carriers.forEach(carrier => {
                                        carrier.shipVias.forEach(shipVia => {
                                            if (shipVia.id == this.custDefaultCarrierId) {
                                                newCarrier = carrier;
                                            }
                                        });
                                    });
                                    cart.carrier = newCarrier;
                                    cart.shipVia = cart.carrier.shipVias.filter(sv => sv.id == this.custDefaultCarrierId)[0];
                                    this.freeShipping = false;
                                }
                            }
                        } // Customer does not belong to any corporate group
                        else {
                            if (this.custDefaultCarrierId != "none") {
                                cart.carriers.forEach(carrier => {
                                    carrier.shipVias.forEach(shipVia => {
                                        if (shipVia.id == this.custDefaultCarrierId) {
                                            newCarrier = carrier;
                                        }
                                    });
                                });
                                cart.carrier = newCarrier;
                                cart.shipVia = cart.carrier.shipVias.filter(sv => sv.id == this.custDefaultCarrierId)[0];
                                this.freeShipping = false;
                            }
                        }
                    } // Order amount is $0.00
                    else if (cart.orderSubTotal == 0) {
                    //shippingCost = 0;       //BUSA-1170 commenting code ,Shipping was free when subtotal equals zero.
                    //this.freeShipping = true;
                    }
                    cart.shippingAndHandling = shippingCost;
                    this.cart = cart;
                    this.updateShipVia();

                    //BUSA-599 start : Save card info checkbox gets unchecked when user changes the shipping method.
                    var paymentMethod: Insite.Cart.Services.Dtos.PaymentMethodDto;
                    if (this.cart && this.cart.paymentOptions) {
                        paymentMethod = this.cart.paymentMethod;
                    }

                    var selectedMethod = "";
                    if (this.cart.properties["defaultCardId"] != null) {
                        selectedMethod = this.cart.properties["defaultCardId"];
                    }
                    else {
                        if (paymentMethod != null || this.cart.paymentMethod != null) {//BUSA-783 : SmartSupply frequency drop down is not visible for specific customers on checkout payment page.
                            selectedMethod = paymentMethod.name || this.cart.paymentMethod.name;
                        }
                    }
                    //BUSA-1161
                    //this.setUpPaymentMethod(isInit, this.cart.paymentMethod);
                    if (selectedMethod) {
                        this.cart.paymentOptions.paymentMethods.forEach(paymentMethod => {
                            if (paymentMethod.name === selectedMethod) {
                                this.cart.paymentMethod = paymentMethod;
                            }
                        });
                    }
                    //BUSA-599 end : Save card info checkbox gets unchecked when user changes the shipping method.
                }

                // Start-BUSA-463 Force user to save CC if cartline is subscribed
                cart.cartLines.some(cartline => {
                    if (cartline.properties['isSubscriptionOpted'] != null) {
                        if (cartline.properties['isSubscriptionOpted'].toUpperCase() == 'TRUE') {
                            this.isSubscribed = true;
                            return true;
                        }
                    }
                })
                this.spinnerService.hide();
        }

        protected updateShipViaFailed(error: any): void { //BUSA-1170
            this.errorMessage = error.message;
        }

        protected setUpShipVia(isInit: boolean): void {
            if (this.cart.carrier && this.cart.carrier.shipVias) {
                this.cart.carrier.shipVias.forEach(shipVia => {
                    if (shipVia.id === this.cart.shipVia.id) {
                        this.cart.shipVia = shipVia;
                        if (this.freeShipping && (shipVia.id == this.custDefaultCarrierId || shipVia.isDefault)) {
                            this.cart.orderGrandTotal -= this.cart.shippingAndHandling;
                            this.cart.orderGrandTotalDisplay = this.cart.orderGrandTotal
                                .toLocaleString("en-US", { style: "currency", currency: "USD" });
                            this.cart.shippingAndHandling = 0;
                            this.cart.shippingAndHandlingDisplay = this.cart.shippingAndHandling
                                .toLocaleString("en-US", { style: "currency", currency: "USD" });
                        }
                    }
                });
            }
        }

        // Submit order
        submit(submitSuccessUri: string, signInUri: string) {
            var isOnAccount: boolean;
            this.submitting = true;
            this.submitErrorMessage = "";
            var valid = $("#reviewAndPayForm").validate().form();
            if (!valid) {
                $("html, body").animate({
                    scrollTop: $("#reviewAndPayForm").offset().top
                }, 300);
                this.submitting = false;
            }

            if (!this.isIncludeInitialSS) {
                var paymentMethod = $("#paymentMethod option:selected").text();
                if (paymentMethod == "Credit Card" && !this.isIncludeInitialSS) //User cannot place order if it is not initial SS order & it does not have any saved CC.
                {
                    this.submitErrorMessage = 'You cannot place this Order with new Card';
                    this.submitting = false;
                    return;
                }
                valid = this.updateCheckoutShipDate();//BUSA-781: validation on date for future SS order
                this.cart.properties["excludeInitialSS"] = "true"; //BUSA-781 added check to identify Initial SS Order
            }
            else {
                this.cart.properties['checkoutNextShipDate'] = new Date().toDateString();
                this.cart.properties["excludeInitialSS"] = "false";
            }

            if (this.showPopUp) {
                var $popup = angular.element("#smartSupplyPopUp");
                this.coreService.displayModal($popup);
                this.submitting = false;
                return;
            }

            //BUSA-833 : Validating Source Code
            var sourceCode = this.cart.properties['salesSourceCode'];
            if (sourceCode != undefined) {
                //BUSA-888 : Space not valid for source code
                sourceCode = sourceCode.trim();
                var result = this.cart.properties["orderSourceCode"];
                this.parsedSourceCodes = JSON.parse(result);
                var sourceCodeCount = this.parsedSourceCodes.length;
                var invalidCount = 0;
                this.parsedSourceCodes.forEach(x => {
                    if (sourceCode != "") {
                        if (x.OSCODE.toLowerCase() != sourceCode.toLowerCase()) {
                            invalidCount++;
                        }
                    }
                });
                if (invalidCount == sourceCodeCount) {
                    $("#validateSourceCode").text("Please Enter Valid Source Code");
                    $("#validateSourceCode").show();
                    valid = false;
                }
                else {
                    $("#validateSourceCode").hide();
                }
            }

            // BUSA-463 : Subscription. Mandate user to save CC for subscription order.
            if (!this.cart.requiresApproval) {
                if (this.isSubscribed) {
                    if (this.cart.paymentMethod.name == "CC" && !this.cart.paymentOptions.storePaymentProfile) {
                        this.submitErrorMessage = 'Please Save Credit Card for SmartSupply order';
                        this.submitting = false;
                        return;
                    }
                }

            }
            // End-BUSA-463 Force user to save CC if cartline is subscribed
            //BUSA_618: Checkout Payment Page: Please enter at least 3 characters error message is displayed for American Express Credit Card start.
            if (this.cart.paymentMethod.isPaymentProfile && !this.cart.requiresApproval) {
                var cardRegEx = null;
                var cardCVVRegEx = null;
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

                //BUSA-933 : Invalid Postal Code
                if (!this.cart.paymentOptions.creditCard.useBillingAddress) {
                    var postalCode = this.cart.paymentOptions.creditCard.postalCode;
                    //BUSA-1099 : CA website specific: User is not able to add new billing address due to postal code error
                    if (this.cart.paymentOptions.creditCard.country.toLowerCase() == "united states") {
                        var isValidPostalCode = /^\d{5}(-\d{4})?(?!-)$/.test(postalCode);
                    }
                    else {
                        var isValidPostalCode = /^((?:[a-zA-Z][0-9][a-zA-Z])\s[0-9][a-zA-Z][0-9])$/.test(postalCode);
                    }
                    //BUSA-1099 End
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
                //BUSA-933 : Invalid Postal Code
            }

            if (this.cart.paymentMethod.isCreditCard) {
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
            }


            // start BUSA-366
            if (this.cart.paymentMethod.isCreditCard) {
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
            // END BUSA-366

            //Changes as per ticket BUSA- 307 Starts
            //BUSA - 660: To make PO number mandatory for a specific Customer Class start.
            if (!this.cart.poNumber && (!this.cart.requiresApproval)) {
                if (this.cart.properties["poNumRequired"] == "false" && valid) {
                    this.cart.poNumber = "None provided";
                    if (this.isSubscribed) { //BUSA-1313:  PO for SmartSupply Orders
                        this.cart.poNumber = "SmartSupply";
                    }
                    valid = true;
                } else {
                    valid = false;
                }
                //BUSA - 660: To make PO number mandatory for a specific Customer Class end.
            }
            //Changes as per ticket BUSA- 307 Ends
            //BUSA-471 : Place order button disappears after no payment method is selected Starts
            //TODO: use angular validation
            if (!valid) {
                $("html, body").animate({
                    scrollTop: $("#reviewAndPayForm").offset().top
                }, 300);
                this.submitting = false;
                return;
            }
            //BUSA-471 : Place order button disappears after no payment method is selected Ends

            this.sessionService.getIsAuthenticated()
                .then((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        if (this.cart.requiresApproval) {
                            this.cart.status = "AwaitingApproval";
                        }
                        else if (!this.isIncludeInitialSS) {
                            this.cart.status = "CreateSmartSupply";
                        } else {
                            this.cart.status = "Submitted";
                        }
                        this.spinnerService.show("mainLayout", true);
                        //Start BUSA- 400 changes
                        this.cart.requiresPoNumber = false;
                        //End BUSA- 400 changes

                        //BUSA-573 --Commented GTM
                        //*********Google Tag Manager measuring reviewandpay  *****************
                        var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
                        var optionType;
                        if (this.cart.paymentOptions.creditCard.cardType != null) { optionType = this.cart.paymentOptions.creditCard.cardType }
                        else { optionType = this.cart.paymentMethod.name }
                        if (window.hasOwnProperty("dataLayer")) {
                            var data = {
                                "event": "checkoutOption",
                                'ecommerce': {
                                    'checkout_option': {
                                        'actionField': { 'step': 2, 'option': optionType },
                                        "products": []
                                    }
                                }
                            };

                            for (var key in this.cart.cartLines) {
                                var cartLine = this.cart.cartLines[key];
                                data.ecommerce.checkout_option.products.push({
                                    "id": cartLine.erpNumber,
                                    "name": cartLine.shortDescription,
                                    "price": cartLine.pricing ? cartLine.pricing.actualPrice : 0,
                                    "quantity": cartLine.qtyOrdered,
                                    "variant": cartLine.unitOfMeasure,
                                    "brand": "Brasseler"
                                });
                            }

                            window["dataLayer"].push(data);
                        }
                        if (this.promotions != null) {
                            if (window.hasOwnProperty("dataLayer")) {
                                var promo = {
                                    'event': 'promotions',
                                    'ecommerce': {
                                        'promo': {
                                            'promotions': []
                                        }
                                    }
                                };
                                for (var key in this.promotions) {
                                    var promoObj = this.promotions[key];
                                    if (promoObj.amount > 0) {
                                        promo.ecommerce.promo.promotions.push({
                                            "id": promoObj.promotionCode,
                                            "name": promoObj.name,
                                            "revenue": promoObj.amount
                                        });
                                        window["dataLayer"].push(promo);
                                    }
                                }
                            }
                        }

                        this.cartService.updateCart(this.cart, true).then(result => {
                            this.cart.id = result.id;
                            this.$window.location.href = submitSuccessUri + "?cartid=" + this.cart.id;
                        }).catch(error => {
                            this.submitting = false;
                            this.cart.paymentOptions.isPayPal = false;

                            this.submitErrorMessage = error.message;
                            var outOfStockProductsListMain = this.submitErrorMessage.split("-");
                            var outOfStockProductsList = (outOfStockProductsListMain != null && outOfStockProductsListMain.length > 0) ? outOfStockProductsListMain[1].split(",") : "";
                            if (this.submitErrorMessage.indexOf("Inventory") > -1 && outOfStockProductsList != null && outOfStockProductsList.length > 0) {
                                for (var i = 0; i < this.cart.cartLines.length; i++) {
                                    for (var j = 0; j < outOfStockProductsList.length; j++) {
                                        if (outOfStockProductsList[j] == this.cart.cartLines[i].erpNumber) {
                                            this.cart.cartLines[i].hasInsufficientInventory = true;
                                        }
                                    }
                                }
                            }

                            this.spinnerService.hide();
                        });
                    } else {
                        this.$window.location.href = signInUri + "?returnUrl=" + this.$window.location.href;
                    }
                });
        }

        // Pay with PayPal
        submitPaypal(returnUrl: string, signInUrl: string) {
            this.submitErrorMessage = "";
            $("#pmnt").hide();
            var valid = $("#reviewAndPayForm").validate().form();
            if (!valid) {
                $("html, body").animate({
                    scrollTop: $("#reviewAndPayForm").offset().top
                }, 300);
                $("#pmnt").show();
                return;
            }
            this.sessionService.getIsAuthenticated()
                .then((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        this.spinnerService.show("mainLayout", true);
                        this.cart.paymentOptions.isPayPal = true;
                        this.cart.paymentOptions.payPalPaymentUrl = this.$window.location.host + returnUrl;
                        this.cart.paymentMethod = null;
                        this.cart.status = "PaypalSetup";
                        this.cartService.updateCart(this.cart, true).then(result => {
                            this.$window.location.href = result.paymentOptions.payPalPaymentUrl;
                        }).catch(error => {
                            $("#pmnt").show();
                            this.cart.paymentOptions.isPayPal = false;
                            this.submitErrorMessage = error.message;
                            this.spinnerService.hide();
                        });
                    } else {
                        this.$window.location.href = signInUrl + "?returnUrl=" + this.$window.location.href;
                    }
                });
        }

        // BUSA-463 : Subscription. Sorting frequency
        sortFilter(input: any) {
            return parseInt(input.value);
        }

        //BUSA-843 : Initial Order as SS or not
        changeSmartSupply() {
            //BUSA-1184 Code Added to restrict Non-SS product is submitted as Smart Supply
            this.cartService.expand = "cartlines";	
            this.cartService.getCart(this.cartId).then(cart => {
                if (!this.isIncludeInitialSS) {
                    cart.cartLines.forEach(ss => {
                        if (ss.properties["isSubscriptionOpted"] == undefined) {
                            this.showPopUp = true;
                        }
                    });
                }
                else {
                    this.showPopUp = false;
                }
            });
        }
        //BUSA-843 : Initial Order as SS or not

        updateCheckoutShipDate(): boolean {
            if (!(this.cart.properties['checkoutNextShipDate']) && typeof this.cart.properties['checkoutNextShipDate']) {
                this.error = "Next Ship Date Cannot Be Empty.";
                return false;
            }
            var currentDate = new Date();
            if (new Date(this.cart.properties['checkoutNextShipDate']) <= currentDate) {
                this.error = "Next Ship Date Cannot Be Less Than Or Equals To Current Date.";
                return false;
            }
            this.error = "";
            return true;
        }

        applyPromotion(): void {
            this.spinnerService.show("mainLayout", true);
            this.promotionAppliedMessage = "";
            this.promotionErrorMessage = "";

            this.promotionService.applyCartPromotion(this.cartId, this.promotionCode).then(
                (promotion: PromotionModel) => { this.applyPromotionCompleted(promotion); },
                (error: any) => { this.applyPromotionFailed(error); });
        }

        protected applyPromotionCompleted(promotion: PromotionModel): void {
            if (promotion.promotionApplied) {
                this.spinnerService.hide();
                this.promotionAppliedMessage = promotion.message;
            } else {
                this.spinnerService.hide();
                this.promotionErrorMessage = promotion.message;
            }

            this.getCart();
        }

        protected applyPromotionFailed(error: any): void {
            this.spinnerService.hide();
            this.promotionErrorMessage = error.message;
            this.getCart();
        }

        //BUSA-833 : Source Code in Order Ingest
        getSourceCodes() {
            this.showDropdown = true;
            var result = this.cart.properties["orderSourceCode"];
            this.parsedSourceCodes = JSON.parse(result);
        }

    }

    angular
        .module("insite")
        .controller("ReviewAndPayController", BrasselerReviewAndPayController);
}