module insite.account {
    "use strict";

    export class BrasselerSelectCustomerController extends SelectCustomerController {
        billTos: BillToModel[];
        pattern = /(p[\_\-\.\s]?o.?[\_\.\-\s]?|postoffice|post office\s)b(\d+|\.|ox\d+|ox)?\b/igm;
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
            "$localStorage"];

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
            protected $localStorage: common.IWindowStorage
            ) {
            super($scope, $window, accountService, sessionService, customerService, $attrs, settingsService, cartService, queryString, coreService, spinnerService, $timeout, addressErrorPopupService, apiErrorPopupService, $localStorage);
        }

        init() {
            super.init();

            //BUSA_1140: Create account page is displayed when user logs into the website.
            this.returnUrl = this.queryString.get("returnUrl");
            if (!this.returnUrl || this.returnUrl.includes("CreateAccount")) {
                this.returnUrl = this.homePageUrl;
            }
        }

        // method overrided to populate Shiptos (4.4 implementation)
        initCustomerAutocompletes(settingsCollection: core.SettingsCollection): void {
            super.initCustomerAutocompletes(settingsCollection);
            this.initCustomerAutocompletesSearch(settingsCollection.customerSettings);
        }
       
        changeBillTo(): void {
            if (this.billTo && this.billTo.shipTos && this.billTo.shipTos.length === 1) {
                this.shipTo = this.billTo.shipTos[0];
            }
            var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
            this.billTo.shipTos = this.billTo.shipTos.filter(shipTo => {
                if (shipTo.id == "") {
                    return false;
                }
                else
                    return !(chkIfOneTimeShipTo.test(shipTo.customerSequence))
            });
            this.billTo.shipTos.forEach(x => {
                //if (this.billTo.shipTos.length == 1 && x.label == "Use Billing Address") { BUSA-758 PO in Address1
                if (this.billTo.shipTos.length == 1 && x.customerSequence == "" && !x.isNew) {
                }
                if (this.billTo.shipTos.length > 1) {
                    //if (x.label == "Use Billing Address" && x.address1.match(this.pattern)) BUSA-758 PO in Address1
                    if ((x.customerSequence == "" && !x.isNew) && (x.address1.match(this.pattern) || x.address2.match(this.pattern))) { //BUSA-561 : Select Bill to-PO box condition added.
                        this.billTo.shipTos.shift();
                    }
                }
            });
            /*Commented below code for : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
            //// BUSA-421 : added foreach loop to slice company number from customer ship to number.           
            //this.billTo.shipTos.forEach(x => {
            //    if (x.label != "Use Billing Address")
            //        x.label = x.label.slice(1);
            //});
        }
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
        initCustomerAutocompletesSearch(customerSettings: any): void {
            var self = this;
            const billToValues = ["{{vm.defaultPageSize}}", "{{vm.totalBillTosCount}}"];
            this.billToOptions = {
                headerTemplate: this.renderMessage(billToValues, "totalBillToCountTemplate"),
                dataSource: new kendo.data.DataSource({
                    serverFiltering: true,
                    serverPaging: true,
                    transport: {
                        read: (options) => {
                            this.spinnerService.show();
                            self.customerService.getBillTos("shipTos,state,validation", self.billToSearch, self.getDefaultPagination()).then(result => {
                                var billTos = result.billTos;
                                this.billToOptions = result.billTos;//Ebrahim
                                self.totalBillTosCount = result.pagination.totalItemCount;
                                self.noShipToAndCantCreate = false;

                                this.billToOptions.forEach(x => {
                                    x.label = x.label.slice(1);
                                });
                                /*Start : BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                var shipTos = result.billTos.forEach(x => {
                                    x.shipTos.forEach(x => {
                                        //if (x.label == "Use Billing Address" || x.label == "Create New") { BUSA-758 PO in Address1
                                        if ((x.customerSequence == "" && !x.isNew) || x.isNew) {
                                        }
                                        else {
                                            x.label = x.label.slice(1);
                                        }
                                    });
                                });
                                if (!customerSettings.allowCreateNewShipToAddress) {
                                    this.billToOptions = this.billToOptions.filter(x => x.shipTos.length > 0);
                                    this.billTos = this.billTos.filter(x => x.shipTos.length > 0);
                                }
                                if (this.billToOptions && this.billToOptions.length === 1) {
                                    this.billTo = this.billToOptions[0];
                                    this.changeBillTo();
                                    /* BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                    //this.SliceCompanyNumber();
                                }
                                if (this.billTos && this.billTos.length === 1) {
                                    this.billTo = this.billTos[0];
                                }

                                if (!self.hasCustomerWithLabel(billTos, self.billToSearch)) {
                                    /* Start : BUSA_720 :Force user to select Ship to when Bill to and Ship to is different*/
                                    //self.billTo = null;                                    
                                }
                                else { self.billTo = null; }
                                /* End : BUSA_720 :Force user to select Ship to when Bill to and Ship to is different*/
                                if (billTos && billTos.length === 1 && !self.billToSearch) {
                                    self.billToSearch = billTos[0].label;
                                    self.selectBillTo(billTos[0]);
                                    self.changeBillTo();
                                    /* BUSA_675 :Complete shipping account numbers are not displaying in dropdown list*/
                                    //this.SliceCompanyNumber();
                                }

                                // need to wrap this in setTimeout for prevent double scroll
                                setTimeout(() => { options.success(billTos); }, 0);
                            });
                        }
                    }
                }),
                select(e) {
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
        }
    }

    angular
        .module("insite")
        .controller("SelectCustomerController", BrasselerSelectCustomerController);
}
