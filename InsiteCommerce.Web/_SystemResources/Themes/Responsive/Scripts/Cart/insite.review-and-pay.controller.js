var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var ReviewAndPayController = /** @class */ (function () {
            function ReviewAndPayController($scope, $window, cartService, promotionService, sessionService, coreService, spinnerService, $attrs, settingsService, queryString, $localStorage, websiteService, deliveryMethodPopupService, selectPickUpLocationPopupService) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.promotionService = promotionService;
                this.sessionService = sessionService;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.$attrs = $attrs;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.$localStorage = $localStorage;
                this.websiteService = websiteService;
                this.deliveryMethodPopupService = deliveryMethodPopupService;
                this.selectPickUpLocationPopupService = selectPickUpLocationPopupService;
                this.pageIsReady = false;
            }
            ReviewAndPayController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("cartChanged", function (event) { return _this.onCartChanged(event); });
                this.cartUrl = this.$attrs.cartUrl;
                this.cartId = this.queryString.get("cartId") || "current";
                this.getCart(true);
                $("#reviewAndPayForm").validate();
                this.$scope.$watch("vm.cart.paymentMethod", function (paymentMethod) {
                    if (paymentMethod && paymentMethod.isPaymentProfile) {
                        _this.setUpPPTokenExGateway();
                    }
                });
                this.$scope.$watch("vm.cart.paymentOptions.creditCard.expirationYear", function (year) {
                    _this.onExpirationYearChanged(year);
                });
                this.$scope.$watch("vm.cart.paymentOptions.creditCard.useBillingAddress", function (useBillingAddress) {
                    _this.onUseBillingAddressChanged(useBillingAddress);
                });
                this.$scope.$watch("vm.creditCardBillingCountry", function (country) {
                    _this.onCreditCardBillingCountryChanged(country);
                });
                this.$scope.$watch("vm.creditCardBillingState", function (state) {
                    _this.onCreditCardBillingStateChanged(state);
                });
                this.settingsService.getSettings().then(function (settings) {
                    _this.getSettingsCompleted(settings);
                }, function (error) {
                    _this.getSettingsFailed(error);
                });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
                jQuery.validator.addMethod("angularmin", function (value, element, minValue) {
                    var valueParts = value.split(":");
                    return valueParts.length === 2 && valueParts[1] > minValue;
                });
            };
            ReviewAndPayController.prototype.onCartChanged = function (event) {
                this.getCart();
            };
            ReviewAndPayController.prototype.onExpirationYearChanged = function (year) {
                if (year) {
                    var now = new Date();
                    var minMonth = now.getFullYear() === year ? now.getMonth() : 0;
                    jQuery("#expirationMonth").rules("add", { angularmin: minMonth });
                    jQuery("#expirationMonth").valid();
                }
            };
            ReviewAndPayController.prototype.onUseBillingAddressChanged = function (useBillingAddress) {
                var _this = this;
                if (typeof (useBillingAddress) === "undefined" || useBillingAddress) {
                    return;
                }
                if (typeof (this.countries) !== "undefined") {
                    return;
                }
                this.websiteService.getCountries("states").then(function (countryCollection) {
                    _this.getCountriesCompleted(countryCollection);
                }, function (error) {
                    _this.getCountriesFailed(error);
                });
            };
            ReviewAndPayController.prototype.onCreditCardBillingCountryChanged = function (country) {
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
            ReviewAndPayController.prototype.onCreditCardBillingStateChanged = function (state) {
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
            ReviewAndPayController.prototype.getSettingsCompleted = function (settingsCollection) {
                var _this = this;
                this.cartSettings = settingsCollection.cartSettings;
                this.customerSettings = settingsCollection.customerSettings;
                this.useTokenExGateway = settingsCollection.websiteSettings.useTokenExGateway;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            ReviewAndPayController.prototype.getSettingsFailed = function (error) {
            };
            ReviewAndPayController.prototype.getCountriesCompleted = function (countryCollection) {
                this.countries = countryCollection.countries;
                if (this.countries.length === 1) {
                    this.creditCardBillingCountry = this.countries[0];
                }
            };
            ReviewAndPayController.prototype.getCountriesFailed = function (error) {
            };
            ReviewAndPayController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.canUpdateShipToAddress = this.session.billTo.isGuest || this.session.shipTo.oneTimeAddress || this.customerSettings.allowBillToAddressEdit || this.customerSettings.allowShipToAddressEdit;
            };
            ReviewAndPayController.prototype.getSessionFailed = function (error) {
            };
            ReviewAndPayController.prototype.onSessionUpdated = function (session) {
                this.session = session;
                this.getCart(true);
            };
            ReviewAndPayController.prototype.getCart = function (isInit) {
                var _this = this;
                this.spinnerService.show();
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions," + Date.now(); // include date to prevent caching when clicking back from order confirmation
                if (this.$localStorage.get("hasRestrictedProducts") === true.toString()) {
                    this.cartService.expand += ",restrictions";
                }
                this.cartService.forceRecalculation = true;
                this.cartService.allowInvalidAddress = true;
                this.cartService.getCart(this.cartId).then(function (cart) {
                    _this.getCartCompleted(cart, isInit);
                }, function (error) {
                    _this.getCartFailed(error);
                });
            };
            ReviewAndPayController.prototype.getCartCompleted = function (cart, isInit) {
                var _this = this;
                this.cartService.expand = "";
                this.cartService.forceRecalculation = false;
                this.cartService.allowInvalidAddress = false;
                this.restoreAlreadyFilledFields(this.cart, cart);
                var paymentMethod;
                var transientCard;
                if (this.cart && this.cart.paymentOptions) {
                    paymentMethod = this.cart.paymentMethod;
                    transientCard = this.saveTransientCard();
                }
                this.cart = cart;
                var hasRestrictions = cart.cartLines.some(function (o) { return o.isRestricted; });
                // if cart does not have cartLines or any cartLine is restricted, go to Cart page
                if (!this.cart.cartLines || this.cart.cartLines.length === 0 || hasRestrictions) {
                    this.coreService.redirectToPath(this.cartUrl);
                }
                if (isInit) {
                    this.showQuoteRequiredProducts = this.cart.status !== "Cart";
                }
                this.cartIdParam = this.cart.id === "current" ? "" : "?cartId=" + this.cart.id;
                if (transientCard) {
                    this.restoreTransientCard(transientCard);
                }
                this.setUpCarrier(isInit);
                this.setUpShipVia(isInit);
                this.setUpPaymentMethod(isInit, paymentMethod || this.cart.paymentMethod);
                this.setUpPayPal(isInit);
                if (isInit) {
                    setTimeout(function () {
                        _this.setUpTokenExGateway();
                    }, 0, false);
                }
                this.promotionService.getCartPromotions(this.cart.id).then(function (promotionCollection) {
                    _this.getCartPromotionsCompleted(promotionCollection);
                }, function (error) {
                    _this.getCartPromotionsFailed(error);
                });
                if (!isInit) {
                    this.pageIsReady = true;
                }
            };
            ReviewAndPayController.prototype.saveTransientCard = function () {
                return {
                    cardType: this.cart.paymentOptions.creditCard.cardType,
                    cardHolderName: this.cart.paymentOptions.creditCard.cardHolderName,
                    cardNumber: this.cart.paymentOptions.creditCard.cardNumber,
                    expirationMonth: this.cart.paymentOptions.creditCard.expirationMonth,
                    expirationYear: this.cart.paymentOptions.creditCard.expirationYear,
                    securityCode: this.cart.paymentOptions.creditCard.securityCode,
                    useBillingAddress: this.cart.paymentOptions.creditCard.useBillingAddress,
                    address1: this.cart.paymentOptions.creditCard.address1,
                    city: this.cart.paymentOptions.creditCard.city,
                    state: this.cart.paymentOptions.creditCard.state,
                    stateAbbreviation: this.cart.paymentOptions.creditCard.stateAbbreviation,
                    postalCode: this.cart.paymentOptions.creditCard.postalCode,
                    country: this.cart.paymentOptions.creditCard.country,
                    countryAbbreviation: this.cart.paymentOptions.creditCard.countryAbbreviation
                };
            };
            ReviewAndPayController.prototype.restoreTransientCard = function (transientCard) {
                this.cart.paymentOptions.creditCard.cardType = transientCard.cardType;
                this.cart.paymentOptions.creditCard.cardHolderName = transientCard.cardHolderName;
                this.cart.paymentOptions.creditCard.cardNumber = transientCard.cardNumber;
                this.cart.paymentOptions.creditCard.expirationMonth = transientCard.expirationMonth;
                this.cart.paymentOptions.creditCard.expirationYear = transientCard.expirationYear;
                this.cart.paymentOptions.creditCard.securityCode = transientCard.securityCode;
            };
            ReviewAndPayController.prototype.restoreAlreadyFilledFields = function (currentCart, newCart) {
                if (!currentCart) {
                    return;
                }
                newCart.poNumber = currentCart.poNumber;
                newCart.notes = currentCart.notes;
                newCart.requestedDeliveryDate = currentCart.requestedDeliveryDate;
                newCart.requestedPickupDate = currentCart.requestedPickupDate;
            };
            ReviewAndPayController.prototype.setUpCarrier = function (isInit) {
                var _this = this;
                if (this.cart.carriers.length > 0) {
                    this.cart.carriers.forEach(function (carrier) {
                        if (carrier.id === _this.cart.carrier.id) {
                            _this.cart.carrier = carrier;
                            if (isInit) {
                                _this.updateCarrier();
                            }
                        }
                    });
                }
                else {
                    this.pageIsReady = true;
                }
            };
            ReviewAndPayController.prototype.setUpShipVia = function (isInit) {
                var _this = this;
                if (this.cart.carrier && this.cart.carrier.shipVias) {
                    this.cart.carrier.shipVias.forEach(function (shipVia) {
                        if (shipVia.id === _this.cart.shipVia.id) {
                            _this.cart.shipVia = shipVia;
                        }
                    });
                }
            };
            ReviewAndPayController.prototype.setUpPaymentMethod = function (isInit, selectedMethod) {
                var _this = this;
                if (selectedMethod) {
                    this.cart.paymentOptions.paymentMethods.forEach(function (paymentMethod) {
                        if (paymentMethod.name === selectedMethod.name) {
                            _this.cart.paymentMethod = paymentMethod;
                        }
                    });
                }
                else if (this.cart.paymentOptions.paymentMethods.length === 1) {
                    this.cart.paymentMethod = this.cart.paymentOptions.paymentMethods[0];
                }
            };
            ReviewAndPayController.prototype.setUpPayPal = function (isInit) {
                var payerId = this.queryString.get("PayerID").toUpperCase();
                var token = this.queryString.get("token").toUpperCase();
                if (payerId && token) {
                    this.cart.paymentOptions.isPayPal = true;
                    this.cart.status = "Cart";
                    this.cart.paymentOptions.payPalToken = token;
                    this.cart.paymentOptions.payPalPayerId = payerId;
                    this.cart.paymentMethod = null;
                }
            };
            ReviewAndPayController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
                this.cartService.forceRecalculation = false;
                this.cartService.allowInvalidAddress = false;
            };
            ReviewAndPayController.prototype.getCartPromotionsCompleted = function (promotionCollection) {
                this.promotions = promotionCollection.promotions;
            };
            ReviewAndPayController.prototype.getCartPromotionsFailed = function (error) {
            };
            ReviewAndPayController.prototype.updateCarrier = function () {
                var _this = this;
                if (this.cart.carrier && this.cart.carrier.shipVias) {
                    if (this.cart.carrier.shipVias.length === 1 && (!this.cart.shipVia || this.cart.carrier.shipVias[0].id !== this.cart.shipVia.id)) {
                        this.cart.shipVia = this.cart.carrier.shipVias[0];
                        this.updateShipVia();
                    }
                    else if (this.cart.carrier.shipVias.length > 1 &&
                        (!this.cart.shipVia || this.cart.carrier.shipVias.every(function (sv) { return sv.id !== _this.cart.shipVia.id; })) &&
                        this.cart.carrier.shipVias.filter(function (sv) { return sv.isDefault; }).length > 0) {
                        this.cart.shipVia = this.cart.carrier.shipVias.filter(function (sv) { return sv.isDefault; })[0];
                        this.updateShipVia();
                    }
                    else {
                        this.pageIsReady = true;
                    }
                }
                else {
                    this.pageIsReady = true;
                }
            };
            ReviewAndPayController.prototype.updateShipVia = function () {
                var _this = this;
                if (this.cart.shipVia === null) {
                    return;
                }
                this.spinnerService.show();
                this.cartService.updateCart(this.cart).then(function (cart) {
                    _this.updateShipViaCompleted(cart);
                }, function (error) {
                    _this.updateShipViaFailed(error);
                });
            };
            ReviewAndPayController.prototype.updateShipViaCompleted = function (cart) {
                this.getCart();
            };
            ReviewAndPayController.prototype.updateShipViaFailed = function (error) {
            };
            ReviewAndPayController.prototype.submit = function (submitSuccessUri, signInUri) {
                var _this = this;
                this.submitting = true;
                this.submitErrorMessage = "";
                if (!this.validateReviewAndPayForm()) {
                    this.submitting = false;
                    return;
                }
                this.sessionService.getIsAuthenticated().then(function (isAuthenticated) { _this.getIsAuthenticatedForSubmitCompleted(isAuthenticated, submitSuccessUri, signInUri); }, function (error) { _this.getIsAuthenticatedForSubmitFailed(error); });
            };
            ReviewAndPayController.prototype.getIsAuthenticatedForSubmitCompleted = function (isAuthenticated, submitSuccessUri, signInUri) {
                if (!isAuthenticated) {
                    this.coreService.redirectToPathAndRefreshPage(signInUri + "?returnUrl=" + this.coreService.getCurrentPath());
                    return;
                }
                this.spinnerService.show("mainLayout", true);
                this.tokenizeCardInfoIfNeeded(submitSuccessUri);
            };
            ReviewAndPayController.prototype.tokenizeCardInfoIfNeeded = function (submitSuccessUri) {
                this.submitSuccessUri = submitSuccessUri;
                if (this.useTokenExGateway && this.cart.showCreditCard && !this.cart.paymentOptions.isPayPal) {
                    if (this.cart.paymentMethod.isCreditCard) {
                        if (typeof this.isInvalidCardNumber !== 'undefined') {
                            this.tokenExIframe.tokenize();
                        }
                        else {
                            this.tokenExIframe.validate();
                            this.spinnerService.hide();
                            this.scrollToTopOfForm();
                            this.submitting = false;
                        }
                        return;
                    }
                    if (this.cart.paymentMethod.isPaymentProfile) {
                        this.ppTokenExIframe.tokenize();
                        return;
                    }
                }
                this.submitCart();
            };
            ReviewAndPayController.prototype.submitCart = function () {
                var _this = this;
                this.cart.requestedDeliveryDate = this.formatWithTimezone(this.cart.requestedDeliveryDate);
                this.cart.status = this.cart.requiresApproval ? "AwaitingApproval" : "Submitted";
                this.cartService.updateCart(this.cart, true).then(function (cart) {
                    _this.submitCompleted(cart, _this.submitSuccessUri);
                }, function (error) {
                    _this.submitFailed(error);
                });
            };
            ReviewAndPayController.prototype.formatWithTimezone = function (date) {
                return date ? moment(date).format() : date;
            };
            ReviewAndPayController.prototype.getIsAuthenticatedForSubmitFailed = function (error) {
            };
            ReviewAndPayController.prototype.submitCompleted = function (cart, submitSuccessUri) {
                this.cart.id = cart.id;
                this.coreService.redirectToPathAndRefreshPage(submitSuccessUri + "?cartid=" + this.cart.id);
            };
            ReviewAndPayController.prototype.submitFailed = function (error) {
                if (this.useTokenExGateway && this.cart.showCreditCard && this.cart.paymentMethod.isCreditCard) {
                    this.tokenExIframe.reset();
                }
                this.submitting = false;
                this.cart.paymentOptions.isPayPal = false;
                this.submitErrorMessage = error.message;
                this.spinnerService.hide();
            };
            ReviewAndPayController.prototype.submitPaypal = function (returnUri, signInUri) {
                var _this = this;
                this.submitErrorMessage = "";
                this.cart.paymentOptions.isPayPal = true;
                setTimeout(function () {
                    if (!_this.validateReviewAndPayForm()) {
                        _this.cart.paymentOptions.isPayPal = false;
                        return;
                    }
                    _this.sessionService.getIsAuthenticated().then(function (isAuthenticated) {
                        _this.getIsAuthenticatedForSubmitPaypalCompleted(isAuthenticated, returnUri, signInUri);
                    }, function (error) {
                        _this.getIsAuthenticatedForSubmitPaypalFailed(error);
                    });
                }, 0);
            };
            ReviewAndPayController.prototype.getIsAuthenticatedForSubmitPaypalCompleted = function (isAuthenticated, returnUri, signInUri) {
                var _this = this;
                if (!isAuthenticated) {
                    this.coreService.redirectToPath(signInUri + "?returnUrl=" + this.coreService.getCurrentPath());
                    return;
                }
                this.spinnerService.show("mainLayout", true);
                this.cart.paymentOptions.isPayPal = true;
                this.cart.paymentOptions.payPalPaymentUrl = this.$window.location.host + returnUri;
                this.cart.paymentMethod = null;
                this.cart.status = "PaypalSetup";
                this.cartService.updateCart(this.cart, true).then(function (cart) {
                    _this.submitPaypalCompleted(cart);
                }, function (error) {
                    _this.submitPaypalFailed(error);
                });
            };
            ReviewAndPayController.prototype.getIsAuthenticatedForSubmitPaypalFailed = function (error) {
                this.cart.paymentOptions.isPayPal = false;
            };
            ReviewAndPayController.prototype.submitPaypalCompleted = function (cart) {
                // full redirect to paypal
                this.$window.location.href = cart.paymentOptions.payPalPaymentUrl;
            };
            ReviewAndPayController.prototype.submitPaypalFailed = function (error) {
                this.cart.paymentOptions.isPayPal = false;
                this.submitErrorMessage = error.message;
                this.spinnerService.hide();
            };
            ReviewAndPayController.prototype.validateReviewAndPayForm = function () {
                var valid = jQuery("#reviewAndPayForm").validate().form();
                if (!valid) {
                    this.scrollToTopOfForm();
                    return false;
                }
                return true;
            };
            ReviewAndPayController.prototype.scrollToTopOfForm = function () {
                jQuery("html, body").animate({
                    scrollTop: jQuery("#reviewAndPayForm").offset().top
                }, 300);
            };
            ReviewAndPayController.prototype.applyPromotion = function () {
                var _this = this;
                this.promotionAppliedMessage = "";
                this.promotionErrorMessage = "";
                this.promotionService.applyCartPromotion(this.cartId, this.promotionCode).then(function (promotion) {
                    _this.applyPromotionCompleted(promotion);
                }, function (error) {
                    _this.applyPromotionFailed(error);
                });
            };
            ReviewAndPayController.prototype.applyPromotionCompleted = function (promotion) {
                if (promotion.promotionApplied) {
                    this.promotionAppliedMessage = promotion.message;
                }
                else {
                    this.promotionErrorMessage = promotion.message;
                }
                this.getCart();
            };
            ReviewAndPayController.prototype.applyPromotionFailed = function (error) {
                this.promotionErrorMessage = error.message;
                this.getCart();
            };
            ReviewAndPayController.prototype.setUpTokenExGateway = function () {
                var _this = this;
                if (!this.useTokenExGateway) {
                    return;
                }
                this.settingsService.getTokenExConfig().then(function (tokenExDto) {
                    _this.getTokenExConfigCompleted(tokenExDto);
                }, function (error) {
                    _this.getTokenExConfigFailed(error);
                });
            };
            ReviewAndPayController.prototype.getTokenExConfigCompleted = function (tokenExDto) {
                this.setUpTokenExIframe(tokenExDto);
            };
            ReviewAndPayController.prototype.setUpTokenExIframe = function (tokenExDto) {
                var _this = this;
                this.tokenExIframe = new TokenEx.Iframe("tokenExCardNumber", this.getTokenExIframeConfig(tokenExDto));
                this.tokenExIframe.load();
                this.tokenExIframe.on("tokenize", function (data) {
                    _this.$scope.$apply(function () {
                        _this.cart.paymentOptions.creditCard.cardNumber = data.token;
                        _this.cart.paymentOptions.creditCard.securityCode = "CVV";
                        _this.submitCart();
                    });
                });
                this.tokenExIframe.on("validate", function (data) {
                    _this.$scope.$apply(function () {
                        if (data.isValid) {
                            _this.isInvalidCardNumber = false;
                        }
                        else {
                            if (_this.submitting) {
                                _this.isInvalidCardNumber = true;
                            }
                            else if (data.validator && data.validator !== "required") {
                                _this.isInvalidCardNumber = true;
                            }
                        }
                        if (data.isCvvValid) {
                            _this.isInvalidSecurityCode = false;
                        }
                        else {
                            if (_this.submitting) {
                                _this.isInvalidSecurityCode = true;
                            }
                            else if (data.cvvValidator && data.cvvValidator !== "required") {
                                _this.isInvalidSecurityCode = true;
                            }
                        }
                        if (_this.submitting && (_this.isInvalidCardNumber || _this.isInvalidSecurityCode)) {
                            _this.submitting = false;
                            _this.spinnerService.hide();
                        }
                    });
                });
                this.tokenExIframe.on("error", function () {
                    _this.$scope.$apply(function () {
                        // if there was some sort of unknown error from tokenex tokenization (the example they gave was authorization timing out)
                        // try to completely re-initialize the tokenex iframe
                        _this.setUpTokenExGateway();
                    });
                });
            };
            ReviewAndPayController.prototype.getTokenExConfigFailed = function (error) {
            };
            ReviewAndPayController.prototype.getTokenExIframeConfig = function (tokenExDto) {
                return {
                    origin: tokenExDto.origin,
                    timestamp: tokenExDto.timestamp,
                    tokenExID: tokenExDto.tokenExId,
                    tokenScheme: tokenExDto.tokenScheme,
                    authenticationKey: tokenExDto.authenticationKey,
                    styles: {
                        base: "font-family: Arial, sans-serif;padding: 0 8px;border: 1px solid rgba(0, 0, 0, 0.2);margin: 0;width: 100%;font-size: 14px;line-height: 30px;height: 2.7em;box-sizing: border-box;-moz-box-sizing: border-box;",
                        focus: "box-shadow: 0 0 6px 0 rgba(0, 132, 255, 0.5);border: 1px solid rgba(0, 132, 255, 0.5);outline: 0;",
                        error: "box-shadow: 0 0 6px 0 rgba(224, 57, 57, 0.5);border: 1px solid rgba(224, 57, 57, 0.5);",
                        cvv: {
                            base: "font-family: Arial, sans-serif;padding: 0 8px;border: 1px solid rgba(0, 0, 0, 0.2);margin: 0;width: 100%;font-size: 14px;line-height: 30px;height: 2.7em;box-sizing: border-box;-moz-box-sizing: border-box;",
                            focus: "box-shadow: 0 0 6px 0 rgba(0, 132, 255, 0.5);border: 1px solid rgba(0, 132, 255, 0.5);outline: 0;",
                            error: "box-shadow: 0 0 6px 0 rgba(224, 57, 57, 0.5);border: 1px solid rgba(224, 57, 57, 0.5);",
                        }
                    },
                    pci: true,
                    enableValidateOnBlur: true,
                    inputType: "text",
                    enablePrettyFormat: true,
                    cvv: true,
                    cvvContainerID: "tokenExSecurityCode",
                    cvvInputType: "text"
                };
            };
            ReviewAndPayController.prototype.setUpPPTokenExGateway = function () {
                var _this = this;
                if (!this.useTokenExGateway) {
                    return;
                }
                this.ppTokenExIframeIsLoaded = false;
                this.settingsService.getTokenExConfig(this.cart.paymentMethod.name).then(function (tokenExDto) {
                    _this.getTokenExConfigForCVVOnlyCompleted(tokenExDto);
                }, function (error) {
                    _this.getTokenExConfigForCVVOnlyFailed(error);
                });
            };
            ReviewAndPayController.prototype.getTokenExConfigForCVVOnlyCompleted = function (tokenExDto) {
                this.setUpPPTokenExIframe(tokenExDto);
            };
            ReviewAndPayController.prototype.setUpPPTokenExIframe = function (tokenExDto) {
                var _this = this;
                if (!this.useTokenExGateway) {
                    return;
                }
                if (this.ppTokenExIframe) {
                    this.ppTokenExIframe.remove();
                }
                this.ppTokenExIframe = new TokenEx.Iframe("ppTokenExSecurityCode", this.getPPTokenExIframeConfig(tokenExDto));
                this.ppTokenExIframe.load();
                this.ppTokenExIframe.on("load", function () {
                    _this.$scope.$apply(function () {
                        _this.ppTokenExIframeIsLoaded = true;
                        _this.ppIsInvalidSecurityCode = false;
                    });
                });
                this.ppTokenExIframe.on("tokenize", function () {
                    _this.$scope.$apply(function () {
                        _this.submitCart();
                    });
                });
                this.ppTokenExIframe.on("validate", function (data) {
                    _this.$scope.$apply(function () {
                        if (data.isValid) {
                            _this.ppIsInvalidSecurityCode = false;
                        }
                        else {
                            if (_this.submitting) {
                                _this.ppIsInvalidSecurityCode = true;
                            }
                            else if (data.validator && data.validator !== "required") {
                                _this.ppIsInvalidSecurityCode = true;
                            }
                        }
                        if (_this.submitting && _this.ppIsInvalidSecurityCode) {
                            _this.submitting = false;
                            _this.spinnerService.hide();
                        }
                    });
                });
                this.ppTokenExIframe.on("error", function () {
                    _this.$scope.$apply(function () {
                        // if there was some sort of unknown error from tokenex tokenization (the example they gave was authorization timing out)
                        // try to completely re-initialize the tokenex iframe
                        _this.setUpPPTokenExGateway();
                    });
                });
            };
            ReviewAndPayController.prototype.getTokenExConfigForCVVOnlyFailed = function (error) {
            };
            ReviewAndPayController.prototype.getPPTokenExIframeConfig = function (tokenExDto) {
                return {
                    origin: tokenExDto.origin,
                    timestamp: tokenExDto.timestamp,
                    tokenExID: tokenExDto.tokenExId,
                    token: this.cart.paymentMethod.name,
                    tokenScheme: this.cart.paymentMethod.tokenScheme,
                    authenticationKey: tokenExDto.authenticationKey,
                    styles: {
                        base: "font-family: Arial, sans-serif;padding: 0 8px;border: 1px solid rgba(0, 0, 0, 0.2);margin: 0;width: 100%;font-size: 14px;line-height: 30px;height: 2.7em;box-sizing: border-box;-moz-box-sizing: border-box;",
                        focus: "box-shadow: 0 0 6px 0 rgba(0, 132, 255, 0.5);border: 1px solid rgba(0, 132, 255, 0.5);outline: 0;",
                        error: "box-shadow: 0 0 6px 0 rgba(224, 57, 57, 0.5);border: 1px solid rgba(224, 57, 57, 0.5);",
                        cvv: {
                            base: "font-family: Arial, sans-serif;padding: 0 8px;border: 1px solid rgba(0, 0, 0, 0.2);margin: 0;width: 100%;font-size: 14px;line-height: 30px;height: 2.7em;box-sizing: border-box;-moz-box-sizing: border-box;",
                            focus: "box-shadow: 0 0 6px 0 rgba(0, 132, 255, 0.5);border: 1px solid rgba(0, 132, 255, 0.5);outline: 0;",
                            error: "box-shadow: 0 0 6px 0 rgba(224, 57, 57, 0.5);border: 1px solid rgba(224, 57, 57, 0.5);",
                        }
                    },
                    enableValidateOnBlur: true,
                    cvv: true,
                    cvvOnly: true,
                    inputType: "text",
                    cardType: this.getValidTokenExCardType(this.cart.paymentMethod.cardType)
                };
            };
            ReviewAndPayController.prototype.getValidTokenExCardType = function (cardType) {
                cardType = cardType.toLowerCase();
                if (cardType === "visa") {
                    return cardType;
                }
                else if (cardType === "mastercard") {
                    return "masterCard";
                }
                else if (cardType === "discover") {
                    return cardType;
                }
                else if (cardType.indexOf("american") > -1) {
                    return "americanExpress";
                }
                else {
                    return cardType;
                }
            };
            ReviewAndPayController.prototype.openDeliveryMethodPopup = function () {
                this.deliveryMethodPopupService.display({
                    session: this.session
                });
            };
            ReviewAndPayController.prototype.openWarehouseSelectionModal = function () {
                var _this = this;
                this.selectPickUpLocationPopupService.display({
                    session: this.session,
                    updateSessionOnSelect: true,
                    selectedWarehouse: this.session.pickUpWarehouse,
                    onSelectWarehouse: function (warehouse, onSessionUpdate) { return _this.updateSession(warehouse, onSessionUpdate); }
                });
            };
            ReviewAndPayController.prototype.updateSession = function (warehouse, onSessionUpdate) {
                var _this = this;
                var session = {};
                session.pickUpWarehouse = warehouse;
                this.sessionService.updateSession(session).then(function (updatedSession) { _this.updateSessionCompleted(updatedSession, onSessionUpdate); }, function (error) { _this.updateSessionFailed(error); });
            };
            ReviewAndPayController.prototype.updateSessionCompleted = function (session, onSessionUpdate) {
                this.session = session;
                if (angular.isFunction(onSessionUpdate)) {
                    onSessionUpdate();
                }
            };
            ReviewAndPayController.prototype.updateSessionFailed = function (error) {
            };
            ReviewAndPayController.$inject = [
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
                "websiteService",
                "deliveryMethodPopupService",
                "selectPickUpLocationPopupService"
            ];
            return ReviewAndPayController;
        }());
        cart_1.ReviewAndPayController = ReviewAndPayController;
        angular
            .module("insite")
            .controller("ReviewAndPayController", ReviewAndPayController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.review-and-pay.controller.js.map