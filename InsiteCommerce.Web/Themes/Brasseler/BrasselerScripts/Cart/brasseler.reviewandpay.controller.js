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
    var cart;
    (function (cart_1) {
        "use strict";
        var BrasselerReviewAndPayController = /** @class */ (function (_super) {
            __extends(BrasselerReviewAndPayController, _super);
            function BrasselerReviewAndPayController($scope, $window, cartService, promotionService, sessionService, coreService, spinnerService, $attrs, settingsService, queryString, $localStorage, websiteService) {
                var _this = _super.call(this, $scope, $window, cartService, promotionService, sessionService, coreService, spinnerService, $attrs, settingsService, queryString, $localStorage, websiteService) || this;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.cartService = cartService;
                _this.promotionService = promotionService;
                _this.sessionService = sessionService;
                _this.coreService = coreService;
                _this.spinnerService = spinnerService;
                _this.$attrs = $attrs;
                _this.settingsService = settingsService;
                _this.queryString = queryString;
                _this.$localStorage = $localStorage;
                _this.websiteService = websiteService;
                _this.isSubscribed = false;
                _this.isIncludeInitialSS = true;
                _this.showPopUp = false;
                _this.cartModelBrasseler = null;
                _this.showSaveCardInfo = true;
                _this.newWebShopperCustomerNumber = "1055357";
                return _this;
                //super.init();
            }
            BrasselerReviewAndPayController.prototype.init = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) {
                    if (session != null && session != undefined && session.billTo) {
                        if (String(session.billTo.customerNumber).includes(_this.newWebShopperCustomerNumber)) {
                            _this.showSaveCardInfo = false;
                        }
                    }
                });
                this.freeShipping = false;
                this.spinnerService.show();
                this.cartService.forceRecalculation = false;
                _super.prototype.init.call(this);
            };
            BrasselerReviewAndPayController.prototype.getCart = function (isInit) {
                var _this = this;
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
                if (this.$localStorage.get("hasRestrictedProducts") === true.toString()) {
                    this.cartService.expand += ",restrictions";
                }
                this.cartService.forceRecalculation = true;
                this.cartService.getCart(this.cartId).then(function (cart) {
                    _this.getCartCompleted(cart, isInit);
                    if (isInit) {
                        _this.postInit(cart);
                    }
                }, function (error) { _this.getCartFailed(error); });
            };
            BrasselerReviewAndPayController.prototype.getCartCompleted = function (cart, isInit) {
                _super.prototype.getCartCompleted.call(this, cart, isInit);
                var paymentMethod, sourcecode; //BUSA-717
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
                this.cart.properties['salesSourceCode'] = sourcecode; //BUSA-717
                //BUSA-599 start : Save card info checkbox gets unchecked when user changes the shipping method.
                var selectedMethod = "";
                if (this.cart.properties["defaultCardId"] != null && isInit) {
                    selectedMethod = this.cart.properties["defaultCardId"];
                }
                else {
                    if (paymentMethod != null || this.cart.paymentMethod != null) { //BUSA-783 : SmartSupply frequency drop down is not visible for specific customers on checkout payment page.
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
            };
            //BUSA-1082: SS Section Missing
            BrasselerReviewAndPayController.prototype.postInit = function (cart) {
                var _this = this;
                var shippingCost = cart.shippingAndHandling;
                var fobCode = cart.properties["fobCode"];
                var defaultCarrierId = cart.properties["defaultCarrierId"];
                var custDefaultCarrierId = cart.properties["custDefaultCarrierId"];
                //var custDefaultCarrierCode = cart.properties["custDefaultCarrier"];
                var corpGroupId = cart.properties["corpGroupId"];
                //BUSA - 660: To make PO number mandatory for a specific Customer Class.
                //var PORequired = cart.properties["poNumRequired"];
                var corpGroupThresholds = [];
                cart.properties['checkoutNextShipDate'] = new Date().toDateString(); //BUSA-871: preset calendar with current date.
                if (cart.carrier && cart.carrier.shipVias) {
                    this.custDefaultCarrierId = custDefaultCarrierId != "none" ? custDefaultCarrierId : defaultCarrierId;
                    var newCarrier = cart.carrier;
                    // FOB Code 02
                    if (fobCode == "02") {
                        if (this.custDefaultCarrierId != "none") {
                            cart.carriers.forEach(function (carrier) {
                                carrier.shipVias.forEach(function (shipVia) {
                                    if (shipVia.id == _this.custDefaultCarrierId) {
                                        newCarrier = carrier;
                                    }
                                });
                            });
                            cart.carrier = newCarrier;
                            cart.shipVia = cart.carrier.shipVias.filter(function (sv) { return sv.id == _this.custDefaultCarrierId; })[0];
                        }
                        else {
                            cart.carriers.forEach(function (carrier) {
                                carrier.shipVias.forEach(function (shipVia) {
                                    if (shipVia.isDefault) {
                                        newCarrier = carrier;
                                    }
                                });
                            });
                            //this.custDefaultCarrierId = defaultCarrierId;
                            cart.carrier = newCarrier;
                            cart.shipVia = cart.carrier.shipVias.filter(function (sv) { return sv.isDefault; })[0];
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
                            var corpGroupThreshold = corpGroupThresholds.filter(function (cgt) { return cgt[0] == corpGroupId; })[0][1];
                            // Customer belongs to corporate group and order total above group threshold
                            if (cart.orderSubTotal >= (corpGroupThreshold)) {
                                shippingCost = 0;
                                this.freeShipping = true;
                                cart.carriers.forEach(function (carrier) {
                                    carrier.shipVias.forEach(function (shipVia) {
                                        if (shipVia.id == _this.custDefaultCarrierId) {
                                            newCarrier = carrier;
                                        }
                                    });
                                });
                                cart.carrier = newCarrier;
                                cart.shipVia = cart.carrier.shipVias.filter(function (sv) { return sv.id == _this.custDefaultCarrierId; })[0];
                            } // Customer belongs to corporate group and order total below group threshold
                            else {
                                if (this.custDefaultCarrierId != "none") {
                                    cart.carriers.forEach(function (carrier) {
                                        carrier.shipVias.forEach(function (shipVia) {
                                            if (shipVia.id == _this.custDefaultCarrierId) {
                                                newCarrier = carrier;
                                            }
                                        });
                                    });
                                    cart.carrier = newCarrier;
                                    cart.shipVia = cart.carrier.shipVias.filter(function (sv) { return sv.id == _this.custDefaultCarrierId; })[0];
                                    this.freeShipping = false;
                                }
                            }
                        } // Customer does not belong to any corporate group
                        else {
                            if (this.custDefaultCarrierId != "none") {
                                cart.carriers.forEach(function (carrier) {
                                    carrier.shipVias.forEach(function (shipVia) {
                                        if (shipVia.id == _this.custDefaultCarrierId) {
                                            newCarrier = carrier;
                                        }
                                    });
                                });
                                cart.carrier = newCarrier;
                                cart.shipVia = cart.carrier.shipVias.filter(function (sv) { return sv.id == _this.custDefaultCarrierId; })[0];
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
                    var paymentMethod;
                    if (this.cart && this.cart.paymentOptions) {
                        paymentMethod = this.cart.paymentMethod;
                    }
                    var selectedMethod = "";
                    if (this.cart.properties["defaultCardId"] != null) {
                        selectedMethod = this.cart.properties["defaultCardId"];
                    }
                    else {
                        if (paymentMethod != null || this.cart.paymentMethod != null) { //BUSA-783 : SmartSupply frequency drop down is not visible for specific customers on checkout payment page.
                            selectedMethod = paymentMethod.name || this.cart.paymentMethod.name;
                        }
                    }
                    //BUSA-1161
                    //this.setUpPaymentMethod(isInit, this.cart.paymentMethod);
                    if (selectedMethod) {
                        this.cart.paymentOptions.paymentMethods.forEach(function (paymentMethod) {
                            if (paymentMethod.name === selectedMethod) {
                                _this.cart.paymentMethod = paymentMethod;
                            }
                        });
                    }
                    //BUSA-599 end : Save card info checkbox gets unchecked when user changes the shipping method.
                }
                // Start-BUSA-463 Force user to save CC if cartline is subscribed
                cart.cartLines.some(function (cartline) {
                    if (cartline.properties['isSubscriptionOpted'] != null) {
                        if (cartline.properties['isSubscriptionOpted'].toUpperCase() == 'TRUE') {
                            _this.isSubscribed = true;
                            return true;
                        }
                    }
                });
                this.spinnerService.hide();
            };
            BrasselerReviewAndPayController.prototype.updateShipViaFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerReviewAndPayController.prototype.setUpShipVia = function (isInit) {
                var _this = this;
                if (this.cart.carrier && this.cart.carrier.shipVias) {
                    this.cart.carrier.shipVias.forEach(function (shipVia) {
                        if (shipVia.id === _this.cart.shipVia.id) {
                            _this.cart.shipVia = shipVia;
                            if (_this.freeShipping && (shipVia.id == _this.custDefaultCarrierId || shipVia.isDefault)) {
                                _this.cart.orderGrandTotal -= _this.cart.shippingAndHandling;
                                _this.cart.orderGrandTotalDisplay = _this.cart.orderGrandTotal
                                    .toLocaleString("en-US", { style: "currency", currency: "USD" });
                                _this.cart.shippingAndHandling = 0;
                                _this.cart.shippingAndHandlingDisplay = _this.cart.shippingAndHandling
                                    .toLocaleString("en-US", { style: "currency", currency: "USD" });
                            }
                        }
                    });
                }
            };
            // Submit order
            BrasselerReviewAndPayController.prototype.submit = function (submitSuccessUri, signInUri) {
                var _this = this;
                var isOnAccount;
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
                    valid = this.updateCheckoutShipDate(); //BUSA-781: validation on date for future SS order
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
                    this.parsedSourceCodes.forEach(function (x) {
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
                    }
                    else {
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
                    .then(function (isAuthenticated) {
                    if (isAuthenticated) {
                        if (_this.cart.requiresApproval) {
                            _this.cart.status = "AwaitingApproval";
                        }
                        else if (!_this.isIncludeInitialSS) {
                            _this.cart.status = "CreateSmartSupply";
                        }
                        else {
                            _this.cart.status = "Submitted";
                        }
                        _this.spinnerService.show("mainLayout", true);
                        //Start BUSA- 400 changes
                        _this.cart.requiresPoNumber = false;
                        //End BUSA- 400 changes
                        //BUSA-573 --Commented GTM
                        //*********Google Tag Manager measuring reviewandpay  *****************
                        var dataLayer = window.dataLayer = window.dataLayer || [];
                        var optionType;
                        if (_this.cart.paymentOptions.creditCard.cardType != null) {
                            optionType = _this.cart.paymentOptions.creditCard.cardType;
                        }
                        else {
                            optionType = _this.cart.paymentMethod.name;
                        }
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
                            for (var key in _this.cart.cartLines) {
                                var cartLine = _this.cart.cartLines[key];
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
                        if (_this.promotions != null) {
                            if (window.hasOwnProperty("dataLayer")) {
                                var promo = {
                                    'event': 'promotions',
                                    'ecommerce': {
                                        'promo': {
                                            'promotions': []
                                        }
                                    }
                                };
                                for (var key in _this.promotions) {
                                    var promoObj = _this.promotions[key];
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
                        _this.cartService.updateCart(_this.cart, true).then(function (result) {
                            _this.cart.id = result.id;
                            _this.$window.location.href = submitSuccessUri + "?cartid=" + _this.cart.id;
                        }).catch(function (error) {
                            _this.submitting = false;
                            _this.cart.paymentOptions.isPayPal = false;
                            _this.submitErrorMessage = error.message;
                            var outOfStockProductsListMain = _this.submitErrorMessage.split("-");
                            var outOfStockProductsList = (outOfStockProductsListMain != null && outOfStockProductsListMain.length > 0) ? outOfStockProductsListMain[1].split(",") : "";
                            if (_this.submitErrorMessage.indexOf("Inventory") > -1 && outOfStockProductsList != null && outOfStockProductsList.length > 0) {
                                for (var i = 0; i < _this.cart.cartLines.length; i++) {
                                    for (var j = 0; j < outOfStockProductsList.length; j++) {
                                        if (outOfStockProductsList[j] == _this.cart.cartLines[i].erpNumber) {
                                            _this.cart.cartLines[i].hasInsufficientInventory = true;
                                        }
                                    }
                                }
                            }
                            _this.spinnerService.hide();
                        });
                    }
                    else {
                        _this.$window.location.href = signInUri + "?returnUrl=" + _this.$window.location.href;
                    }
                });
            };
            // Pay with PayPal
            BrasselerReviewAndPayController.prototype.submitPaypal = function (returnUrl, signInUrl) {
                var _this = this;
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
                    .then(function (isAuthenticated) {
                    if (isAuthenticated) {
                        _this.spinnerService.show("mainLayout", true);
                        _this.cart.paymentOptions.isPayPal = true;
                        _this.cart.paymentOptions.payPalPaymentUrl = _this.$window.location.host + returnUrl;
                        _this.cart.paymentMethod = null;
                        _this.cart.status = "PaypalSetup";
                        _this.cartService.updateCart(_this.cart, true).then(function (result) {
                            _this.$window.location.href = result.paymentOptions.payPalPaymentUrl;
                        }).catch(function (error) {
                            $("#pmnt").show();
                            _this.cart.paymentOptions.isPayPal = false;
                            _this.submitErrorMessage = error.message;
                            _this.spinnerService.hide();
                        });
                    }
                    else {
                        _this.$window.location.href = signInUrl + "?returnUrl=" + _this.$window.location.href;
                    }
                });
            };
            // BUSA-463 : Subscription. Sorting frequency
            BrasselerReviewAndPayController.prototype.sortFilter = function (input) {
                return parseInt(input.value);
            };
            //BUSA-843 : Initial Order as SS or not
            BrasselerReviewAndPayController.prototype.changeSmartSupply = function () {
                var _this = this;
                //BUSA-1184 Code Added to restrict Non-SS product is submitted as Smart Supply
                this.cartService.expand = "cartlines";
                this.cartService.getCart(this.cartId).then(function (cart) {
                    if (!_this.isIncludeInitialSS) {
                        cart.cartLines.forEach(function (ss) {
                            if (ss.properties["isSubscriptionOpted"] == undefined) {
                                _this.showPopUp = true;
                            }
                        });
                    }
                    else {
                        _this.showPopUp = false;
                    }
                });
            };
            //BUSA-843 : Initial Order as SS or not
            BrasselerReviewAndPayController.prototype.updateCheckoutShipDate = function () {
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
            };
            BrasselerReviewAndPayController.prototype.applyPromotion = function () {
                var _this = this;
                this.spinnerService.show("mainLayout", true);
                this.promotionAppliedMessage = "";
                this.promotionErrorMessage = "";
                this.promotionService.applyCartPromotion(this.cartId, this.promotionCode).then(function (promotion) { _this.applyPromotionCompleted(promotion); }, function (error) { _this.applyPromotionFailed(error); });
            };
            BrasselerReviewAndPayController.prototype.applyPromotionCompleted = function (promotion) {
                if (promotion.promotionApplied) {
                    this.spinnerService.hide();
                    this.promotionAppliedMessage = promotion.message;
                }
                else {
                    this.spinnerService.hide();
                    this.promotionErrorMessage = promotion.message;
                }
                this.getCart();
            };
            BrasselerReviewAndPayController.prototype.applyPromotionFailed = function (error) {
                this.spinnerService.hide();
                this.promotionErrorMessage = error.message;
                this.getCart();
            };
            //BUSA-833 : Source Code in Order Ingest
            BrasselerReviewAndPayController.prototype.getSourceCodes = function () {
                this.showDropdown = true;
                var result = this.cart.properties["orderSourceCode"];
                this.parsedSourceCodes = JSON.parse(result);
            };
            BrasselerReviewAndPayController.$inject = [
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
            return BrasselerReviewAndPayController;
        }(cart_1.ReviewAndPayController));
        cart_1.BrasselerReviewAndPayController = BrasselerReviewAndPayController;
        angular
            .module("insite")
            .controller("ReviewAndPayController", BrasselerReviewAndPayController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.reviewandpay.controller.js.map