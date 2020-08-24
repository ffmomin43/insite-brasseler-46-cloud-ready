var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var SelectCustomerController = /** @class */ (function () {
            function SelectCustomerController($scope, $window, accountService, sessionService, customerService, $attrs, settingsService, cartService, queryString, coreService, spinnerService, $timeout, addressErrorPopupService, apiErrorPopupService, $localStorage) {
                this.$scope = $scope;
                this.$window = $window;
                this.accountService = accountService;
                this.sessionService = sessionService;
                this.customerService = customerService;
                this.$attrs = $attrs;
                this.settingsService = settingsService;
                this.cartService = cartService;
                this.queryString = queryString;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.$timeout = $timeout;
                this.addressErrorPopupService = addressErrorPopupService;
                this.apiErrorPopupService = apiErrorPopupService;
                this.$localStorage = $localStorage;
                this.invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
                this.errorMessage = "";
                this.defaultPageSize = 20;
                this.noShipToAndCantCreate = false;
                this.enableWarehousePickup = false;
            }
            SelectCustomerController.prototype.$onInit = function () {
                var _this = this;
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
                    this.$scope.$on("cartLoaded", function (event, cart) {
                        _this.onCartLoaded(cart);
                    });
                }
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            SelectCustomerController.prototype.onCartLoaded = function (cart) {
                this.cart = cart;
            };
            SelectCustomerController.prototype.getSettingsCompleted = function (settingsCollection) {
                var _this = this;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                var requireSelectCustomerOnSignIn = settingsCollection.accountSettings.requireSelectCustomerOnSignIn;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(requireSelectCustomerOnSignIn, session); }, function (error) { _this.getSessionFailed(error); });
                this.initCustomerAutocompletes(settingsCollection);
            };
            SelectCustomerController.prototype.getSettingsFailed = function (error) {
            };
            SelectCustomerController.prototype.getSessionCompleted = function (requireSelectCustomerOnSignIn, session) {
                this.session = session;
                this.fulfillmentMethod = session.fulfillmentMethod;
                this.pickUpWarehouse = session.pickUpWarehouse;
                this.showIsDefaultCheckbox = !requireSelectCustomerOnSignIn && !session.hasDefaultCustomer;
            };
            SelectCustomerController.prototype.getSessionFailed = function (error) {
            };
            SelectCustomerController.prototype.hasCustomerWithLabel = function (customers, label) {
                for (var i = 0; i < customers.length; i++) {
                    if (customers[i].label === label) {
                        return true;
                    }
                }
                return false;
            };
            SelectCustomerController.prototype.renderMessage = function (values, templateId) {
                var template = angular.element("#" + templateId).html();
                for (var i = 0; i < values.length; i++) {
                    template = template.replace("{" + i + "}", values[i]);
                }
                return template;
            };
            SelectCustomerController.prototype.initCustomerAutocompletes = function (settingsCollection) {
                var _this = this;
                var customerSettings = settingsCollection.customerSettings;
                var billToValues = ["{{vm.defaultPageSize}}", "{{vm.totalBillTosCount}}"];
                this.billToOptions = {
                    headerTemplate: this.renderMessage(billToValues, "totalBillToCountTemplate"),
                    dataSource: new kendo.data.DataSource({
                        serverFiltering: true,
                        serverPaging: true,
                        transport: {
                            read: function (options) {
                                _this.onBillToAutocompleteRead(options);
                            }
                        }
                    }),
                    select: function (event) {
                        _this.onBillToAutocompleteSelect(event);
                    },
                    minLength: 0,
                    dataTextField: "label",
                    dataValueField: "id",
                    placeholder: this.billToOptionsPlaceholder
                };
                var shipToValues = ["{{vm.defaultPageSize}}", "{{vm.totalShipTosCount}}"];
                this.shipToOptions = {
                    headerTemplate: this.renderMessage(shipToValues, "totalShipToCountTemplate"),
                    dataSource: new kendo.data.DataSource({
                        serverFiltering: true,
                        serverPaging: true,
                        transport: {
                            read: function (options) {
                                _this.onShipToAutocompleteRead(options, customerSettings);
                            }
                        }
                    }),
                    select: function (event) {
                        _this.onShipToAutocompleteSelect(event);
                    },
                    minLength: 0,
                    dataTextField: "label",
                    dataValueField: "id",
                    placeholder: this.getShipToPlaceholder()
                };
                this.billToOptions.dataSource.read();
            };
            SelectCustomerController.prototype.getDefaultPagination = function () {
                return { page: 1, pageSize: this.defaultPageSize };
            };
            SelectCustomerController.prototype.onBillToAutocompleteRead = function (options) {
                var _this = this;
                this.spinnerService.show();
                this.customerService.getBillTos("state,validation", this.billToSearch, this.getDefaultPagination()).then(function (billToCollection) { _this.getBillTosCompleted(options, billToCollection); }, function (error) { _this.getBillTosFailed(error); });
            };
            SelectCustomerController.prototype.onBillToAutocompleteSelect = function (event) {
                if (event.item == null) {
                    return;
                }
                var dataItem = event.sender.dataItem(event.item.index());
                this.selectBillTo(dataItem);
            };
            SelectCustomerController.prototype.onShipToAutocompleteRead = function (options, customerSettings) {
                var _this = this;
                this.spinnerService.show();
                this.customerService.getShipTos("excludeshowall,excludeonetime,validation", this.shipToSearch, this.getDefaultPagination(), this.billTo.id).then(function (shipToCollection) { _this.getShipTosCompleted(options, customerSettings, shipToCollection); }, function (error) { _this.getShipTosFailed(error); });
            };
            SelectCustomerController.prototype.onShipToAutocompleteSelect = function (event) {
                if (event.item == null) {
                    return;
                }
                var dataItem = event.sender.dataItem(event.item.index());
                this.selectShipTo(dataItem);
            };
            SelectCustomerController.prototype.getBillTosCompleted = function (options, billToCollection) {
                var billTos = billToCollection.billTos;
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
                setTimeout(function () { options.success(billTos); }, 0);
            };
            SelectCustomerController.prototype.getBillTosFailed = function (error) {
            };
            SelectCustomerController.prototype.getShipTosCompleted = function (options, customerSettings, shipToCollection) {
                var shipTos = shipToCollection.shipTos;
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
                setTimeout(function () { options.success(shipTos); }, 0);
            };
            SelectCustomerController.prototype.getShipTosFailed = function (error) {
            };
            SelectCustomerController.prototype.openAutocomplete = function ($event, selector) {
                var autoCompleteElement = angular.element(selector);
                var kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
                kendoAutoComplete.popup.open();
            };
            SelectCustomerController.prototype.selectBillTo = function (dataItem) {
                this.billTo = dataItem;
                this.shipTo = null;
                this.shipToSearch = "";
                this.shipToOptions.dataSource.read();
            };
            SelectCustomerController.prototype.selectShipTo = function (dataItem) {
                this.shipTo = dataItem;
            };
            SelectCustomerController.prototype.cancel = function () {
                this.$window.location.href = this.returnUrl;
            };
            SelectCustomerController.prototype.setCustomer = function () {
                var _this = this;
                if (!this.billTo || !this.shipTo) {
                    return;
                }
                var currentContext = this.sessionService.getContext();
                currentContext.fulfillmentMethod = this.fulfillmentMethod;
                currentContext.pickUpWarehouseId = this.fulfillmentMethod === "Ship" ? null : (this.pickUpWarehouse ? this.pickUpWarehouse.id : currentContext.pickUpWarehouseId);
                this.sessionService.setContext(currentContext);
                var session = {
                    customerWasUpdated: false,
                    billTo: { id: this.billTo.id, isDefault: this.useDefaultCustomer },
                    shipTo: { id: this.shipTo.id },
                    fulfillmentMethod: this.fulfillmentMethod,
                    pickUpWarehouse: this.fulfillmentMethod === "PickUp" ? this.pickUpWarehouse : null
                };
                this.sessionService.updateSession(session).then(function (session) { _this.setCustomerCompleted(session); }, function (error) { _this.setCustomerFailed(error); });
            };
            SelectCustomerController.prototype.setCustomerCompleted = function (session) {
                var _this = this;
                var currentContext = this.sessionService.getContext();
                currentContext.shipToId = this.shipTo.id;
                currentContext.billToId = this.billTo.id;
                this.sessionService.setContext(currentContext);
                session.shipTo = this.shipTo;
                var redirectFn = function () {
                    _this.spinnerService.show();
                    _this.sessionService.redirectAfterSelectCustomer(session, _this.cart.canBypassCheckoutAddress, _this.dashboardUrl, _this.returnUrl, _this.checkoutAddressUrl, _this.reviewAndPayUrl, _this.addressesUrl, _this.cartUrl, _this.cart.canCheckOut);
                };
                if (session.isRestrictedProductExistInCart) {
                    this.$localStorage.set("hasRestrictedProducts", true.toString());
                }
                redirectFn();
            };
            SelectCustomerController.prototype.setCustomerFailed = function (error) {
                if (error.message === this.invalidAddressException) {
                    this.addressErrorPopupService.display(null);
                }
                else {
                    this.apiErrorPopupService.display(error);
                }
            };
            SelectCustomerController.prototype.changeBillTo = function () {
                if (this.billTo && this.billTo.shipTos && this.billTo.shipTos.length === 1) {
                    this.shipTo = this.billTo.shipTos[0];
                }
                else {
                    this.shipTo = null;
                }
            };
            SelectCustomerController.prototype.setAsDefaultCustomer = function () {
                if (this.useDefaultCustomer) {
                    this.coreService.displayModal(angular.element("#defaultCustomerChangedMessage"));
                }
            };
            SelectCustomerController.prototype.onChangeDeliveryMethod = function () {
                // Need this code because kendo autocomplete doesn't support dynamic placeholder changing
                angular.element("#selectShipTo").attr("placeholder", this.getShipToPlaceholder());
            };
            SelectCustomerController.prototype.getShipToPlaceholder = function () {
                return this.enableWarehousePickup && this.fulfillmentMethod === 'PickUp' ? this.recipientAddressOptionsPlaceholder : this.shipToOptionsPlaceholder;
            };
            SelectCustomerController.$inject = [
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
            return SelectCustomerController;
        }());
        account.SelectCustomerController = SelectCustomerController;
        angular
            .module("insite")
            .controller("SelectCustomerController", SelectCustomerController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.select-customer.controller.js.map