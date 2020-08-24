module insite.cart {
    "use strict";
    import SessionService = insite.account.ISessionService;
    import ShipToModel = Insite.Customers.WebApi.V1.ApiModels.ShipToModel;

    export interface ICheckoutAddressControllerAttributes extends ng.IAttributes {
        reviewAndPayUrl: string;
    }

    export class CheckoutAddressController {
        cart: CartModel;
        cartId: string;
        countries: CountryModel[];
        selectedShipTo: ShipToModel;
        shipTos: ShipToModel[];
        continueCheckoutInProgress = false;
        isReadOnly = false;
        account: AccountModel;
        initialIsSubscribed: boolean;
        addressFields: AddressFieldCollectionModel;
        customerSettings: any;
        cartUri: string;
        initialShipToId: string;
        session: SessionModel;
        enableWarehousePickup: boolean;
        editMode: boolean;
        reviewAndPayUrl: string;

        static $inject = [
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

        constructor(
            protected $scope: ICartScope,
            protected $window: ng.IWindowService,
            protected cartService: ICartService,
            protected customerService: customers.ICustomerService,
            protected websiteService: websites.IWebsiteService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected accountService: account.IAccountService,
            protected settingsService: core.ISettingsService,
            protected $timeout: ng.ITimeoutService,
            protected $q: ng.IQService,
            protected sessionService: SessionService,
            protected $localStorage: common.IWindowStorage,
            protected $attrs: ICheckoutAddressControllerAttributes,
            protected $rootScope: ng.IRootScopeService) {
        }

        $onInit(): void {
            this.cartId = this.queryString.get("cartId");
            this.reviewAndPayUrl = this.$attrs.reviewAndPayUrl;
            const referringPath = this.coreService.getReferringPath();
            this.editMode = referringPath && referringPath.toLowerCase().indexOf(this.reviewAndPayUrl.toLowerCase()) !== -1;

            this.websiteService.getAddressFields().then(
                (model: AddressFieldCollectionModel) => { this.getAddressFieldsCompleted(model); });

            this.accountService.getAccount().then(
                (account: AccountModel) => { this.getAccountCompleted(account); },
                (error: any) => { this.getAccountFailed(error); });

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.$scope.$on("sessionUpdated", (event, session) => {
                this.onSessionUpdated(session);
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.customerSettings = settingsCollection.customerSettings;
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
        }

        protected getSessionFailed(error: any): void {
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.session = session;
        }

        protected getAddressFieldsCompleted(addressFields: AddressFieldCollectionModel): void {
            this.addressFields = addressFields;

            this.cartService.expand = "shiptos,validation";
            this.cartService.getCart(this.cartId).then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cartService.expand = "";
            this.cart = cart;
            if (this.cart.shipTo) {
                this.initialShipToId = this.cart.shipTo.id;
            }

            this.enableEditModeIfRequired();

            this.websiteService.getCountries("states").then(
                (countryCollection: CountryCollectionModel) => { this.getCountriesCompleted(countryCollection); },
                (error: any) => { this.getCountriesFailed(error); });
        }

        protected getCartFailed(error: any): void {
            this.cartService.expand = "";
        }

        protected enableEditModeIfRequired(): void {
            const customers = [this.cart.billTo, this.cart.shipTo];
            for (let i = 0; i < customers.length; i++) {
                if (customers[i] && customers[i].validation) {
                    for (let property in customers[i].validation) {
                        if (customers[i].validation[property].isRequired && !customers[i][property]) {
                            this.enableEditMode();
                            break;
                        }
                    }
                }
            }
        }

        protected getAccountCompleted(account: AccountModel): void {
            this.account = account;
            this.initialIsSubscribed = account.isSubscribed;
        }

        protected getAccountFailed(error: any): void {
        }

        protected getCountriesCompleted(countryCollection: CountryCollectionModel) {
            this.countries = countryCollection.countries;
            this.setUpBillTo();
            this.setUpShipTos();
            this.setSelectedShipTo();
        }

        protected getCountriesFailed(error: any): void {
        }

        protected setUpBillTo(): void {
            if (this.onlyOneCountryToSelect()) {
                this.selectFirstCountryForAddress(this.cart.billTo);
                this.setStateRequiredRule("bt", this.cart.billTo);
            }

            this.replaceObjectWithReference(this.cart.billTo, this.countries, "country");
            if (this.cart.billTo.country) {
                this.replaceObjectWithReference(this.cart.billTo, this.cart.billTo.country.states, "state");
            }
        }

        protected setUpShipTos(): void {
            this.shipTos = angular.copy(this.cart.billTo.shipTos);

            let shipToBillTo: ShipToModel = null;
            this.shipTos.forEach(shipTo => {
                if (shipTo.country && shipTo.country.states) {
                    this.replaceObjectWithReference(shipTo, this.countries, "country");
                    this.replaceObjectWithReference(shipTo, shipTo.country.states, "state");
                }

                if (shipTo.id === this.cart.billTo.id) {
                    shipToBillTo = shipTo;
                }
            });

            // if this billTo was returned in the shipTos, replace the billTo in the shipTos array
            // with the actual billto object so that updating one side updates the other side
            if (shipToBillTo) {
                this.cart.billTo.label = shipToBillTo.label;
                this.shipTos.splice(this.shipTos.indexOf(shipToBillTo), 1); // remove the billto that's in the shiptos array
                this.shipTos.unshift(this.cart.billTo as any as ShipToModel); // add the actual billto to top of array
            }
        }

        protected setSelectedShipTo(): void {
            this.selectedShipTo = this.cart.shipTo;

            this.shipTos.forEach(shipTo => {
                if (this.cart.shipTo && shipTo.id === this.cart.shipTo.id || !this.selectedShipTo && shipTo.isNew) {
                    this.selectedShipTo = shipTo;
                }
            });

            if (this.selectedShipTo && this.selectedShipTo.id === this.cart.billTo.id) {
                // don't allow editing the billTo from the shipTo side if the billTo is selected as the shipTo
                this.isReadOnly = true;
            }
        }

        checkSelectedShipTo(): void {
            if (this.billToAndShipToAreSameCustomer()) {
                this.isReadOnly = true;
            } else {
                this.isReadOnly = false;
            }

            if (this.onlyOneCountryToSelect()) {
                this.selectFirstCountryForAddress(this.selectedShipTo);
                this.setStateRequiredRule("st", this.selectedShipTo);
            }

            this.updateAddressFormValidation();
        }

        protected onlyOneCountryToSelect(): boolean {
            return this.countries.length === 1;
        }

        protected selectFirstCountryForAddress(address: BaseAddressModel): void {
            if (!address.country) {
                address.country = this.countries[0];
            }
        }

        protected billToAndShipToAreSameCustomer(): boolean {
            return this.selectedShipTo.id === this.cart.billTo.id;
        }

        protected updateAddressFormValidation(): void {
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
        }

        protected resetAddressFormValidation(): void {
            $("#addressForm").validate().resetForm();
        }

        protected updateValidationRules(fieldName, rules): void {
            const convertedRules = this.convertValidationToJQueryRules(rules);
            this.updateValidationRulesForField(fieldName, convertedRules);
        }

        protected convertValidationToJQueryRules(rules: FieldValidationDto): JQueryValidation.RulesDictionary {
            if (rules.maxLength) {
                return {
                    required: rules.isRequired,
                    maxlength: rules.maxLength
                };
            }

            return {
                required: rules.isRequired
            };
        }

        protected updateValidationRulesForField(fieldName: string, rules: JQueryValidation.RulesDictionary): void {
            $(`#${fieldName}`).rules("remove", "required,maxlength");
            $(`#${fieldName}`).rules("add", rules);
        }

        setStateRequiredRule(prefix: string, address: any): void {
            if (!address.country) {
                return;
            }

            const country = this.countries.filter((elem) => {
               return elem.id === address.country.id;
            });

            const isRequired = country != null && country.length > 0 && country[0].states.length > 0;
            setTimeout(() => {
                if (!isRequired) {
                    address.state = null;
                }
            }, 100);
        }

        continueCheckout(continueUri: string, cartUri: string): void {
            const valid = $("#addressForm").validate().form();
            if (!valid) {
                angular.element("html, body").animate({
                    scrollTop: angular.element(".error:visible").offset().top
                }, 300);

                return;
            }

            this.continueCheckoutInProgress = true;
            this.cartUri = cartUri;

            if (this.cartId) {
                continueUri += `?cartId=${this.cartId}`;
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
            } else {
                this.updateShipTo(continueUri);
            }
        }

        protected updateBillTo(continueUri: string): void {
            this.customerService.updateBillTo(this.cart.billTo).then(
                (billTo: BillToModel) => { this.updateBillToCompleted(billTo, continueUri); },
                (error: any) => { this.updateBillToFailed(error); });
        }

        protected updateBillToCompleted(billTo: BillToModel, continueUri: string): void {
            this.updateShipTo(continueUri, true);
        }

        protected updateBillToFailed(error: any): void {
            this.continueCheckoutInProgress = false;
        }

        protected updateShipTo(continueUri: string, customerWasUpdated?: boolean): void {
            if (this.selectedShipTo.oneTimeAddress || this.selectedShipTo.isNew) {
                this.cart.shipTo = this.selectedShipTo;
            } else {
                const shipToMatches = this.cart.billTo.shipTos.filter(shipTo => { return shipTo.id === this.selectedShipTo.id; });
                if (shipToMatches.length === 1) {
                    this.cart.shipTo = this.selectedShipTo;
                }
            }

            if (this.cart.shipTo.id !== this.cart.billTo.id && this.customerHasEditableFields(this.cart.shipTo)) {
                this.customerService.addOrUpdateShipTo(this.cart.shipTo).then(
                    (shipTo: ShipToModel) => { this.addOrUpdateShipToCompleted(shipTo, continueUri, customerWasUpdated); },
                    (error: any) => { this.addOrUpdateShipToFailed(error); });
            } else {
                this.updateSession(this.cart, continueUri, customerWasUpdated);
            }
        }

        protected addOrUpdateShipToCompleted(shipTo: ShipToModel, continueUri: string, customerWasUpdated?: boolean): void {
            if (this.cart.shipTo.isNew) {
                this.cart.shipTo = shipTo;
            }

            // If shipTo was updated for quote or jobQuote then just update cart, otherwise update session
            if (this.cartId) {
                this.cartService.updateCart(this.cart).then(
                    (cart: CartModel) => { this.updateCartCompleted(cart, continueUri); },
                    (error: any) => { this.updateCartFailed(error); });
            } else {
                this.updateSession(this.cart, continueUri, customerWasUpdated);
            }
        }

        protected addOrUpdateShipToFailed(error: any): void {
            this.continueCheckoutInProgress = false;
        }

        protected updateCartCompleted(cart: CartModel, continueUri: string): void {
            this.getCartAfterChangeShipTo(cart, continueUri);
        }

        protected updateCartFailed(error: any): void {
        }

        protected getCartAfterChangeShipTo(cart: CartModel, continueUri: string): void {
            this.cartService.expand = "cartlines,shiptos,validation";
            this.cartService.getCart(this.cartId).then(
                (cart: CartModel) => { this.getCartAfterChangeShipToCompleted(cart, continueUri); },
                (error: any) => { this.getCartAfterChangeShipToFailed(error); });
        }

        protected getCartAfterChangeShipToCompleted(cart: CartModel, continueUri: string): void {
            this.cartService.expand = "";
            this.cart = cart;

            if (!cart.canCheckOut) {
                this.coreService.displayModal(angular.element("#insufficientInventoryAtCheckout"), () => {
                    this.redirectTo(this.cartUri);
                });

                this.$timeout(() => {
                    this.coreService.closeModal("#insufficientInventoryAtCheckout");
                }, 3000);
            } else {
                if (this.initialIsSubscribed !== this.account.isSubscribed) {
                    this.accountService.updateAccount(this.account).then(
                        (response: AccountModel) => { this.updateAccountCompleted(this.cart, continueUri); },
                        (error: any) => { this.updateAccountFailed(error); });
                } else {
                    this.redirectTo(continueUri);
                }
            }
        }

        protected getCartAfterChangeShipToFailed(error: any): void {
            this.continueCheckoutInProgress = false;
        }

        protected updateSession(cart: CartModel, continueUri: string, customerWasUpdated?: boolean): void {
            this.sessionService.setCustomer(this.cart.billTo.id, this.cart.shipTo.id, false, customerWasUpdated).then(
                (session: SessionModel) => { this.updateSessionCompleted(session, this.cart, continueUri); },
                (error: any) => { this.updateSessionFailed(error); });
        }

        protected updateAccountCompleted(cart: CartModel, continueUri: string): void {
            this.redirectTo(continueUri);
        }

        protected updateAccountFailed(error: any): void {
            this.continueCheckoutInProgress = false;
        }

        protected replaceObjectWithReference(model, references, objectPropertyName): void {
            references.forEach(reference => {
                if (model[objectPropertyName] && reference.id === model[objectPropertyName].id) {
                    model[objectPropertyName] = reference;
                }
            });
        }

        protected updateSessionCompleted(session: SessionModel, cart: CartModel, continueUri: string) {
            this.$rootScope.$broadcast("sessionUpdated", session);

            if (session.isRestrictedProductRemovedFromCart) {
                this.coreService.displayModal(angular.element("#removedProductsFromCart"), () => {
                    if (session.isRestrictedProductExistInCart) {
                        this.$localStorage.set("hasRestrictedProducts", true.toString());
                    }
                    this.redirectTo(this.cartUri);
                });
                this.$timeout(() => {
                    this.coreService.closeModal("#removedProductsFromCart");
                }, 5000);
                return;
            }

            if (session.isRestrictedProductExistInCart) {
                this.$localStorage.set("hasRestrictedProducts", true.toString());
                this.redirectTo(this.cartUri);
            } else {
                this.getCartAfterChangeShipTo(this.cart, continueUri);
            }
        }

        protected updateSessionFailed(error) {
            this.continueCheckoutInProgress = false;
        }

        protected redirectTo(continueUri: string) {
            if (!this.cart.shipTo || this.initialShipToId === this.cart.shipTo.id) {
                this.coreService.redirectToPath(continueUri);
            } else {
                this.coreService.redirectToPathAndRefreshPage(continueUri);
            }
        }

        protected enableEditMode(): void {
            this.editMode = true;
        }

        protected customerHasEditableFields(customer: BillToModel | ShipToModel): boolean {
            if (!customer || !customer.validation) {
                return false;
            }

            for (let property in customer.validation) {
                if (customer.validation.hasOwnProperty(property) && !customer.validation[property].isDisabled) {
                    return true;
                }
            }

            return false;
        }
    }

    angular
        .module("insite")
        .controller("CheckoutAddressController", CheckoutAddressController);
}