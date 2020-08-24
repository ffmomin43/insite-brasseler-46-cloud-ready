var insite;
(function (insite) {
    var cart;
    (function (cart_1) {
        "use strict";
        var CheckoutAddressController = /** @class */ (function () {
            function CheckoutAddressController($scope, $window, cartService, customerService, websiteService, coreService, queryString, accountService, settingsService, $timeout, $q, sessionService, $localStorage, $attrs, $rootScope) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.customerService = customerService;
                this.websiteService = websiteService;
                this.coreService = coreService;
                this.queryString = queryString;
                this.accountService = accountService;
                this.settingsService = settingsService;
                this.$timeout = $timeout;
                this.$q = $q;
                this.sessionService = sessionService;
                this.$localStorage = $localStorage;
                this.$attrs = $attrs;
                this.$rootScope = $rootScope;
                this.continueCheckoutInProgress = false;
                this.isReadOnly = false;
            }
            CheckoutAddressController.prototype.$onInit = function () {
                var _this = this;
                this.cartId = this.queryString.get("cartId");
                this.reviewAndPayUrl = this.$attrs.reviewAndPayUrl;
                var referringPath = this.coreService.getReferringPath();
                this.editMode = referringPath && referringPath.toLowerCase().indexOf(this.reviewAndPayUrl.toLowerCase()) !== -1;
                this.websiteService.getAddressFields().then(function (model) { _this.getAddressFieldsCompleted(model); });
                this.accountService.getAccount().then(function (account) { _this.getAccountCompleted(account); }, function (error) { _this.getAccountFailed(error); });
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            CheckoutAddressController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.customerSettings = settingsCollection.customerSettings;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            };
            CheckoutAddressController.prototype.getSettingsFailed = function (error) {
            };
            CheckoutAddressController.prototype.getSessionCompleted = function (session) {
                this.session = session;
            };
            CheckoutAddressController.prototype.getSessionFailed = function (error) {
            };
            CheckoutAddressController.prototype.onSessionUpdated = function (session) {
                this.session = session;
            };
            CheckoutAddressController.prototype.getAddressFieldsCompleted = function (addressFields) {
                var _this = this;
                this.addressFields = addressFields;
                this.cartService.expand = "shiptos,validation";
                this.cartService.getCart(this.cartId).then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            CheckoutAddressController.prototype.getCartCompleted = function (cart) {
                var _this = this;
                this.cartService.expand = "";
                this.cart = cart;
                if (this.cart.shipTo) {
                    this.initialShipToId = this.cart.shipTo.id;
                }
                this.enableEditModeIfRequired();
                this.websiteService.getCountries("states").then(function (countryCollection) { _this.getCountriesCompleted(countryCollection); }, function (error) { _this.getCountriesFailed(error); });
            };
            CheckoutAddressController.prototype.getCartFailed = function (error) {
                this.cartService.expand = "";
            };
            CheckoutAddressController.prototype.enableEditModeIfRequired = function () {
                var customers = [this.cart.billTo, this.cart.shipTo];
                for (var i = 0; i < customers.length; i++) {
                    if (customers[i] && customers[i].validation) {
                        for (var property in customers[i].validation) {
                            if (customers[i].validation[property].isRequired && !customers[i][property]) {
                                this.enableEditMode();
                                break;
                            }
                        }
                    }
                }
            };
            CheckoutAddressController.prototype.getAccountCompleted = function (account) {
                this.account = account;
                this.initialIsSubscribed = account.isSubscribed;
            };
            CheckoutAddressController.prototype.getAccountFailed = function (error) {
            };
            CheckoutAddressController.prototype.getCountriesCompleted = function (countryCollection) {
                this.countries = countryCollection.countries;
                this.setUpBillTo();
                this.setUpShipTos();
                this.setSelectedShipTo();
            };
            CheckoutAddressController.prototype.getCountriesFailed = function (error) {
            };
            CheckoutAddressController.prototype.setUpBillTo = function () {
                if (this.onlyOneCountryToSelect()) {
                    this.selectFirstCountryForAddress(this.cart.billTo);
                    this.setStateRequiredRule("bt", this.cart.billTo);
                }
                this.replaceObjectWithReference(this.cart.billTo, this.countries, "country");
                if (this.cart.billTo.country) {
                    this.replaceObjectWithReference(this.cart.billTo, this.cart.billTo.country.states, "state");
                }
            };
            CheckoutAddressController.prototype.setUpShipTos = function () {
                var _this = this;
                this.shipTos = angular.copy(this.cart.billTo.shipTos);
                var shipToBillTo = null;
                this.shipTos.forEach(function (shipTo) {
                    if (shipTo.country && shipTo.country.states) {
                        _this.replaceObjectWithReference(shipTo, _this.countries, "country");
                        _this.replaceObjectWithReference(shipTo, shipTo.country.states, "state");
                    }
                    if (shipTo.id === _this.cart.billTo.id) {
                        shipToBillTo = shipTo;
                    }
                });
                // if this billTo was returned in the shipTos, replace the billTo in the shipTos array
                // with the actual billto object so that updating one side updates the other side
                if (shipToBillTo) {
                    this.cart.billTo.label = shipToBillTo.label;
                    this.shipTos.splice(this.shipTos.indexOf(shipToBillTo), 1); // remove the billto that's in the shiptos array
                    this.shipTos.unshift(this.cart.billTo); // add the actual billto to top of array
                }
            };
            CheckoutAddressController.prototype.setSelectedShipTo = function () {
                var _this = this;
                this.selectedShipTo = this.cart.shipTo;
                this.shipTos.forEach(function (shipTo) {
                    if (_this.cart.shipTo && shipTo.id === _this.cart.shipTo.id || !_this.selectedShipTo && shipTo.isNew) {
                        _this.selectedShipTo = shipTo;
                    }
                });
                if (this.selectedShipTo && this.selectedShipTo.id === this.cart.billTo.id) {
                    // don't allow editing the billTo from the shipTo side if the billTo is selected as the shipTo
                    this.isReadOnly = true;
                }
            };
            CheckoutAddressController.prototype.checkSelectedShipTo = function () {
                if (this.billToAndShipToAreSameCustomer()) {
                    this.isReadOnly = true;
                }
                else {
                    this.isReadOnly = false;
                }
                if (this.onlyOneCountryToSelect()) {
                    this.selectFirstCountryForAddress(this.selectedShipTo);
                    this.setStateRequiredRule("st", this.selectedShipTo);
                }
                this.updateAddressFormValidation();
            };
            CheckoutAddressController.prototype.onlyOneCountryToSelect = function () {
                return this.countries.length === 1;
            };
            CheckoutAddressController.prototype.selectFirstCountryForAddress = function (address) {
                if (!address.country) {
                    address.country = this.countries[0];
                }
            };
            CheckoutAddressController.prototype.billToAndShipToAreSameCustomer = function () {
                return this.selectedShipTo.id === this.cart.billTo.id;
            };
            CheckoutAddressController.prototype.updateAddressFormValidation = function () {
                this.resetAddressFormValidation();
                this.updateValidationRules("stfirstname", this.selectedShipTo.validation.firstName);
                this.updateValidationRules("stlastname", this.selectedShipTo.validation.lastName);
                this.updateValidationRules("stattention", this.selectedShipTo.validation.attention);
                this.updateValidationRules("stcompanyName", this.selectedShipTo.validation.companyName);
                this.updateValidationRules("staddress1", this.selectedShipTo.validation.address1);
                this.updateValidationRules("staddress2", this.selectedShipTo.validation.address2);
                this.updateValidationRules("staddress3", this.selectedShipTo.validation.address3);
                this.updateValidationRules("staddress4", this.selectedShipTo.validation.address4);
                this.updateValidationRules("stcountry", this.selectedShipTo.validation.country);
                this.updateValidationRules("ststate", this.selectedShipTo.validation.state);
                this.updateValidationRules("stcity", this.selectedShipTo.validation.city);
                this.updateValidationRules("stpostalCode", this.selectedShipTo.validation.postalCode);
                this.updateValidationRules("stphone", this.selectedShipTo.validation.phone);
                this.updateValidationRules("stfax", this.selectedShipTo.validation.fax);
                this.updateValidationRules("stemail", this.selectedShipTo.validation.email);
            };
            CheckoutAddressController.prototype.resetAddressFormValidation = function () {
                $("#addressForm").validate().resetForm();
            };
            CheckoutAddressController.prototype.updateValidationRules = function (fieldName, rules) {
                var convertedRules = this.convertValidationToJQueryRules(rules);
                this.updateValidationRulesForField(fieldName, convertedRules);
            };
            CheckoutAddressController.prototype.convertValidationToJQueryRules = function (rules) {
                if (rules.maxLength) {
                    return {
                        required: rules.isRequired,
                        maxlength: rules.maxLength
                    };
                }
                return {
                    required: rules.isRequired
                };
            };
            CheckoutAddressController.prototype.updateValidationRulesForField = function (fieldName, rules) {
                $("#" + fieldName).rules("remove", "required,maxlength");
                $("#" + fieldName).rules("add", rules);
            };
            CheckoutAddressController.prototype.setStateRequiredRule = function (prefix, address) {
                if (!address.country) {
                    return;
                }
                var country = this.countries.filter(function (elem) {
                    return elem.id === address.country.id;
                });
                var isRequired = country != null && country.length > 0 && country[0].states.length > 0;
                setTimeout(function () {
                    if (!isRequired) {
                        address.state = null;
                    }
                }, 100);
            };
            CheckoutAddressController.prototype.continueCheckout = function (continueUri, cartUri) {
                var valid = $("#addressForm").validate().form();
                if (!valid) {
                    angular.element("html, body").animate({
                        scrollTop: angular.element(".error:visible").offset().top
                    }, 300);
                    return;
                }
                this.continueCheckoutInProgress = true;
                this.cartUri = cartUri;
                if (this.cartId) {
                    continueUri += "?cartId=" + this.cartId;
                }
                // if no changes, redirect to next step
                if (this.$scope.addressForm.$pristine) {
                    this.coreService.redirectToPath(continueUri);
                    return;
                }
                // if the ship to has been changed, set the shipvia to null so it isn't set to a ship via that is no longer valid
                if (this.cart.shipTo && this.cart.shipTo.id !== this.selectedShipTo.id) {
                    this.cart.shipVia = null;
                }
                if (this.customerHasEditableFields(this.cart.billTo)) {
                    this.updateBillTo(continueUri);
                }
                else {
                    this.updateShipTo(continueUri);
                }
            };
            CheckoutAddressController.prototype.updateBillTo = function (continueUri) {
                var _this = this;
                this.customerService.updateBillTo(this.cart.billTo).then(function (billTo) { _this.updateBillToCompleted(billTo, continueUri); }, function (error) { _this.updateBillToFailed(error); });
            };
            CheckoutAddressController.prototype.updateBillToCompleted = function (billTo, continueUri) {
                this.updateShipTo(continueUri, true);
            };
            CheckoutAddressController.prototype.updateBillToFailed = function (error) {
                this.continueCheckoutInProgress = false;
            };
            CheckoutAddressController.prototype.updateShipTo = function (continueUri, customerWasUpdated) {
                var _this = this;
                if (this.selectedShipTo.oneTimeAddress || this.selectedShipTo.isNew) {
                    this.cart.shipTo = this.selectedShipTo;
                }
                else {
                    var shipToMatches = this.cart.billTo.shipTos.filter(function (shipTo) { return shipTo.id === _this.selectedShipTo.id; });
                    if (shipToMatches.length === 1) {
                        this.cart.shipTo = this.selectedShipTo;
                    }
                }
                if (this.cart.shipTo.id !== this.cart.billTo.id && this.customerHasEditableFields(this.cart.shipTo)) {
                    this.customerService.addOrUpdateShipTo(this.cart.shipTo).then(function (shipTo) { _this.addOrUpdateShipToCompleted(shipTo, continueUri, customerWasUpdated); }, function (error) { _this.addOrUpdateShipToFailed(error); });
                }
                else {
                    this.updateSession(this.cart, continueUri, customerWasUpdated);
                }
            };
            CheckoutAddressController.prototype.addOrUpdateShipToCompleted = function (shipTo, continueUri, customerWasUpdated) {
                var _this = this;
                if (this.cart.shipTo.isNew) {
                    this.cart.shipTo = shipTo;
                }
                // If shipTo was updated for quote or jobQuote then just update cart, otherwise update session
                if (this.cartId) {
                    this.cartService.updateCart(this.cart).then(function (cart) { _this.updateCartCompleted(cart, continueUri); }, function (error) { _this.updateCartFailed(error); });
                }
                else {
                    this.updateSession(this.cart, continueUri, customerWasUpdated);
                }
            };
            CheckoutAddressController.prototype.addOrUpdateShipToFailed = function (error) {
                this.continueCheckoutInProgress = false;
            };
            CheckoutAddressController.prototype.updateCartCompleted = function (cart, continueUri) {
                this.getCartAfterChangeShipTo(cart, continueUri);
            };
            CheckoutAddressController.prototype.updateCartFailed = function (error) {
            };
            CheckoutAddressController.prototype.getCartAfterChangeShipTo = function (cart, continueUri) {
                var _this = this;
                this.cartService.expand = "cartlines,shiptos,validation";
                this.cartService.getCart(this.cartId).then(function (cart) { _this.getCartAfterChangeShipToCompleted(cart, continueUri); }, function (error) { _this.getCartAfterChangeShipToFailed(error); });
            };
            CheckoutAddressController.prototype.getCartAfterChangeShipToCompleted = function (cart, continueUri) {
                var _this = this;
                this.cartService.expand = "";
                this.cart = cart;
                if (!cart.canCheckOut) {
                    this.coreService.displayModal(angular.element("#insufficientInventoryAtCheckout"), function () {
                        _this.redirectTo(_this.cartUri);
                    });
                    this.$timeout(function () {
                        _this.coreService.closeModal("#insufficientInventoryAtCheckout");
                    }, 3000);
                }
                else {
                    if (this.initialIsSubscribed !== this.account.isSubscribed) {
                        this.accountService.updateAccount(this.account).then(function (response) { _this.updateAccountCompleted(_this.cart, continueUri); }, function (error) { _this.updateAccountFailed(error); });
                    }
                    else {
                        this.redirectTo(continueUri);
                    }
                }
            };
            CheckoutAddressController.prototype.getCartAfterChangeShipToFailed = function (error) {
                this.continueCheckoutInProgress = false;
            };
            CheckoutAddressController.prototype.updateSession = function (cart, continueUri, customerWasUpdated) {
                var _this = this;
                this.sessionService.setCustomer(this.cart.billTo.id, this.cart.shipTo.id, false, customerWasUpdated).then(function (session) { _this.updateSessionCompleted(session, _this.cart, continueUri); }, function (error) { _this.updateSessionFailed(error); });
            };
            CheckoutAddressController.prototype.updateAccountCompleted = function (cart, continueUri) {
                this.redirectTo(continueUri);
            };
            CheckoutAddressController.prototype.updateAccountFailed = function (error) {
                this.continueCheckoutInProgress = false;
            };
            CheckoutAddressController.prototype.replaceObjectWithReference = function (model, references, objectPropertyName) {
                references.forEach(function (reference) {
                    if (model[objectPropertyName] && reference.id === model[objectPropertyName].id) {
                        model[objectPropertyName] = reference;
                    }
                });
            };
            CheckoutAddressController.prototype.updateSessionCompleted = function (session, cart, continueUri) {
                var _this = this;
                this.$rootScope.$broadcast("sessionUpdated", session);
                if (session.isRestrictedProductRemovedFromCart) {
                    this.coreService.displayModal(angular.element("#removedProductsFromCart"), function () {
                        if (session.isRestrictedProductExistInCart) {
                            _this.$localStorage.set("hasRestrictedProducts", true.toString());
                        }
                        _this.redirectTo(_this.cartUri);
                    });
                    this.$timeout(function () {
                        _this.coreService.closeModal("#removedProductsFromCart");
                    }, 5000);
                    return;
                }
                if (session.isRestrictedProductExistInCart) {
                    this.$localStorage.set("hasRestrictedProducts", true.toString());
                    this.redirectTo(this.cartUri);
                }
                else {
                    this.getCartAfterChangeShipTo(this.cart, continueUri);
                }
            };
            CheckoutAddressController.prototype.updateSessionFailed = function (error) {
                this.continueCheckoutInProgress = false;
            };
            CheckoutAddressController.prototype.redirectTo = function (continueUri) {
                if (!this.cart.shipTo || this.initialShipToId === this.cart.shipTo.id) {
                    this.coreService.redirectToPath(continueUri);
                }
                else {
                    this.coreService.redirectToPathAndRefreshPage(continueUri);
                }
            };
            CheckoutAddressController.prototype.enableEditMode = function () {
                this.editMode = true;
            };
            CheckoutAddressController.prototype.customerHasEditableFields = function (customer) {
                if (!customer || !customer.validation) {
                    return false;
                }
                for (var property in customer.validation) {
                    if (customer.validation.hasOwnProperty(property) && !customer.validation[property].isDisabled) {
                        return true;
                    }
                }
                return false;
            };
            CheckoutAddressController.$inject = [
                "$scope",
                "$window",
                "cartService",
                "customerService",
                "websiteService",
                "coreService",
                "queryString",
                "accountService",
                "settingsService",
                "$timeout",
                "$q",
                "sessionService",
                "$localStorage",
                "$attrs",
                "$rootScope"
            ];
            return CheckoutAddressController;
        }());
        cart_1.CheckoutAddressController = CheckoutAddressController;
        angular
            .module("insite")
            .controller("CheckoutAddressController", CheckoutAddressController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.checkout-address.controller.js.map