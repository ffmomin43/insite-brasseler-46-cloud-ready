module insite.account {
    "use strict";
    import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;

    export class EditSavedPaymentPopupController {
        savedPayments: AccountPaymentProfileModel[];
        afterSaveFn: Function;
        savedPayment: AccountPaymentProfileModel;
        expirationYears: KeyValuePair<string, string>[];
        countries: CountryModel[];
        copyAddressFromBillTo: boolean;
        billTo: BillToModel;

        description: string;
        expirationYear: KeyValuePair<string, string>;
        expirationMonth: string;
        maskedCardNumber: string;
        cardHolderName: string;
        address1: string;
        address2: string;
        city: string;
        state: StateModel;
        postalCode: string;
        country: CountryModel;
        isDefault: boolean;
        isDescriptionAlreadyExists: boolean;

        static $inject = ["coreService", "$scope", "$rootScope", "websiteService", "accountService", "customerService", "editSavedPaymentPopupService"];

        constructor(
            protected coreService: core.ICoreService,
            protected $scope: ISelectPickUpLocationPopupScope,
            protected $rootScope: ng.IRootScopeService,
            protected websiteService: websites.IWebsiteService,
            protected accountService: account.IAccountService,
            protected customerService: customers.ICustomerService,
            protected editSavedPaymentPopupService: IEditSavedPaymentPopupService) {
        }

        $onInit(): void {
            this.editSavedPaymentPopupService.registerDisplayFunction((data) => {
                this.savedPayment = data.savedPayment;
                this.savedPayments = data.savedPayments;
                this.afterSaveFn = data.afterSaveFn;
                this.fillData();
                this.coreService.displayModal("#popup-edit-saved-payment");
            });

            this.$scope.$watch("vm.copyAddressFromBillTo", (newValue) => {
                if (!newValue) {
                    return;
                }

                if (this.billTo) {
                    this.setBillToAddress();
                    return;
                }

                this.customerService.getBillTo("").then(
                    (billTo: BillToModel) => { this.getBillToCompleted(billTo); },
                    (error: any) => { this.getBillToFailed(error); });
            });

            this.$scope.$watch("vm.country", (newValue: CountryModel, oldValue: CountryModel) => {
                if (!oldValue) {
                    return;
                }

                if (!newValue) {
                    this.state = null;
                    return;
                }

                if (newValue.states && newValue.states.length > 0) {
                    if (this.state && newValue.states.some(o => o.abbreviation === this.state.abbreviation)) {
                        this.state = newValue.states.find(o => o.abbreviation === this.state.abbreviation);
                    } else {
                        this.state = newValue.states[0];
                    }
                } else {
                    this.state = null;
                }
            });

            this.$scope.$watch("vm.description", (newValue: string) => {
                if (!newValue || !this.savedPayments || this.savedPayments.length === 0) {
                    return;
                }

                this.isDescriptionAlreadyExists = this.savedPayments.some(o => o.cardIdentifier !== this.savedPayment.cardIdentifier && o.description === newValue);
            });
        }

        protected getBillToCompleted(billTo: BillToModel): void {
            this.billTo = billTo;
            this.setBillToAddress();
        }

        protected getBillToFailed(error: any): void {
        }

        protected setBillToAddress(): void {
            if (!this.billTo) {
                return;
            }

            this.address1 = this.billTo.address1;
            this.address2 = this.billTo.address2;
            this.country = this.countries.find(o => o.abbreviation === this.billTo.country.abbreviation);
            if (this.country && this.country.states && this.country.states.length > 0) {
                this.state = this.country.states.find(o => o.abbreviation === this.billTo.state.abbreviation);
            }
            this.city = this.billTo.city;
            this.postalCode = this.billTo.postalCode;
        }

        protected fillData(): void {
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

            this.expirationYears = lodash.range(new Date().getFullYear(), new Date().getFullYear() + 10).map(o => {
                return { key: o.toString().substring(2), value: o.toString() };
            });

            this.expirationMonth = this.savedPayment.expirationDate.split("/")[0];
            const expirationYearKey = this.savedPayment.expirationDate.split("/")[1];
            this.expirationYear = this.expirationYears.find(o => o.key === expirationYearKey);

            this.websiteService.getCountries("states").then(
                (countryCollection: CountryCollectionModel) => { this.getCountriesCompleted(countryCollection); },
                (error: any) => { this.getCountriesFailed(error); });
        }

        protected getCountriesCompleted(countryCollection: CountryCollectionModel): void {
            this.countries = countryCollection.countries;
            if (this.savedPayment) {
                this.country = this.countries.find(o => o.abbreviation === this.savedPayment.country);
                if (this.country && this.country.states && this.country.states.length > 0) {
                    this.state = this.country.states.find(o => o.abbreviation === this.savedPayment.state);
                }
            }
        }

        protected getCountriesFailed(error: any): void {
        }

        closeModal(): void {
            this.coreService.closeModal("#popup-edit-saved-payment");
        }

        save(): void {
            if (!this.validate()) {
                return;
            }

            const model = {
                description: this.description,
                expirationDate: `${this.expirationMonth}/${this.expirationYear.key}`,
                cardHolderName: this.cardHolderName,
                address1: this.address1,
                address2: this.address2,
                city: this.city,
                state: this.state ? this.state.abbreviation : "",
                postalCode: this.postalCode,
                country: this.country.abbreviation,
                isDefault: this.isDefault
            } as AccountPaymentProfileModel;

            this.accountService.updatePaymentProfile(this.savedPayment.id, model).then(
                (paymentProfile: AccountPaymentProfileModel) => { this.updatePaymentProfileCompleted(paymentProfile); },
                (error: any) => { this.updatePaymentProfileFailed(error); });
        }

        protected updatePaymentProfileCompleted(paymentProfile: AccountPaymentProfileModel): void {
            if (this.afterSaveFn && typeof (this.afterSaveFn) === "function") {
                this.afterSaveFn();
            }

            this.closeModal();
        }

        protected updatePaymentProfileFailed(error: any): void {
        }

        protected validate(): boolean {
            if (this.isDescriptionAlreadyExists) {
                return false;
            }

            if (!angular.element("#editSavedPaymentForm").validate().form()) {
                return false;
            }

            return true;
        }
    }

    export interface IEditSavedPaymentPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class EditSavedPaymentPopupService extends base.BasePopupService<any> implements IEditSavedPaymentPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-edit-saved-payment-popup></isc-edit-saved-payment-popup>";
        }
    }

    angular
        .module("insite")
        .controller("EditSavedPaymentPopupController", EditSavedPaymentPopupController)
        .service("editSavedPaymentPopupService", EditSavedPaymentPopupService)
        .directive("iscEditSavedPaymentPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-EditSavedPaymentPopup",
            scope: {},
            controller: "EditSavedPaymentPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}