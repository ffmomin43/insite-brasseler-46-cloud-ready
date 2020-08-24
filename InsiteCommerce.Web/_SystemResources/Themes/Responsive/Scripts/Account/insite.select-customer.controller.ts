module insite.account {
    "use strict";

    export interface ISelectCustomerControllerAttributes extends ng.IAttributes {
        homePageUrl: string;
        dashboardUrl: string;
        addressesUrl: string;
        checkoutAddressUrl: string;
        reviewAndPayUrl: string;
        cartUrl: string;
    }

    export class SelectCustomerController {
        private invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";

        billTo: BillToModel;
        totalBillTosCount: number;
        dashboardUrl: string;
        errorMessage = "";
        returnUrl: string;
        shipTo: ShipToModel;
        totalShipTosCount: number;
        homePageUrl: string;
        checkoutAddressUrl: string;
        reviewAndPayUrl: string;
        cartUrl: string;
        addressesUrl: string;
        cart: CartModel;
        useDefaultCustomer: boolean;
        showIsDefaultCheckbox: boolean;

        defaultPageSize = 20;
        billToSearch: string;
        billToOptions: any;
        billToOptionsPlaceholder: string;
        shipToSearch: string;
        shipToOptions: any;
        shipToOptionsPlaceholder: string;
        recipientAddressOptionsPlaceholder: string;
        noShipToAndCantCreate = false;
        session: SessionModel;
        fulfillmentMethod: string;
        pickUpWarehouse: WarehouseModel;
        enableWarehousePickup = false;

        static $inject = [
            "$scope",
            "$window",
            "accountService",
            "sessionService",
            "customerService",
            "$attrs",
            "settingsService",
            "cartService",
            "queryString",
            "coreService",
            "spinnerService",
            "$timeout",
            "addressErrorPopupService",
            "apiErrorPopupService",
            "$localStorage"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected accountService: IAccountService,
            protected sessionService: ISessionService,
            protected customerService: customers.ICustomerService,
            protected $attrs: ISelectCustomerControllerAttributes,
            protected settingsService: core.ISettingsService,
            protected cartService: cart.ICartService,
            protected queryString: common.IQueryStringService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected $timeout: ng.ITimeoutService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected $localStorage: common.IWindowStorage) {
        }

        $onInit(): void {
            this.homePageUrl = this.$attrs.homePageUrl;
            this.dashboardUrl = this.$attrs.dashboardUrl;
            this.addressesUrl = this.$attrs.addressesUrl;
            this.checkoutAddressUrl = this.$attrs.checkoutAddressUrl;
            this.reviewAndPayUrl = this.$attrs.reviewAndPayUrl;
            this.cartUrl = this.$attrs.cartUrl;

            this.returnUrl = this.queryString.get("returnUrl");
            if (!this.returnUrl) {
                this.returnUrl = this.homePageUrl;
            }

            this.cart = this.cartService.getLoadedCurrentCart();
            if (!this.cart) {
                this.$scope.$on("cartLoaded", (event: ng.IAngularEvent, cart: CartModel) => {
                    this.onCartLoaded(cart);
                });
            }

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected onCartLoaded(cart: CartModel): void {
            this.cart = cart;
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            const requireSelectCustomerOnSignIn = settingsCollection.accountSettings.requireSelectCustomerOnSignIn;
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(requireSelectCustomerOnSignIn, session); },
                (error: any) => { this.getSessionFailed(error); });

            this.initCustomerAutocompletes(settingsCollection);
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSessionCompleted(requireSelectCustomerOnSignIn: boolean, session: SessionModel) {
            this.session = session;
            this.fulfillmentMethod = session.fulfillmentMethod;
            this.pickUpWarehouse = session.pickUpWarehouse;
            this.showIsDefaultCheckbox = !requireSelectCustomerOnSignIn && !session.hasDefaultCustomer;
        }

        protected getSessionFailed(error: any): void {
        }

        hasCustomerWithLabel(customers: any, label: string): boolean {
            for (let i = 0; i < customers.length; i++) {
                if (customers[i].label === label) {
                    return true;
                }
            }

            return false;
        }

        renderMessage(values: string[], templateId: string): string {
            let template = angular.element(`#${templateId}`).html();
            for (var i = 0; i < values.length; i++) {
                template = template.replace(`{${i}}`, values[i]);
            }

            return template;
        }

        initCustomerAutocompletes(settingsCollection: core.SettingsCollection): void {
            const customerSettings = settingsCollection.customerSettings;
            const billToValues = ["{{vm.defaultPageSize}}", "{{vm.totalBillTosCount}}"];
            this.billToOptions = {
                headerTemplate: this.renderMessage(billToValues, "totalBillToCountTemplate"),
                dataSource: new kendo.data.DataSource({
                    serverFiltering: true,
                    serverPaging: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => {
                            this.onBillToAutocompleteRead(options);
                        }
                    }
                }),
                select: (event: kendo.ui.AutoCompleteSelectEvent) => {
                    this.onBillToAutocompleteSelect(event);
                },
                minLength: 0,
                dataTextField: "label",
                dataValueField: "id",
                placeholder: this.billToOptionsPlaceholder
            };

            const shipToValues = ["{{vm.defaultPageSize}}", "{{vm.totalShipTosCount}}"];
            this.shipToOptions = {
                headerTemplate: this.renderMessage(shipToValues, "totalShipToCountTemplate"),
                dataSource: new kendo.data.DataSource({
                    serverFiltering: true,
                    serverPaging: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => {
                            this.onShipToAutocompleteRead(options, customerSettings);
                        }
                    }
                }),
                select: (event: kendo.ui.AutoCompleteSelectEvent) => {
                    this.onShipToAutocompleteSelect(event);
                },
                minLength: 0,
                dataTextField: "label",
                dataValueField: "id",
                placeholder: this.getShipToPlaceholder()
            };

            this.billToOptions.dataSource.read();
        }

        protected getDefaultPagination(): PaginationModel {
            return { page: 1, pageSize: this.defaultPageSize } as PaginationModel;
        }

        protected onBillToAutocompleteRead(options: kendo.data.DataSourceTransportReadOptions): void {
            this.spinnerService.show();
            this.customerService.getBillTos("state,validation", this.billToSearch, this.getDefaultPagination()).then(
                (billToCollection: BillToCollectionModel) => { this.getBillTosCompleted(options, billToCollection); },
                (error: any) => { this.getBillTosFailed(error); });
        }

        protected onBillToAutocompleteSelect(event: kendo.ui.AutoCompleteSelectEvent): void {
            if (event.item == null) {
                return;
            }

            const dataItem = event.sender.dataItem(event.item.index());
            this.selectBillTo(dataItem);
        }

        protected onShipToAutocompleteRead(options: kendo.data.DataSourceTransportReadOptions, customerSettings: any): void {
            this.spinnerService.show();
            this.customerService.getShipTos("excludeshowall,excludeonetime,validation", this.shipToSearch, this.getDefaultPagination(), this.billTo.id).then(
                (shipToCollection: ShipToCollectionModel) => { this.getShipTosCompleted(options, customerSettings, shipToCollection); },
                (error: any) => { this.getShipTosFailed(error); });
        }

        protected onShipToAutocompleteSelect(event: kendo.ui.AutoCompleteSelectEvent): void {
            if (event.item == null) {
                return;
            }

            const dataItem = event.sender.dataItem(event.item.index());
            this.selectShipTo(dataItem);
        }

        protected getBillTosCompleted(options: kendo.data.DataSourceTransportReadOptions, billToCollection: BillToCollectionModel): void {
            const billTos = billToCollection.billTos;
            this.totalBillTosCount = billToCollection.pagination.totalItemCount;

            this.noShipToAndCantCreate = false;
            if (!this.hasCustomerWithLabel(billTos, this.billToSearch)) {
                this.billTo = null;
            }

            if (billTos && billTos.length === 1 && !this.billToSearch) {
                this.billToSearch = billTos[0].label;
                this.selectBillTo(billTos[0]);
                this.changeBillTo();
            }

            // need to wrap this in setTimeout for prevent double scroll
            setTimeout(() => { options.success(billTos); }, 0);
        }

        protected getBillTosFailed(error: any): void {
        }

        protected getShipTosCompleted(options: kendo.data.DataSourceTransportReadOptions, customerSettings: any, shipToCollection: ShipToCollectionModel): void {
            const shipTos = shipToCollection.shipTos;
            this.totalShipTosCount = shipToCollection.pagination.totalItemCount;
            if (this.totalShipTosCount === 1) {
                this.selectShipTo(shipTos[0]);
                this.shipToSearch = shipTos[0].label;
            }

            if (!this.hasCustomerWithLabel(shipTos, this.shipToSearch)) {
                this.shipTo = null;
            }

            this.noShipToAndCantCreate = false;
            if (!customerSettings.allowCreateNewShipToAddress && !this.shipToSearch && shipTos.length === 0) {
                this.noShipToAndCantCreate = true;
            }

            // need to wrap this in setTimeout for prevent double scroll
            setTimeout(() => { options.success(shipTos); }, 0);
        }

        protected getShipTosFailed(error: any): void {
        }

        openAutocomplete($event: ng.IAngularEvent, selector: string): void {
            const autoCompleteElement = angular.element(selector) as any;
            const kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
            kendoAutoComplete.popup.open();
        }

        selectBillTo(dataItem: BillToModel): void {
            this.billTo = dataItem;
            this.shipTo = null;
            this.shipToSearch = "";

            this.shipToOptions.dataSource.read();
        }

        selectShipTo(dataItem: ShipToModel): void {
            this.shipTo = dataItem;
        }

        cancel(): void {
            this.$window.location.href = this.returnUrl;
        }

        setCustomer(): void {
            if (!this.billTo || !this.shipTo) {
                return;
            }

            const currentContext = this.sessionService.getContext();
            currentContext.fulfillmentMethod = this.fulfillmentMethod;
            currentContext.pickUpWarehouseId = this.fulfillmentMethod === "Ship" ? null : (this.pickUpWarehouse ? this.pickUpWarehouse.id : currentContext.pickUpWarehouseId);
            this.sessionService.setContext(currentContext);

            const session: SessionModel = {
                customerWasUpdated: false,
                billTo: { id: this.billTo.id, isDefault: this.useDefaultCustomer },
                shipTo: { id: this.shipTo.id },
                fulfillmentMethod: this.fulfillmentMethod,
                pickUpWarehouse: this.fulfillmentMethod === "PickUp" ? this.pickUpWarehouse : null
            } as any;

            this.sessionService.updateSession(session).then(
                (session: SessionModel) => { this.setCustomerCompleted(session); },
                (error: any) => { this.setCustomerFailed(error); });
        }

        protected setCustomerCompleted(session: SessionModel): void {
            const currentContext = this.sessionService.getContext();
            currentContext.shipToId = this.shipTo.id;
            currentContext.billToId = this.billTo.id;
            this.sessionService.setContext(currentContext);

            session.shipTo = this.shipTo;
            const redirectFn = () => {
                this.spinnerService.show();
                this.sessionService.redirectAfterSelectCustomer(
                    session,
                    this.cart.canBypassCheckoutAddress,
                    this.dashboardUrl,
                    this.returnUrl,
                    this.checkoutAddressUrl,
                    this.reviewAndPayUrl,
                    this.addressesUrl,
                    this.cartUrl,
                    this.cart.canCheckOut);
            };

            if (session.isRestrictedProductExistInCart) {
                this.$localStorage.set("hasRestrictedProducts", true.toString());
            }

            redirectFn();
        }

        protected setCustomerFailed(error: any): void {
            if (error.message === this.invalidAddressException) {
                this.addressErrorPopupService.display(null);
            } else {
                this.apiErrorPopupService.display(error);
            }
        }

        changeBillTo(): void {
            if (this.billTo && this.billTo.shipTos && this.billTo.shipTos.length === 1) {
                this.shipTo = this.billTo.shipTos[0];
            } else {
                this.shipTo = null;
            }
        }

        setAsDefaultCustomer(): void {
            if (this.useDefaultCustomer) {
                this.coreService.displayModal(angular.element("#defaultCustomerChangedMessage"));
            }
        }

        onChangeDeliveryMethod() {

            // Need this code because kendo autocomplete doesn't support dynamic placeholder changing
            angular.element("#selectShipTo").attr("placeholder", this.getShipToPlaceholder());
        }

        protected getShipToPlaceholder(): string {
            return this.enableWarehousePickup && this.fulfillmentMethod === 'PickUp' ? this.recipientAddressOptionsPlaceholder : this.shipToOptionsPlaceholder;
        }
    }

    angular
        .module("insite")
        .controller("SelectCustomerController", SelectCustomerController);
}