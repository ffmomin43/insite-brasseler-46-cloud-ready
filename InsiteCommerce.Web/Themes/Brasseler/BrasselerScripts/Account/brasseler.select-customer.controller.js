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
        var BrasselerSelectCustomerController = /** @class */ (function (_super) {
            __extends(BrasselerSelectCustomerController, _super);
            function BrasselerSelectCustomerController($scope, $window, accountService, sessionService, customerService, $attrs, settingsService, cartService, queryString, coreService, spinnerService, $timeout, addressErrorPopupService, apiErrorPopupService, $localStorage) {
                var _this = _super.call(this, $scope, $window, accountService, sessionService, customerService, $attrs, settingsService, cartService, queryString, coreService, spinnerService, $timeout, addressErrorPopupService, apiErrorPopupService, $localStorage) || this;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.accountService = accountService;
                _this.sessionService = sessionService;
                _this.customerService = customerService;
                _this.$attrs = $attrs;
                _this.settingsService = settingsService;
                _this.cartService = cartService;
                _this.queryString = queryString;
                _this.coreService = coreService;
                _this.spinnerService = spinnerService;
                _this.$timeout = $timeout;
                _this.addressErrorPopupService = addressErrorPopupService;
                _this.apiErrorPopupService = apiErrorPopupService;
                _this.$localStorage = $localStorage;
                _this.pattern = /(p[\_\-\.\s]?o.?[\_\.\-\s]?|postoffice|post office\s)b(\d+|\.|ox\d+|ox)?\b/igm;
                return _this;
            }
            BrasselerSelectCustomerController.prototype.init = function () {
                _super.prototype.init.call(this);
                //BUSA_1140: Create account page is displayed when user logs into the website.
                this.returnUrl = this.queryString.get("returnUrl");
                if (!this.returnUrl || this.returnUrl.includes("CreateAccount")) {
                    this.returnUrl = this.homePageUrl;
                }
            };
            // method overrided to populate Shiptos (4.4 implementation)
            BrasselerSelectCustomerController.prototype.initCustomerAutocompletes = function (settingsCollection) {
                _super.prototype.initCustomerAutocompletes.call(this, settingsCollection);
                this.initCustomerAutocompletesSearch(settingsCollection.customerSettings);
            };
            BrasselerSelectCustomerController.prototype.changeBillTo = function () {
                var _this = this;
                if (this.billTo && this.billTo.shipTos && this.billTo.shipTos.length === 1) {
                    this.shipTo = this.billTo.shipTos[0];
                }
                var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
                this.billTo.shipTos = this.billTo.shipTos.filter(function (shipTo) {
                    if (shipTo.id == "") {
                        return false;
                    }
                    else
                        return !(chkIfOneTimeShipTo.test(shipTo.customerSequence));
                });
                this.billTo.shipTos.forEach(function (x) {
                    //if (this.billTo.shipTos.length == 1 && x.label == "Use Billing Address") { BUSA-758 PO in Address1
                    if (_this.billTo.shipTos.length == 1 && x.customerSequence == "" && !x.isNew) {
                    }
                    if (_this.billTo.shipTos.length > 1) {
                        //if (x.label == "Use Billing Address" && x.address1.match(this.pattern)) BUSA-758 PO in Address1
                        if ((x.customerSequence == "" && !x.isNew) && (x.address1.match(_this.pattern) || x.address2.match(_this.pattern))) { //BUSA-561 : Select Bill to-PO box condition added.
                            _this.billTo.shipTos.shift();
                        }
                    }
                });
                /*Commented below code for : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                //// BUSA-421 : added foreach loop to slice company number from customer ship to number.           
                //this.billTo.shipTos.forEach(x => {
                //    if (x.label != "Use Billing Address")
                //        x.label = x.label.slice(1);
                //});
            };
            /*Commented below code since its not working while typing billTos
             : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
            //SliceCompanyNumber(): void {
            //    this.billTo.shipTos.forEach(x => {
            //        if (x.label != "Use Billing Address")
            //            x.label = x.label.slice(1, x.label.length);
            //    });
            //}
            /*End : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
            // BUSA-248:Sales Rep List is SLOOOOW. Changes made to insert auto complete extender.
            BrasselerSelectCustomerController.prototype.initCustomerAutocompletesSearch = function (customerSettings) {
                var _this = this;
                var self = this;
                var billToValues = ["{{vm.defaultPageSize}}", "{{vm.totalBillTosCount}}"];
                this.billToOptions = {
                    headerTemplate: this.renderMessage(billToValues, "totalBillToCountTemplate"),
                    dataSource: new kendo.data.DataSource({
                        serverFiltering: true,
                        serverPaging: true,
                        transport: {
                            read: function (options) {
                                _this.spinnerService.show();
                                self.customerService.getBillTos("shipTos,state,validation", self.billToSearch, self.getDefaultPagination()).then(function (result) {
                                    var billTos = result.billTos;
                                    _this.billToOptions = result.billTos; //Ebrahim
                                    self.totalBillTosCount = result.pagination.totalItemCount;
                                    self.noShipToAndCantCreate = false;
                                    _this.billToOptions.forEach(function (x) {
                                        x.label = x.label.slice(1);
                                    });
                                    /*Start : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                    var shipTos = result.billTos.forEach(function (x) {
                                        x.shipTos.forEach(function (x) {
                                            //if (x.label == "Use Billing Address" || x.label == "Create New") { BUSA-758 PO in Address1
                                            if ((x.customerSequence == "" && !x.isNew) || x.isNew) {
                                            }
                                            else {
                                                x.label = x.label.slice(1);
                                            }
                                        });
                                    });
                                    if (!customerSettings.allowCreateNewShipToAddress) {
                                        _this.billToOptions = _this.billToOptions.filter(function (x) { return x.shipTos.length > 0; });
                                        _this.billTos = _this.billTos.filter(function (x) { return x.shipTos.length > 0; });
                                    }
                                    if (_this.billToOptions && _this.billToOptions.length === 1) {
                                        _this.billTo = _this.billToOptions[0];
                                        _this.changeBillTo();
                                        /* BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                        //this.SliceCompanyNumber();
                                    }
                                    if (_this.billTos && _this.billTos.length === 1) {
                                        _this.billTo = _this.billTos[0];
                                    }
                                    if (!self.hasCustomerWithLabel(billTos, self.billToSearch)) {
                                        /* Start : BUSA_720 :Force user to select Ship to when Bill to and Ship to is different*/
                                        //self.billTo = null;                                    
                                    }
                                    else {
                                        self.billTo = null;
                                    }
                                    /* End : BUSA_720 :Force user to select Ship to when Bill to and Ship to is different*/
                                    if (billTos && billTos.length === 1 && !self.billToSearch) {
                                        self.billToSearch = billTos[0].label;
                                        self.selectBillTo(billTos[0]);
                                        self.changeBillTo();
                                        /* BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                        //this.SliceCompanyNumber();
                                    }
                                    // need to wrap this in setTimeout for prevent double scroll
                                    setTimeout(function () { options.success(billTos); }, 0);
                                });
                            }
                        }
                    }),
                    select: function (e) {
                        if (e.item == null) {
                            return;
                        }
                        var dataItem = this.dataItem(e.item.index());
                        self.selectBillTo(dataItem);
                    },
                    minLength: 0,
                    dataTextField: "label",
                    dataValueField: "id",
                    placeholder: self.billToOptionsPlaceholder
                };
                this.billToOptions.dataSource.read();
            };
            BrasselerSelectCustomerController.$inject = [
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
            return BrasselerSelectCustomerController;
        }(account.SelectCustomerController));
        account.BrasselerSelectCustomerController = BrasselerSelectCustomerController;
        angular
            .module("insite")
            .controller("SelectCustomerController", BrasselerSelectCustomerController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.select-customer.controller.js.map