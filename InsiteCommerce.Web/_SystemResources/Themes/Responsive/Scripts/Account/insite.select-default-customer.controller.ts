module insite.account {
    "use strict";

    export class SelectDefaultCustomerController extends SelectCustomerController {
        billTos: BillToModel[];
        account: AccountModel;
        showSelectDefaultCustomer = true;
        initialBillTo: BillToModel;
        initialShipTo: ShipToModel;
        initialUseDefaultCustomer: boolean;
        shipFulfillmentMethod = "Ship";
        pickupFulfillmentMethod = "PickUp";

        $onInit(): void {
            this.useDefaultCustomer = false;
            this.fulfillmentMethod = this.account.defaultFulfillmentMethod;
            this.pickUpWarehouse = this.account.defaultWarehouse;
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("PickupWarehouseSelected", (event: ng.IAngularEvent, data: WarehouseModel) => {
                this.pickUpWarehouse = data;
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            if (this.enableWarehousePickup && this.fulfillmentMethod === this.pickupFulfillmentMethod && this.pickUpWarehouse) {
                this.useDefaultCustomer = true;
            }

            this.customerService.getBillTos("shiptos,state,excludeonetime").then(
                (billToCollection: BillToCollectionModel) => { this.getDefaultBillTosCompleted(billToCollection); },
                (error: any) => { this.getDefaultBillTosFailed(error); });
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getDefaultBillTosCompleted(billToCollection: BillToCollectionModel): void {
            this.billTos = billToCollection.billTos;

            if (this.billTos && this.billTos.length === 1) {
                this.billTo = this.billTos[0];
                const existsShipTos = this.billTo.shipTos.filter(shipTo => {
                    return !shipTo.isNew;
                });

                if (existsShipTos.length === 1 && !this.enableWarehousePickup) {
                    this.showSelectDefaultCustomer = false;
                }

                this.changeBillTo();
            }

            const defaultBillTos = this.billTos.filter(billTo => {
                return billTo.isDefault;
            });

            if (defaultBillTos.length === 1) {
                this.useDefaultCustomer = true;

                const defaultShipTos = defaultBillTos[0].shipTos.filter(shipTo => {
                    return shipTo.isDefault;
                });

                if (defaultShipTos.length === 1) {
                    this.billTo = defaultBillTos[0];
                    this.shipTo = defaultShipTos[0];
                    this.initialBillTo = angular.copy(this.billTo);
                    this.initialShipTo = angular.copy(this.shipTo);
                }
            }

            this.initialUseDefaultCustomer = this.useDefaultCustomer;
        }

        protected getDefaultBillTosFailed(error: any): void {
        }

        setCustomer(): void {
            if ((!this.billTo || (!this.shipTo && this.fulfillmentMethod === this.shipFulfillmentMethod)) && this.useDefaultCustomer) {
                return;
            }

            const requestBillTo = angular.copy(this.billTo);
            const requestShipTo = angular.copy(this.shipTo);
            this.fulfillmentMethod = this.useDefaultCustomer ? this.fulfillmentMethod : this.shipFulfillmentMethod;
            this.account.setDefaultCustomer = true;
            this.account.defaultCustomerId = this.useDefaultCustomer ? this.shipTo.id : null;
            this.account.defaultFulfillmentMethod = this.fulfillmentMethod;
            if (this.enableWarehousePickup && this.useDefaultCustomer && this.pickUpWarehouse && this.fulfillmentMethod === this.pickupFulfillmentMethod) {
                this.account.defaultWarehouse = this.pickUpWarehouse;
                this.account.defaultWarehouseId = this.pickUpWarehouse.id;
            } else {
                this.account.defaultWarehouse = null;
                this.account.defaultWarehouseId = null;
            }

            this.accountService.updateAccount(this.account, this.account.id).then(
                (account: AccountModel) => { this.updateAccountCompleted(requestBillTo, requestShipTo, account); },
                (error: any) => { this.updateAccountFailed(error); });
        }

        protected updateAccountCompleted(requestBillTo: BillToModel, requestShipTo: ShipToModel, account: AccountModel): void {
            this.initialUseDefaultCustomer = this.useDefaultCustomer;

            if (!this.initialUseDefaultCustomer) {
                this.initialBillTo = null;
                this.initialShipTo = null;
                this.billTo = null;
                this.shipTo = null;
            } else {
                this.initialBillTo = angular.copy(requestBillTo);
                this.initialShipTo = angular.copy(requestShipTo);
            }
        }

        protected updateAccountFailed(error: any): void {
        }

        showSaveButton(): boolean {
            if (!this.useDefaultCustomer) {
                return this.initialUseDefaultCustomer !== this.useDefaultCustomer;
            }

            if (!this.billTo || !this.shipTo) {
                return false;
            }

            if (this.account.defaultFulfillmentMethod !== this.fulfillmentMethod) {
                return true;
            }

            if (this.fulfillmentMethod === this.pickupFulfillmentMethod && this.pickUpWarehouse && this.initialBillTo && this.initialShipTo) {
                return this.account.defaultWarehouseId !== this.pickUpWarehouse.id
                    || this.initialBillTo.id !== this.billTo.id
                    || this.initialShipTo.id !== this.shipTo.id;
            }

            if (this.initialBillTo && this.initialShipTo) {
                return this.initialBillTo.id !== this.billTo.id || this.initialShipTo.id !== this.shipTo.id;
            }

            return true;
        }
    }

    angular
        .module("insite")
        .controller("SelectDefaultCustomerController", SelectDefaultCustomerController);
}