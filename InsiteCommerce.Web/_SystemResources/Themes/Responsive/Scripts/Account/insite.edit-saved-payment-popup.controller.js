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
        var EditSavedPaymentPopupController = /** @class */ (function () {
            function EditSavedPaymentPopupController(coreService, $scope, $rootScope, websiteService, accountService, customerService, editSavedPaymentPopupService) {
                this.coreService = coreService;
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.websiteService = websiteService;
                this.accountService = accountService;
                this.customerService = customerService;
                this.editSavedPaymentPopupService = editSavedPaymentPopupService;
            }
            EditSavedPaymentPopupController.prototype.$onInit = function () {
                var _this = this;
                this.editSavedPaymentPopupService.registerDisplayFunction(function (data) {
                    _this.savedPayment = data.savedPayment;
                    _this.savedPayments = data.savedPayments;
                    _this.afterSaveFn = data.afterSaveFn;
                    _this.fillData();
                    _this.coreService.displayModal("#popup-edit-saved-payment");
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
                    _this.isDescriptionAlreadyExists = _this.savedPayments.some(function (o) { return o.cardIdentifier !== _this.savedPayment.cardIdentifier && o.description === newValue; });
                });
            };
            EditSavedPaymentPopupController.prototype.getBillToCompleted = function (billTo) {
                this.billTo = billTo;
                this.setBillToAddress();
            };
            EditSavedPaymentPopupController.prototype.getBillToFailed = function (error) {
            };
            EditSavedPaymentPopupController.prototype.setBillToAddress = function () {
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
            EditSavedPaymentPopupController.prototype.fillData = function () {
                var _this = this;
                if (!this.savedPayment) {
                    return;
                }
                this.copyAddressFromBillTo = false;
                this.description = this.savedPayment.description;
                this.maskedCardNumber = this.savedPayment.maskedCardNumber;
                this.cardHolderName = this.savedPayment.cardHolderName;
                this.address1 = this.savedPayment.address1;
                this.address2 = this.savedPayment.address2;
                this.city = this.savedPayment.city;
                this.postalCode = this.savedPayment.postalCode;
                this.isDefault = this.savedPayment.isDefault;
                angular.element("#editSavedPaymentForm").validate().resetForm();
                angular.element("#editSavedPaymentForm input.error").removeClass("error");
                this.expirationYears = lodash.range(new Date().getFullYear(), new Date().getFullYear() + 10).map(function (o) {
                    return { key: o.toString().substring(2), value: o.toString() };
                });
                this.expirationMonth = this.savedPayment.expirationDate.split("/")[0];
                var expirationYearKey = this.savedPayment.expirationDate.split("/")[1];
                this.expirationYear = this.expirationYears.find(function (o) { return o.key === expirationYearKey; });
                this.websiteService.getCountries("states").then(function (countryCollection) { _this.getCountriesCompleted(countryCollection); }, function (error) { _this.getCountriesFailed(error); });
            };
            EditSavedPaymentPopupController.prototype.getCountriesCompleted = function (countryCollection) {
                var _this = this;
                this.countries = countryCollection.countries;
                if (this.savedPayment) {
                    this.country = this.countries.find(function (o) { return o.abbreviation === _this.savedPayment.country; });
                    if (this.country && this.country.states && this.country.states.length > 0) {
                        this.state = this.country.states.find(function (o) { return o.abbreviation === _this.savedPayment.state; });
                    }
                }
            };
            EditSavedPaymentPopupController.prototype.getCountriesFailed = function (error) {
            };
            EditSavedPaymentPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-edit-saved-payment");
            };
            EditSavedPaymentPopupController.prototype.save = function () {
                var _this = this;
                if (!this.validate()) {
                    return;
                }
                var model = {
                    description: this.description,
                    expirationDate: this.expirationMonth + "/" + this.expirationYear.key,
                    cardHolderName: this.cardHolderName,
                    address1: this.address1,
                    address2: this.address2,
                    city: this.city,
                    state: this.state ? this.state.abbreviation : "",
                    postalCode: this.postalCode,
                    country: this.country.abbreviation,
                    isDefault: this.isDefault
                };
                this.accountService.updatePaymentProfile(this.savedPayment.id, model).then(function (paymentProfile) { _this.updatePaymentProfileCompleted(paymentProfile); }, function (error) { _this.updatePaymentProfileFailed(error); });
            };
            EditSavedPaymentPopupController.prototype.updatePaymentProfileCompleted = function (paymentProfile) {
                if (this.afterSaveFn && typeof (this.afterSaveFn) === "function") {
                    this.afterSaveFn();
                }
                this.closeModal();
            };
            EditSavedPaymentPopupController.prototype.updatePaymentProfileFailed = function (error) {
            };
            EditSavedPaymentPopupController.prototype.validate = function () {
                if (this.isDescriptionAlreadyExists) {
                    return false;
                }
                if (!angular.element("#editSavedPaymentForm").validate().form()) {
                    return false;
                }
                return true;
            };
            EditSavedPaymentPopupController.$inject = ["coreService", "$scope", "$rootScope", "websiteService", "accountService", "customerService", "editSavedPaymentPopupService"];
            return EditSavedPaymentPopupController;
        }());
        account.EditSavedPaymentPopupController = EditSavedPaymentPopupController;
        var EditSavedPaymentPopupService = /** @class */ (function (_super) {
            __extends(EditSavedPaymentPopupService, _super);
            function EditSavedPaymentPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            EditSavedPaymentPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-edit-saved-payment-popup></isc-edit-saved-payment-popup>";
            };
            return EditSavedPaymentPopupService;
        }(base.BasePopupService));
        account.EditSavedPaymentPopupService = EditSavedPaymentPopupService;
        angular
            .module("insite")
            .controller("EditSavedPaymentPopupController", EditSavedPaymentPopupController)
            .service("editSavedPaymentPopupService", EditSavedPaymentPopupService)
            .directive("iscEditSavedPaymentPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-EditSavedPaymentPopup",
            scope: {},
            controller: "EditSavedPaymentPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.edit-saved-payment-popup.controller.js.map