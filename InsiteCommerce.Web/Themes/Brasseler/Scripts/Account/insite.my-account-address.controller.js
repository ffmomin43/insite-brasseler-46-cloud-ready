var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var MyAccountAddressController = /** @class */ (function () {
            function MyAccountAddressController($location, $localStorage, customerService, websiteService, sessionService, queryString, $rootScope) {
                this.$location = $location;
                this.$localStorage = $localStorage;
                this.customerService = customerService;
                this.websiteService = websiteService;
                this.sessionService = sessionService;
                this.queryString = queryString;
                this.$rootScope = $rootScope;
                this.isReadOnly = false;
            }
            MyAccountAddressController.prototype.$onInit = function () {
                var _this = this;
                this.websiteService.getAddressFields().then(function (addressFieldCollection) { _this.getAddressFieldsCompleted(addressFieldCollection); }, function (error) { _this.getAddressFieldsFailed(error); });
            };
            MyAccountAddressController.prototype.getAddressFieldsCompleted = function (addressFieldCollection) {
                this.addressFields = addressFieldCollection;
                this.getSession();
            };
            MyAccountAddressController.prototype.getAddressFieldsFailed = function (error) {
            };
            MyAccountAddressController.prototype.getSession = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            MyAccountAddressController.prototype.getSessionCompleted = function (session) {
                var shipTo = session.shipTo.oneTimeAddress ? null : session.shipTo;
                this.getBillTo(shipTo);
            };
            MyAccountAddressController.prototype.getSessionFailed = function (error) {
            };
            MyAccountAddressController.prototype.save = function () {
                var _this = this;
                var valid = angular.element("#addressForm").validate().form();
                if (!valid) {
                    angular.element("html, body").animate({
                        scrollTop: angular.element(".error:visible").offset().top
                    }, 300);
                    return;
                }
                this.customerService.updateBillTo(this.billTo).then(function (billTo) { _this.updateBillToCompleted(billTo); }, function (error) { _this.updateBillToFailed(error); });
            };
            MyAccountAddressController.prototype.updateBillToCompleted = function (billTo) {
                var _this = this;
                if (this.shipTo.id !== this.billTo.id) {
                    var shipTo = this.shipTo;
                    if (shipTo.shipTos) {
                        /* In the situation the user selects the billTo as the shipTo we need to remove the shipTos collection
                           from the object to prevent a circular reference when serializing the object. See the unshift command below. */
                        angular.copy(this.shipTo, shipTo);
                        delete shipTo.shipTos;
                    }
                    this.customerService.addOrUpdateShipTo(shipTo).then(function (result) { _this.addOrUpdateShipToCompleted(result); }, function (error) { _this.addOrUpdateShipToFailed(error); });
                }
                else {
                    angular.element("#saveSuccess").foundation("reveal", "open");
                    this.updateHeaderSession();
                }
            };
            MyAccountAddressController.prototype.updateBillToFailed = function (error) {
            };
            MyAccountAddressController.prototype.addOrUpdateShipToCompleted = function (result) {
                if (this.shipTo.isNew) {
                    var isNewShipTo = this.queryString.get("isNewShipTo");
                    if (isNewShipTo === "true") {
                        this.$localStorage.set("createdShipToId", result.id);
                        this.$location.search("isNewShipTo", null);
                    }
                    else {
                        this.getBillTo(result);
                    }
                }
                angular.element("#saveSuccess").foundation("reveal", "open");
                this.updateHeaderSession();
            };
            MyAccountAddressController.prototype.addOrUpdateShipToFailed = function (error) {
            };
            MyAccountAddressController.prototype.updateHeaderSession = function () {
                this.$rootScope.$broadcast("updateHeaderSession");
            };
            MyAccountAddressController.prototype.getBillTo = function (selectedShipTo) {
                var _this = this;
                this.customerService.getBillTo("shiptos,excludeonetime,validation,country,state").then(function (billTo) { _this.getBillToCompleted(billTo, selectedShipTo); }, function (error) { _this.getBillToFailed(error); });
            };
            MyAccountAddressController.prototype.getBillToCompleted = function (billTo, selectedShipTo) {
                var _this = this;
                this.billTo = billTo;
                this.websiteService.getCountries("states").then(function (countryCollection) { _this.getCountriesCompleted(countryCollection, selectedShipTo); }, function (error) { _this.getCountriesFailed(error); });
            };
            MyAccountAddressController.prototype.getBillToFailed = function (error) {
            };
            MyAccountAddressController.prototype.getCountriesCompleted = function (countryCollection, selectedShipTo) {
                var _this = this;
                this.countries = countryCollection.countries;
                if (this.onlyOneCountryToSelect()) {
                    this.selectFirstCountryForAddress(this.billTo);
                }
                this.setObjectToReference(this.countries, this.billTo, "country");
                if (this.billTo.country) {
                    this.setObjectToReference(this.billTo.country.states, this.billTo, "state");
                }
                var shipTos = this.billTo.shipTos;
                var billToInShipTos;
                shipTos.forEach(function (shipTo) {
                    _this.setObjectToReference(_this.countries, shipTo, "country");
                    if (shipTo.country) {
                        _this.setObjectToReference(shipTo.country.states, shipTo, "state");
                    }
                    if (shipTo.id === _this.billTo.id) {
                        billToInShipTos = shipTo;
                    }
                });
                // if allow ship to billing address, remove the billto returned in the shipTos array and put in the actual billto object
                // so that updating one side updates the other side
                if (billToInShipTos) {
                    this.billTo.label = billToInShipTos.label;
                    shipTos.splice(shipTos.indexOf(billToInShipTos), 1); // remove the billto that's in the shiptos array
                    shipTos.unshift(this.billTo); // add the actual billto to top of array
                }
                var isNewShipTo = this.queryString.get("isNewShipTo");
                var createdShipToId = this.$localStorage.get("createdShipToId");
                if (createdShipToId) {
                    shipTos.forEach(function (shipTo) {
                        if (shipTo.id === createdShipToId) {
                            _this.shipTo = shipTo;
                        }
                    });
                    this.$localStorage.remove("createdShipToId");
                }
                else if (isNewShipTo === "true") {
                    shipTos.forEach(function (shipTo) {
                        if (shipTo.isNew) {
                            _this.shipTo = shipTo;
                        }
                    });
                    this.focusOnFirstEnabledShipToInput();
                }
                else if (selectedShipTo) {
                    shipTos.forEach(function (shipTo) {
                        if (shipTo.id === selectedShipTo.id) {
                            _this.shipTo = shipTo;
                        }
                    });
                }
                else {
                    this.shipTo = shipTos[0];
                }
                if (this.shipTo && this.shipTo.id === this.billTo.id) {
                    // Don't allow editing the Bill To from the Ship To column.  Only allow
                    // editing of Bill To from the Bill To column. So, if ship to is the bill to change
                    // the ship to fields to readonly.
                    this.isReadOnly = true;
                }
            };
            MyAccountAddressController.prototype.getCountriesFailed = function (error) {
            };
            MyAccountAddressController.prototype.setObjectToReference = function (references, object, objectPropertyName) {
                references.forEach(function (reference) {
                    if (object[objectPropertyName] && (reference.id === object[objectPropertyName].id)) {
                        object[objectPropertyName] = reference;
                    }
                });
            };
            MyAccountAddressController.prototype.setStateRequiredRule = function (prefix, address) {
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
            MyAccountAddressController.prototype.checkSelectedShipTo = function () {
                if (this.billToAndShipToAreSameCustomer()) {
                    this.isReadOnly = true;
                }
                else {
                    this.isReadOnly = false;
                }
                if (this.onlyOneCountryToSelect()) {
                    this.selectFirstCountryForAddress(this.shipTo);
                    this.setStateRequiredRule("st", this.shipTo);
                }
                this.updateAddressFormValidation();
            };
            MyAccountAddressController.prototype.onlyOneCountryToSelect = function () {
                return this.countries.length === 1;
            };
            MyAccountAddressController.prototype.selectFirstCountryForAddress = function (address) {
                if (!address.country) {
                    address.country = this.countries[0];
                }
            };
            MyAccountAddressController.prototype.billToAndShipToAreSameCustomer = function () {
                return this.shipTo.id === this.billTo.id;
            };
            MyAccountAddressController.prototype.updateAddressFormValidation = function () {
                this.resetAddressFormValidation();
                this.updateValidationRules("stfirstname", this.shipTo.validation.firstName);
                this.updateValidationRules("stlastname", this.shipTo.validation.lastName);
                this.updateValidationRules("stattention", this.shipTo.validation.attention);
                this.updateValidationRules("stcompanyName", this.shipTo.validation.companyName);
                this.updateValidationRules("staddress1", this.shipTo.validation.address1);
                this.updateValidationRules("staddress2", this.shipTo.validation.address2);
                this.updateValidationRules("staddress3", this.shipTo.validation.address3);
                this.updateValidationRules("staddress4", this.shipTo.validation.address4);
                this.updateValidationRules("stcountry", this.shipTo.validation.country);
                this.updateValidationRules("ststate", this.shipTo.validation.state);
                this.updateValidationRules("stcity", this.shipTo.validation.city);
                this.updateValidationRules("stpostalCode", this.shipTo.validation.postalCode);
                this.updateValidationRules("stphone", this.shipTo.validation.phone);
                this.updateValidationRules("stfax", this.shipTo.validation.fax);
                this.updateValidationRules("stemail", this.shipTo.validation.email);
            };
            MyAccountAddressController.prototype.resetAddressFormValidation = function () {
                $("#addressForm").validate().resetForm();
            };
            MyAccountAddressController.prototype.updateValidationRules = function (fieldName, rules) {
                var convertedRules = this.convertValidationToJQueryRules(rules);
                this.updateValidationRulesForField(fieldName, convertedRules);
            };
            MyAccountAddressController.prototype.convertValidationToJQueryRules = function (rules) {
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
            MyAccountAddressController.prototype.updateValidationRulesForField = function (fieldName, rules) {
                $("#" + fieldName).rules("remove", "required,maxlength");
                $("#" + fieldName).rules("add", rules);
            };
            MyAccountAddressController.prototype.focusOnFirstEnabledShipToInput = function () {
                setTimeout(function () {
                    var formInput = $(".shipping-info input:enabled:first");
                    if (formInput.length) {
                        formInput.focus();
                    }
                });
            };
            MyAccountAddressController.$inject = ["$location", "$localStorage", "customerService", "websiteService", "sessionService", "queryString", "$rootScope"];
            return MyAccountAddressController;
        }());
        account.MyAccountAddressController = MyAccountAddressController;
        angular
            .module("insite")
            .controller("MyAccountAddressController", MyAccountAddressController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-account-address.controller.js.map