module insite.account {
    "use strict";
    import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;
    import TokenExDto = insite.core.TokenExDto;

    export class AddSavedPaymentPopupController {
        savedPayments: AccountPaymentProfileModel[];
        saving: boolean;
        afterSaveFn: Function;
        expirationYears: KeyValuePair<string, string>[];
        countries: CountryModel[];
        copyAddressFromBillTo: boolean;
        billTo: BillToModel;

        description: string;
        expirationYear: KeyValuePair<string, string>;
        expirationMonth: string;
        cardIdentifier: string;
        cardType: string;
        cardHolderName: string;
        address1: string;
        address2: string;
        city: string;
        state: StateModel;
        postalCode: string;
        country: CountryModel;
        isDefault: boolean;
        isDescriptionAlreadyExists: boolean;

        tokenExIframe: any;
        tokenExIframeIsLoaded: boolean;
        isInvalidCardNumber: boolean;
        isCardAlreadyExists: boolean;

        static $inject = ["coreService", "$scope", "$rootScope", "websiteService", "accountService", "customerService", "addSavedPaymentPopupService", "spinnerService", "settingsService"];

        constructor(
            protected coreService: core.ICoreService,
            protected $scope: ISelectPickUpLocationPopupScope,
            protected $rootScope: ng.IRootScopeService,
            protected websiteService: websites.IWebsiteService,
            protected accountService: account.IAccountService,
            protected customerService: customers.ICustomerService,
            protected addSavedPaymentPopupService: IAddSavedPaymentPopupService,
            protected spinnerService: core.ISpinnerService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.addSavedPaymentPopupService.registerDisplayFunction((data) => {
                this.savedPayments = data.savedPayments;
                this.afterSaveFn = data.afterSaveFn;

                if (this.countries) {
                    this.resetFields();
                } else {
                    this.fillData();
                }

                setTimeout(() => {
                    this.setUpTokenExGateway();
                }, 0, false);

                this.coreService.displayModal("#popup-add-saved-payment");
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

                this.isDescriptionAlreadyExists = this.savedPayments.some(o => o.description === newValue);
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

        protected resetFields(): void {
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
            } else {
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
        }

        protected fillData(): void {
            this.expirationYears = lodash.range(new Date().getFullYear(), new Date().getFullYear() + 10).map(o => {
                return { key: o.toString().substring(2), value: o.toString() };
            });

            this.expirationMonth = "01";
            this.expirationYear = this.expirationYears[0];

            this.websiteService.getCountries("states").then(
                (countryCollection: CountryCollectionModel) => { this.getCountriesCompleted(countryCollection); },
                (error: any) => { this.getCountriesFailed(error); });
        }

        protected getCountriesCompleted(countryCollection: CountryCollectionModel): void {
            this.countries = countryCollection.countries;
            this.country = this.countries[0];
            if (this.country.states && this.country.states.length > 0) {
                this.state = this.country.states[0];
            }
        }

        protected getCountriesFailed(error: any): void {
        }

        closeModal(): void {
            this.coreService.closeModal("#popup-add-saved-payment");
        }

        save(): void {
            if (!this.validate()) {
                return;
            }

            this.saving = true;
            this.tokenExIframe.tokenize();
        }

        protected validate(): boolean {
            if (this.isInvalidCardNumber || this.isCardAlreadyExists || this.isDescriptionAlreadyExists) {
                return false;
            }

            if (!angular.element("#addSavedPaymentForm").validate().form()) {
                return false;
            }

            return true;
        }

        protected continueSave(): void {
            const model = {
                description: this.description,
                expirationDate: `${this.expirationMonth}/${this.expirationYear.key}`,
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
            } as AccountPaymentProfileModel;

            this.accountService.addPaymentProfile(model).then(
                (paymentProfile: AccountPaymentProfileModel) => { this.addPaymentProfileCompleted(paymentProfile); },
                (error: any) => { this.addPaymentProfileFailed(error); });
        }

        protected addPaymentProfileCompleted(paymentProfile: AccountPaymentProfileModel): void {
            this.saving = false;
            if (this.afterSaveFn && typeof (this.afterSaveFn) === "function") {
                this.afterSaveFn();
            }

            this.closeModal();
        }

        protected addPaymentProfileFailed(error: any): void {
        }

        setUpTokenExGateway(): void {
            this.tokenExIframeIsLoaded = false;
            this.settingsService.getTokenExConfig().then(
                (tokenExDto: TokenExDto) => { this.getTokenExConfigCompleted(tokenExDto); },
                (error: any) => { this.getTokenExConfigFailed(error); });
        }

        protected getTokenExConfigCompleted(tokenExDto: TokenExDto): void {
            this.setUpTokenExIframe(tokenExDto);
        }

        protected setUpTokenExIframe(tokenExDto: TokenExDto): void {
            if (this.tokenExIframe) {
                this.tokenExIframe.remove();
            }

            this.tokenExIframe = new TokenEx.Iframe("addTokenExCardNumber", this.getTokenExIframeConfig(tokenExDto));

            this.tokenExIframe.load();

            this.tokenExIframe.on("load", () => {
                this.$scope.$apply(() => {
                    this.tokenExIframeIsLoaded = true;
                    this.isInvalidCardNumber = false;
                    this.isInvalidCardNumber = false;
                });
            });

            this.tokenExIframe.on("tokenize", (data) => {
                this.$scope.$apply(() => {
                    this.cardIdentifier = data.token;
                    this.cardType = this.convertTokenExCardType(data.cardType);
                    this.continueSave();
                });
            });

            this.tokenExIframe.on("validate", (data) => {
                this.$scope.$apply(() => {
                    if (data.isValid) {
                        this.isInvalidCardNumber = false;
                        this.isCardAlreadyExists = this.savedPayments.some(
                            o => o.maskedCardNumber.substring(o.maskedCardNumber.length - 4) === data.lastFour && o.cardType === this.convertTokenExCardType(data.cardType));
                    } else {
                        if (this.saving) {
                            this.isInvalidCardNumber = true;
                        } else if (data.validator && data.validator !== "required") {
                            this.isInvalidCardNumber = true;
                        }
                        this.isCardAlreadyExists = false;
                    }

                    if (this.saving && (this.isInvalidCardNumber || this.isCardAlreadyExists)) {
                        this.saving = false;
                        this.spinnerService.hide();
                    }
                });
            });

            this.tokenExIframe.on("error", () => {
                this.$scope.$apply(() => {
                    // if there was some sort of unknown error from tokenex tokenization (the example they gave was authorization timing out)
                    // try to completely re-initialize the tokenex iframe
                    this.setUpTokenExGateway();
                });
            });
        }

        protected getTokenExConfigFailed(error: any): void {
        }

        protected getTokenExIframeConfig(tokenExDto: TokenExDto): any {
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
        }

        private convertTokenExCardType(cardType: string): string {
            if (cardType.indexOf("american") > -1) {
                return "AMERICAN EXPRESS";
            } else {
                return cardType.toUpperCase();
            }
        }
    }

    export interface IAddSavedPaymentPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class AddSavedPaymentPopupService extends base.BasePopupService<any> implements IAddSavedPaymentPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-add-saved-payment-popup></isc-add-saved-payment-popup>";
        }
    }

    angular
        .module("insite")
        .controller("AddSavedPaymentPopupController", AddSavedPaymentPopupController)
        .service("addSavedPaymentPopupService", AddSavedPaymentPopupService)
        .directive("iscAddSavedPaymentPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddSavedPaymentPopup",
            scope: {},
            controller: "AddSavedPaymentPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}