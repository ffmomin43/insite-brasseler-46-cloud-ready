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
    (function (account_1) {
        "use strict";
        var SelectDefaultCustomerController = /** @class */ (function (_super) {
            __extends(SelectDefaultCustomerController, _super);
            function SelectDefaultCustomerController() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.showSelectDefaultCustomer = true;
                _this.shipFulfillmentMethod = "Ship";
                _this.pickupFulfillmentMethod = "PickUp";
                return _this;
            }
            SelectDefaultCustomerController.prototype.$onInit = function () {
                var _this = this;
                this.useDefaultCustomer = false;
                this.fulfillmentMethod = this.account.defaultFulfillmentMethod;
                this.pickUpWarehouse = this.account.defaultWarehouse;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("PickupWarehouseSelected", function (event, data) {
                    _this.pickUpWarehouse = data;
                });
            };
            SelectDefaultCustomerController.prototype.getSettingsCompleted = function (settingsCollection) {
                var _this = this;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                if (this.enableWarehousePickup && this.fulfillmentMethod === this.pickupFulfillmentMethod && this.pickUpWarehouse) {
                    this.useDefaultCustomer = true;
                }
                this.customerService.getBillTos("shiptos,state,excludeonetime").then(function (billToCollection) { _this.getDefaultBillTosCompleted(billToCollection); }, function (error) { _this.getDefaultBillTosFailed(error); });
            };
            SelectDefaultCustomerController.prototype.getSettingsFailed = function (error) {
            };
            SelectDefaultCustomerController.prototype.getDefaultBillTosCompleted = function (billToCollection) {
                this.billTos = billToCollection.billTos;
                if (this.billTos && this.billTos.length === 1) {
                    this.billTo = this.billTos[0];
                    var existsShipTos = this.billTo.shipTos.filter(function (shipTo) {
                        return !shipTo.isNew;
                    });
                    if (existsShipTos.length === 1 && !this.enableWarehousePickup) {
                        this.showSelectDefaultCustomer = false;
                    }
                    this.changeBillTo();
                }
                var defaultBillTos = this.billTos.filter(function (billTo) {
                    return billTo.isDefault;
                });
                if (defaultBillTos.length === 1) {
                    this.useDefaultCustomer = true;
                    var defaultShipTos = defaultBillTos[0].shipTos.filter(function (shipTo) {
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
            };
            SelectDefaultCustomerController.prototype.getDefaultBillTosFailed = function (error) {
            };
            SelectDefaultCustomerController.prototype.setCustomer = function () {
                var _this = this;
                if ((!this.billTo || (!this.shipTo && this.fulfillmentMethod === this.shipFulfillmentMethod)) && this.useDefaultCustomer) {
                    return;
                }
                var requestBillTo = angular.copy(this.billTo);
                var requestShipTo = angular.copy(this.shipTo);
                this.fulfillmentMethod = this.useDefaultCustomer ? this.fulfillmentMethod : this.shipFulfillmentMethod;
                this.account.setDefaultCustomer = true;
                this.account.defaultCustomerId = this.useDefaultCustomer ? this.shipTo.id : null;
                this.account.defaultFulfillmentMethod = this.fulfillmentMethod;
                if (this.enableWarehousePickup && this.useDefaultCustomer && this.pickUpWarehouse && this.fulfillmentMethod === this.pickupFulfillmentMethod) {
                    this.account.defaultWarehouse = this.pickUpWarehouse;
                    this.account.defaultWarehouseId = this.pickUpWarehouse.id;
                }
                else {
                    this.account.defaultWarehouse = null;
                    this.account.defaultWarehouseId = null;
                }
                this.accountService.updateAccount(this.account, this.account.id).then(function (account) { _this.updateAccountCompleted(requestBillTo, requestShipTo, account); }, function (error) { _this.updateAccountFailed(error); });
            };
            SelectDefaultCustomerController.prototype.updateAccountCompleted = function (requestBillTo, requestShipTo, account) {
                this.initialUseDefaultCustomer = this.useDefaultCustomer;
                if (!this.initialUseDefaultCustomer) {
                    this.initialBillTo = null;
                    this.initialShipTo = null;
                    this.billTo = null;
                    this.shipTo = null;
                }
                else {
                    this.initialBillTo = angular.copy(requestBillTo);
                    this.initialShipTo = angular.copy(requestShipTo);
                }
            };
            SelectDefaultCustomerController.prototype.updateAccountFailed = function (error) {
            };
            SelectDefaultCustomerController.prototype.showSaveButton = function () {
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
            };
            return SelectDefaultCustomerController;
        }(account_1.SelectCustomerController));
        account_1.SelectDefaultCustomerController = SelectDefaultCustomerController;
        angular
            .module("insite")
            .controller("SelectDefaultCustomerController", SelectDefaultCustomerController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.select-default-customer.controller.js.map