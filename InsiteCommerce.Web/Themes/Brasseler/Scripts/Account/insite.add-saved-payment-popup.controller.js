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
    var account;
    (function (account) {
        "use strict";
        var AddSavedPaymentPopupController = /** @class */ (function () {
            function AddSavedPaymentPopupController(coreService, $scope, $rootScope, websiteService, accountService, customerService, addSavedPaymentPopupService, spinnerService, settingsService) {
                this.coreService = coreService;
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.websiteService = websiteService;
                this.accountService = accountService;
                this.customerService = customerService;
                this.addSavedPaymentPopupService = addSavedPaymentPopupService;
                this.spinnerService = spinnerService;
                this.settingsService = settingsService;
            }
            AddSavedPaymentPopupController.prototype.$onInit = function () {
                var _this = this;
                this.addSavedPaymentPopupService.registerDisplayFunction(function (data) {
                    _this.savedPayments = data.savedPayments;
                    _this.afterSaveFn = data.afterSaveFn;
                    if (_this.countries) {
                        _this.resetFields();
                    }
                    else {
                        _this.fillData();
                    }
                    setTimeout(function () {
                        _this.setUpTokenExGateway();
                    }, 0, false);
                    _this.coreService.displayModal("#popup-add-saved-payment");
                });
                this.$scope.$watch("vm.copyAddressFromBillTo", function (newValue) {
                    if (!newValue) {
                        return;
                    }
                    if (_this.billTo) {
                        _this.setBillToAddress();
                        return;
                    }
                    _this.customerService.getBillTo("").then(function (billTo) { _this.getBillToCompleted(billTo); }, function (error) { _this.getBillToFailed(error); });
                });
                this.$scope.$watch("vm.country", function (newValue, oldValue) {
                    if (!oldValue) {
                        return;
                    }
                    if (!newValue) {
                        _this.state = null;
                        return;
                    }
                    if (newValue.states && newValue.states.length > 0) {
                        if (_this.state && newValue.states.some(function (o) { return o.abbreviation === _this.state.abbreviation; })) {
                            _this.state = newValue.states.find(function (o) { return o.abbreviation === _this.state.abbreviation; });
                        }
                        else {
                            _this.state = newValue.states[0];
                        }
                    }
                    else {
                        _this.state = null;
                    }
                });
                this.$scope.$watch("vm.description", function (newValue) {
                    if (!newValue || !_this.savedPayments || _this.savedPayments.length === 0) {
                        return;
                    }
                    _this.isDescriptionAlreadyExists = _this.savedPayments.some(function (o) { return o.description === newValue; });
                });
            };
            AddSavedPaymentPopupController.prototype.getBillToCompleted = function (billTo) {
                this.billTo = billTo;
                this.setBillToAddress();
            };
            AddSavedPaymentPopupController.prototype.getBillToFailed = function (error) {
            };
            AddSavedPaymentPopupController.prototype.setBillToAddress = function () {
                var _this = this;
                if (!this.billTo) {
                    return;
                }
                this.address1 = this.billTo.address1;
                this.address2 = this.billTo.address2;
                this.country = this.countries.find(function (o) { return o.abbreviation === _this.billTo.country.abbreviation; });
                if (this.country && this.country.states && this.country.states.length > 0) {
                    this.state = this.country.states.find(function (o) { return o.abbreviation === _this.billTo.state.abbreviation; });
                }
                this.city = this.billTo.city;
                this.postalCode = this.billTo.postalCode;
            };
            AddSavedPaymentPopupController.prototype.resetFields = function () {
                this.copyAddressFromBillTo = false;
                this.description = "";
                this.expirationYear = this.expirationYears[0];
                this.expirationMonth = "01";
                this.cardIdentifier = "";
                this.cardType = "";
                this.cardHolderName = "";
                this.address1 = "";
                this.address2 = "";
                this.country = this.countries[0];
                if (this.country.states && this.country.states.length > 0) {
                    this.state = this.country.states[0];
                }
                else {
                    this.state = null;
                }
                this.city = "";
                this.postalCode = "";
                this.isDefault = false;
                angular.element("#addSavedPaymentForm").validate().resetForm();
                angular.element("#addSavedPaymentForm input.error").removeClass("error");
                this.isInvalidCardNumber = false;
                this.isCardAlreadyExists = false;
                this.isDescriptionAlreadyExists = false;
            };
            AddSavedPaymentPopupController.prototype.fillData = function () {
                var _this = this;
                this.expirationYears = lodash.range(new Date().getFullYear(), new Date().getFullYear() + 10).map(function (o) {
                    return { key: o.toString().substring(2), value: o.toString() };
                });
                this.expirationMonth = "01";
                this.expirationYear = this.expirationYears[0];
                this.websiteService.getCountries("states").then(function (countryCollection) { _this.getCountriesCompleted(countryCollection); }, function (error) { _this.getCountriesFailed(error); });
            };
            AddSavedPaymentPopupController.prototype.getCountriesCompleted = function (countryCollection) {
                this.countries = countryCollection.countries;
                this.country = this.countries[0];
                if (this.country.states && this.country.states.length > 0) {
                    this.state = this.country.states[0];
                }
            };
            AddSavedPaymentPopupController.prototype.getCountriesFailed = function (error) {
            };
            AddSavedPaymentPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-add-saved-payment");
            };
            AddSavedPaymentPopupController.prototype.save = function () {
                if (!this.validate()) {
                    return;
                }
                this.saving = true;
                this.tokenExIframe.tokenize();
            };
            AddSavedPaymentPopupController.prototype.validate = function () {
                if (this.isInvalidCardNumber || this.isCardAlreadyExists || this.isDescriptionAlreadyExists) {
                    return false;
                }
                if (!angular.element("#addSavedPaymentForm").validate().form()) {
                    return false;
                }
                return true;
            };
            AddSavedPaymentPopupController.prototype.continueSave = function () {
                var _this = this;
                var model = {
                    description: this.description,
                    expirationDate: this.expirationMonth + "/" + this.expirationYear.key,
                    cardIdentifier: this.cardIdentifier,
                    cardType: this.cardType,
                    cardHolderName: this.cardHolderName,
                    address1: this.address1,
                    address2: this.address2,
                    city: this.city,
                    state: this.state ? this.state.abbreviation : "",
                    postalCode: this.postalCode,
                    country: this.country.abbreviation,
                    isDefault: this.isDefault
                };
                this.accountService.addPaymentProfile(model).then(function (paymentProfile) { _this.addPaymentProfileCompleted(paymentProfile); }, function (error) { _this.addPaymentProfileFailed(error); });
            };
            AddSavedPaymentPopupController.prototype.addPaymentProfileCompleted = function (paymentProfile) {
                this.saving = false;
                if (this.afterSaveFn && typeof (this.afterSaveFn) === "function") {
                    this.afterSaveFn();
                }
                this.closeModal();
            };
            AddSavedPaymentPopupController.prototype.addPaymentProfileFailed = function (error) {
            };
            AddSavedPaymentPopupController.prototype.setUpTokenExGateway = function () {
                var _this = this;
                this.tokenExIframeIsLoaded = false;
                this.settingsService.getTokenExConfig().then(function (tokenExDto) { _this.getTokenExConfigCompleted(tokenExDto); }, function (error) { _this.getTokenExConfigFailed(error); });
            };
            AddSavedPaymentPopupController.prototype.getTokenExConfigCompleted = function (tokenExDto) {
                this.setUpTokenExIframe(tokenExDto);
            };
            AddSavedPaymentPopupController.prototype.setUpTokenExIframe = function (tokenExDto) {
                var _this = this;
                if (this.tokenExIframe) {
                    this.tokenExIframe.remove();
                }
                this.tokenExIframe = new TokenEx.Iframe("addTokenExCardNumber", this.getTokenExIframeConfig(tokenExDto));
                this.tokenExIframe.load();
                this.tokenExIframe.on("load", function () {
                    _this.$scope.$apply(function () {
                        _this.tokenExIframeIsLoaded = true;
                        _this.isInvalidCardNumber = false;
                        _this.isInvalidCardNumber = false;
                    });
                });
                this.tokenExIframe.on("tokenize", function (data) {
                    _this.$scope.$apply(function () {
                        _this.cardIdentifier = data.token;
                        _this.cardType = _this.convertTokenExCardType(data.cardType);
                        _this.continueSave();
                    });
                });
                this.tokenExIframe.on("validate", function (data) {
                    _this.$scope.$apply(function () {
                        if (data.isValid) {
                            _this.isInvalidCardNumber = false;
                            _this.isCardAlreadyExists = _this.savedPayments.some(function (o) { return o.maskedCardNumber.substring(o.maskedCardNumber.length - 4) === data.lastFour && o.cardType === _this.convertTokenExCardType(data.cardType); });
                        }
                        else {
                            if (_this.saving) {
                                _this.isInvalidCardNumber = true;
                            }
                            else if (data.validator && data.validator !== "required") {
                                _this.isInvalidCardNumber = true;
                            }
                            _this.isCardAlreadyExists = false;
                        }
                        if (_this.saving && (_this.isInvalidCardNumber || _this.isCardAlreadyExists)) {
                            _this.saving = false;
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
            AddSavedPaymentPopupController.prototype.getTokenExConfigFailed = function (error) {
            };
            AddSavedPaymentPopupController.prototype.getTokenExIframeConfig = function (tokenExDto) {
                return {
                    origin: tokenExDto.origin,
                    timestamp: tokenExDto.timestamp,
                    tokenExID: tokenExDto.tokenExId,
                    tokenScheme: tokenExDto.tokenScheme,
                    authenticationKey: tokenExDto.authenticationKey,
                    styles: {
                        base: "font-family: Arial, sans-serif;padding: 0.5rem;border: 1px solid rgba(0, 0, 0, 0.2);margin: 0;width: 100%;font-size: 14px;line-height: 30px;height: 2.7em;box-sizing: border-box;-moz-box-sizing: border-box;",
                        focus: "outline: 0;",
                        error: "box-shadow: 0 0 6px 0 rgba(224, 57, 57, 0.5);border: 1px solid rgba(224, 57, 57, 0.5);"
                    },
                    pci: true,
                    enableValidateOnBlur: true,
                    inputType: "text",
                    enablePrettyFormat: true
                };
            };
            AddSavedPaymentPopupController.prototype.convertTokenExCardType = function (cardType) {
                if (cardType.indexOf("american") > -1) {
                    return "AMERICAN EXPRESS";
                }
                else {
                    return cardType.toUpperCase();
                }
            };
            AddSavedPaymentPopupController.$inject = ["coreService", "$scope", "$rootScope", "websiteService", "accountService", "customerService", "addSavedPaymentPopupService", "spinnerService", "settingsService"];
            return AddSavedPaymentPopupController;
        }());
        account.AddSavedPaymentPopupController = AddSavedPaymentPopupController;
        var AddSavedPaymentPopupService = /** @class */ (function (_super) {
            __extends(AddSavedPaymentPopupService, _super);
            function AddSavedPaymentPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddSavedPaymentPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-add-saved-payment-popup></isc-add-saved-payment-popup>";
            };
            return AddSavedPaymentPopupService;
        }(base.BasePopupService));
        account.AddSavedPaymentPopupService = AddSavedPaymentPopupService;
        angular
            .module("insite")
            .controller("AddSavedPaymentPopupController", AddSavedPaymentPopupController)
            .service("addSavedPaymentPopupService", AddSavedPaymentPopupService)
            .directive("iscAddSavedPaymentPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddSavedPaymentPopup",
            scope: {},
            controller: "AddSavedPaymentPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.add-saved-payment-popup.controller.js.map