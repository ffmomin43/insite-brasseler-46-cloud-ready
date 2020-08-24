//import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;

module insite.cart {
    "use strict";

    export class BrasselerCheckoutAddressController extends CheckoutAddressController {
        //BUSA-572 start : Acct#63952- po box is invalid Address1 error message is displayed during checkout
        pattern = /(p[\_\-\.\s]?o.?[\_\.\-\s]?|postoffice|post office\s)b(\d+|\.|ox\d+|ox)?\b/igm;
        //BUSA-572 end : Acct#63952- po box is invalid Address1 error message is displayed during checkout

        isNewUser = false;
        guestCustomerNumber = "";
        states: StateModel[];
        dentalLicenseState: StateModel;
        dentalLicenseNumber: string;
        practitionerFirstName: string;
        practitionerMiddleName: string;
        practitionerLastName: string;
        orderingFirstName: string;
        orderingLastName: string;
        payableAccountFirstName: string;
        payableAccountLastName: string;
        responsiblePartyFirstName: string;
        responsiblePartyLastName: string;
        responsiblePartyTaxOrEmpId: string;
        exemptTax: boolean;
        requiredPO: boolean;
        applyCredit = false;
        acceptTermsConditions = false;
        customerType: string;
        customerTypeList: string[];
        selectedItem: boolean = false; //BUSA-372 : Add "same as Billing Address" check box in Checkout page for new User.
        selectedcustomerType: string;
        currentDeliveryAddressSelected: any;
        ssValidationMsg: boolean;
        IsSubscriptionOptedTemp: boolean = false; //BUSA-1069  : Hide "Create One Time Shipping Address" in the checkout for smart supply

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
            "spinnerService",
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
            protected sessionService: account.SessionService,
            protected $localStorage: common.IWindowStorage,
            protected spinnerService: core.ISpinnerService,
            protected $attrs: ICheckoutAddressControllerAttributes,
            protected $rootScope: ng.IRootScopeService) {
            super($scope, $window, cartService, customerService, websiteService, coreService, queryString, accountService, settingsService, $timeout, $q, sessionService, $localStorage, $attrs, $rootScope);
            
            this.init();
        }

        init() {
            this.$onInit()
            if (this.spinnerService != undefined) {
                this.spinnerService.show();
            }
        }

        //4.4 changes
        protected setUpBillTo(): void {
            var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');

            var billTo = this.cart.billTo;
            //billTo.shipTos = billTo.shipTos.filter(shipTo => {
            //    //console.log(chkIfOneTimeShipTo.test(shipTo.customerSequence) + shipTo.customerSequence);
            //    return !(chkIfOneTimeShipTo.test(shipTo.customerSequence));
            //    //shipTo.customerNumber = 
            //    ////return !(billTo.properties["newAddress" + shipTo.id] != null &&
            //    //    billTo.properties["newAddress" + shipTo.id].toLowerCase() == "true"
            //    //    && !(this.cart.shipTo && shipTo.id === this.cart.shipTo.id))
                
            //});
            //billTo.shipTos.forEach(shipTo => {
            //    if (billTo.properties["newAddress" + shipTo.id] != null && billTo.properties["newAddress" + shipTo.id].toLowerCase() == "true") {
            //        shipTo.label = "Current Delivery Address";
            //        this.currentDeliveryAddressSelected = shipTo.id;

            //    }
            //});

            //code for customer type BUSA-337 start
            if (billTo.properties["customerType"] != null) {
                this.customerType = billTo.properties["customerType"];
                this.customerTypeList = this.customerType.split(",");
            }
            //code for customer type BUSA-337 end

            if (this.onlyOneCountryToSelect()) {
                this.selectFirstCountryForAddress(this.cart.billTo);
                this.setStateRequiredRule("bt", this.cart.billTo);
            }

            this.replaceObjectWithReference(this.cart.billTo, this.countries, "country");
            if (this.cart.billTo.country) {
                this.replaceObjectWithReference(this.cart.billTo, this.cart.billTo.country.states, "state");
            }

            if (this.countries.filter(c => c.abbreviation == this.countries[0].abbreviation).length > 0) {
                this.states = this.countries.filter(c => c.abbreviation == this.countries[0].abbreviation)[0].states;
            }

            //Checking for new user and get new user additional information from cart properties
            if (this.cart.properties["isNewUser"] != null && this.cart.properties["guestCustomerNumber"] != null) {
                this.isNewUser = true;
                this.guestCustomerNumber = this.cart.properties["guestCustomerNumber"];
                this.populateAdditionalInfo(this.cart.properties);
                this.replaceObjectWithReference(this.cart.shipTo, this.countries, "country");
                this.replaceObjectWithReference(this.cart.shipTo, this.cart.shipTo.country.states, "state");
            }
        }


        protected setUpShipTos(): void {
            this.shipTos = angular.copy(this.cart.billTo.shipTos);
            var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
            this.shipTos = this.shipTos.filter(shipTo => {
                if (shipTo.id == this.cart.shipTo.id) {
                    return true;
                }
                else {
                    return !(chkIfOneTimeShipTo.test(shipTo.customerSequence)); // !(chkIfOneTimeShipTo.test(shipTo.customerSequence)
                }
            });

            this.shipTos.forEach(shipTo => {
                if (shipTo.id == this.cart.shipTo.id && chkIfOneTimeShipTo.test(shipTo.customerSequence)) {
                    shipTo.label = " Current Delivery Address";
                }
            });
            let shipToBillTo: ShipToModel = null;

            //BUSA-561 : Select Bill to start
            if (this.shipTos.length > 2) {
                this.shipTos.forEach(x => {
                    //if (x.address1.match(this.pattern) && x.label == "Use Billing Address") { BUSA-758 PO in Address1
                    if ((x.address1.match(this.pattern) || x.address2.match(this.pattern)) && (x.customerSequence == "" && !x.isNew)) {
                        this.shipTos.shift();
                    }
                });
            }
            //BUSA-561 : Select Bill to end

            // BUSA-421 : added foreach loop to slice company number from customer ship to number.
            // BUSA-492 : Checkout Billing-  'C' is missing in current delivery address text under shipping information drop down.
            this.shipTos.forEach(x => {
                //if (x.label == "Use Billing Address" || x.label == "Create New" || x.label == "Current Delivery Address") { BUSA-758 PO in Address1
                if ((x.customerSequence == "" && !x.isNew) || x.isNew || x.id == this.currentDeliveryAddressSelected) {
                    //BUSA - 563 start : Change "Create New Address" to "Create One Time Shipping Address" in the checkout page
                    //if (x.label == "Create New")  BUSA-758 PO in Address1
                    if (x.isNew) {
                        x.label = "Create One Time Shipping Address";
                    }
                    //BUSA - 563 end : Change "Create New Address" to "Create One Time Shipping Address" in the checkout page
                }
                else {
                    /*BUSA - 675 Complete shipping account numbers are not displaying in dropdown list*/
                    x.label = x.label.slice(1);
                    /*BUSA - 675 Complete shipping account numbers are not displaying in dropdown list*/
                }
            });


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

            //BUSA-1069 start : Hide "Create One Time Shipping Address" in the checkout page in the checkout for smart supply
            this.cart.cartLines.forEach(c => {
                if (c.properties["isSubscriptionOpted"] && c.properties["isSubscriptionOpted"] == 'true' || c.properties["isSampleCartLine"] && c.properties["isSampleCartLine"] == 'true') {
                    this.IsSubscriptionOptedTemp = true;
                    this.shipTos.forEach(sh => {
                        if (sh.isNew) {
                            this.shipTos.splice(this.shipTos.indexOf(sh), 1);
                        }
                    });

            this.shipTos.forEach(sh => {
                        if (sh.id == this.cart.shipTo.id && chkIfOneTimeShipTo.test(sh.customerSequence)) {
                            //Errror /Validation
                            this.continueCheckoutInProgress = true;
                            this.ssValidationMsg = true;
                        }
                    });

                }
            });
            
            // BUSA-1127 Production: Approver Flow -> Approver is unable to see the order if the Requester had placed it with One Time Shipping Address
            if (this.cart.hasApprover) {
                this.shipTos.forEach(sh => {
                    if (sh.isNew) {
                        this.shipTos.splice(this.shipTos.indexOf(sh), 1);
                    }
                });
            }
            //BUSA-1069  end : Hide "Create One Time Shipping Address" in the checkout for smart supply
}

        protected setSelectedShipTo(): void {
            this.selectedShipTo = this.cart.shipTo;
            this.shipTos.forEach(shipTo => {
                if (this.cart.shipTo && shipTo.id === this.cart.shipTo.id || !this.selectedShipTo && shipTo.isNew) {
                    this.selectedShipTo = shipTo;
                }
            });

            if (this.isNewUser) {
                //code for customer type BUSA-402 start
                //code to remove default values like ?, xxxx, ?? for a new user
                if (this.cart.billTo.properties["newWebShopperPostalCode"] != null) {
                    if (this.cart.billTo.postalCode != null && this.cart.billTo.postalCode.indexOf(this.cart.billTo.properties["newWebShopperPostalCode"]) >= 0) {
                        this.cart.billTo.postalCode = "";
                    }
                    if (this.cart.shipTo.postalCode != null && this.cart.shipTo.postalCode.indexOf(this.cart.billTo.properties["newWebShopperPostalCode"]) >= 0) {
                        this.cart.shipTo.postalCode = "";
                    }
                }

                if (this.cart.billTo.properties["newWebShopperAddress"] != null) {
                    if (this.cart.billTo.address1 != null && this.cart.billTo.address1.indexOf(this.cart.billTo.properties["newWebShopperAddress"]) >= 0) {
                        this.cart.billTo.address1 = "";
                    }
                    if (this.cart.billTo.city != null && this.cart.billTo.city.indexOf(this.cart.billTo.properties["newWebShopperAddress"]) >= 0) {
                        this.cart.billTo.city = "";
                    }
                    if (this.cart.shipTo.address1 != null && this.cart.shipTo.address1.indexOf(this.cart.billTo.properties["newWebShopperAddress"]) >= 0) {
                        this.cart.shipTo.address1 = "";
                    }
                    if (this.cart.shipTo.city != null && this.cart.shipTo.city.indexOf(this.cart.billTo.properties["newWebShopperAddress"]) >= 0) {
                        this.cart.shipTo.city = "";
                    }
                }

                //code for customer type BUSA-402 end

                this.updateBillToValidation(true, false);
                this.updateShipToValidation(this.cart.shipTo, true, false);
            }
            else {
                this.updateBillToValidation(false, true);
                //var isCurrentDeliveryAddress = (this.selectedShipTo.label == "Current Delivery Address"); BUSA-758 PO in Address1
                var isCurrentDeliveryAddress = (this.selectedShipTo.id == this.currentDeliveryAddressSelected);
                this.updateShipToValidation(this.selectedShipTo, isCurrentDeliveryAddress, !isCurrentDeliveryAddress);
            }
        }

        //4.4


        //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
        checkSelectedShipTo() {
            //BUSA-1069  start : Hide "Create One Time Shipping Address" in the checkout for smart supply
            if (this.selectedShipTo.label !== "Current Delivery Address") {
                this.ssValidationMsg = false;
                this.continueCheckoutInProgress = false;
            }
            if (this.selectedShipTo.label == "Current Delivery Address" && this.IsSubscriptionOptedTemp == true) {
                this.ssValidationMsg = true;
                this.continueCheckoutInProgress = true;
            }
            //BUSA-1069  end : Hide "Create One Time Shipping Address" in the checkout for smart supply
            $(".st-add1-error").attr("style", "display:none");
            $(".st-add2-error").attr("style", "display:none");
            //if (this.selectedShipTo.label == "Create One Time Shipping Address" || this.selectedShipTo.label == "Current Delivery Address") { BUSA-758 PO in Address1
            if (this.selectedShipTo.isNew || this.selectedShipTo.id == this.currentDeliveryAddressSelected) {
                $(".add1-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }
            else if (this.selectedShipTo.address1.match(this.pattern)) {
                $(".add1-error").attr("style", "display:block");
                $('#continueCheckoutBtn').attr('disabled', 'disabled');
            }
            else {
                $(".add1-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }

            if (this.selectedShipTo.isNew || this.selectedShipTo.id == this.currentDeliveryAddressSelected) {
                $(".add1-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }
            else if (this.selectedShipTo.address2.match(this.pattern)) {
                $(".add1-error").attr("style", "display:block");
                $('#continueCheckoutBtn').attr('disabled', 'disabled');
            }
            else {
                $(".add1-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }
            
            //BUSA-624 start : Order File is not being generated due to empty one time shipping state during checkout.
            //if (this.selectedShipTo.label == "Create One Time Shipping Address" || this.selectedShipTo.label == "Current Delivery Address") { BUSA-758 PO in Address1
            if (this.selectedShipTo.isNew || this.selectedShipTo.id == this.currentDeliveryAddressSelected) {
                this.selectedShipTo.validation.state.isRequired = true;
            }
            //BUSA-624 end : Order File is not being generated due to empty one time shipping state during checkout.

            if (this.selectedShipTo.id === this.cart.billTo.id) {
                this.isReadOnly = true;
            } else {
                this.isReadOnly = false;
            }

            $("#addressForm").validate().resetForm();

            if (this.selectedShipTo.isNew) {
                this.selectedShipTo.validation.address2 = {
                    isRequired: true,
                    isDisabled: false,
                    maxLength: 40
                }

                this.selectedShipTo.validation.state = {
                    isRequired: true,
                    isDisabled: false,
                    maxLength: null
                }
            }
            
            this.updateValidationRules("stfirstname", this.selectedShipTo.validation.firstName);
            this.updateValidationRules("stlastname", this.selectedShipTo.validation.lastName);
            this.updateValidationRules("staddress2", this.selectedShipTo.validation.address2);
            this.updateValidationRules("stcompanyName", this.selectedShipTo.validation.companyName);
            this.updateValidationRules("ststate", this.selectedShipTo.validation.state);
        }

        validateAddress1(isAddress, val, field) {
            if (isAddress) {
                if (val.match(this.pattern)) {
                    if (field == "staddress1") {
                        $(".st-add1-error").attr("style", "display:block");
                        $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    }
                    if (field == "staddress2") {
                        $(".st-add2-error").attr("style", "display:block");
                        $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    }

                }
                else {
                    if (field == "staddress1") {
                        $(".st-add1-error").attr("style", "display:none");
                        $('#continueCheckoutBtn').removeAttr('disabled');
                    }
                    if (field == "staddress2") {
                        $(".st-add2-error").attr("style", "display:none");
                        $('#continueCheckoutBtn').removeAttr('disabled');
                    }
                }
            }
        }
        //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field

        continueCheckout(continueUri: string, cartUri: string): void {
            //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
            var height = $('.address-company-co').offset().top;
            var error = false;
            if (!(this.isNewUser)) {
                if (this.selectedShipTo.address1.match(this.pattern) || this.selectedShipTo.address2.match(this.pattern)) {
                    error = true;
                    $(".add1-error").attr("style", "display:block");
                    $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    $('html, body').animate({ scrollTop: 0 }, 'slow');
                }
                else {
                    error = false;
                    $(".add1-error").attr("style", "display:none");
                    $('#continueCheckoutBtn').removeAttr('disabled');
                }

            }

            if (this.isNewUser) {
                if (this.cart.shipTo.address1.match(this.pattern) || this.selectedShipTo.address2.match(this.pattern)) {
                    error = true;
                    $(".st-add1-error").attr("style", "display:block");
                    $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    $('html, body').animate({ scrollTop: height }, 'slow');
                }
                else {
                    error = false;
                    $(".st-add1-error").attr("style", "display:none");
                    $('#continueCheckoutBtn').removeAttr('disabled');
                }
            }
            //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field
            const valid = $("#addressForm").validate().form();
            //BUSA-292 : added "|| error"
            if (!valid || error) {
                $("#addressForm").find(".error:eq(0)").focus();
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

            this.cart.properties = {};
            if (this.isNewUser) {
                this.mapNewUserInfoToCart();
                this.updateCart(this.cart, continueUri);
            }
            else {
                this.customerService.updateBillTo(this.cart.billTo).then(
                    (billTo: BillToModel) => { this.updateBillToCompleted(billTo, continueUri); },
                    (error: any) => { this.updateBillToFailed(error); });
            }
        }

        protected updateShipTo(continueUri: string, customerWasUpdated?: boolean): void {
            const shipToMatches = this.cart.billTo.shipTos.filter(shipTo => { return shipTo.id === this.selectedShipTo.id; });
            if (shipToMatches.length === 1) {
                this.cart.shipTo = this.selectedShipTo;
            }

            if (this.cart.shipTo.id !== this.cart.billTo.id) {
                if (this.cart.shipTo.isNew) {
                    var availableShipTos = this.cart.billTo.shipTos.filter(s => { return s.id != "" && s.customerSequence != "" });
                    var matchedShipTo = this.validateNewDeliveryAddress(this.cart.shipTo, availableShipTos);
                    if (matchedShipTo != null) {
                        this.cart.shipTo.id = matchedShipTo.id;
                        this.cart.shipTo.customerNumber = matchedShipTo.customerNumber;
                        this.cart.shipTo.customerSequence = matchedShipTo.customerSequence;
                        this.cart.shipTo.uri = matchedShipTo.uri;
                        this.cart.shipTo.isNew = false;
                    }
                }
                this.customerService.addOrUpdateShipTo(this.cart.shipTo).then(
                    (shipTo: ShipToModel) => { this.addOrUpdateShipToCompleted(shipTo, continueUri, customerWasUpdated); },
                    (error: any) => { this.addOrUpdateShipToFailed(error); });
            } else {
                this.updateSession(this.cart, continueUri, customerWasUpdated);
            }
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
                this.redirectTo(continueUri);
            }
        }

        updateCart(cart: CartModel, continueUri: string) {
            this.cartService.updateCart(cart).then(() => {
                this.$window.location.href = continueUri;
            }, () => {
                this.continueCheckoutInProgress = false;
            });
        }

        validateNewDeliveryAddress(deliveryAddress: ShipToModel, shipTos: ShipToModel[]) {
            var matchedShipTo = null;
            if (deliveryAddress != null && shipTos != null && shipTos.length > 0) {
                var shipTo = shipTos.filter(shipto => {
                    return shipto.postalCode == deliveryAddress.postalCode &&
                        shipto.firstName.trim().toLowerCase() == deliveryAddress.firstName.trim().toLowerCase() &&
                        shipto.lastName.trim().toLowerCase() == deliveryAddress.lastName.trim().toLowerCase() &&
                        shipto.companyName.trim().toLowerCase() == deliveryAddress.companyName.trim().toLowerCase() &&
                        shipto.address1.trim().toLowerCase() == deliveryAddress.address1.trim().toLowerCase() &&
                        shipto.country.id == deliveryAddress.country.id &&
                        shipto.city.trim().toLowerCase() == deliveryAddress.city.trim().toLowerCase() &&
                        shipto.phone.trim().toLowerCase() == deliveryAddress.phone.trim().toLowerCase()
                });
                if (shipTo != null && shipTo.length == 1) {
                    matchedShipTo = shipTo[0];
                }
            }
            return matchedShipTo;
        }

        updateBillToValidation(isRequired: boolean, isDisabled: boolean) {
            this.cart.billTo.validation.address1.isDisabled = isDisabled;
            this.cart.billTo.validation.address1.isRequired = isRequired;
            this.cart.billTo.validation.address2.isDisabled = isDisabled;
            this.cart.billTo.validation.address2.isRequired = false;
            this.cart.billTo.validation.city.isDisabled = isDisabled;
            this.cart.billTo.validation.city.isRequired = isRequired;
            this.cart.billTo.validation.companyName.isDisabled = isDisabled;
            this.cart.billTo.validation.companyName.isRequired = isRequired;
            this.cart.billTo.validation.country.isDisabled = isDisabled;
            this.cart.billTo.validation.country.isRequired = isRequired;
            this.cart.billTo.validation.email.isDisabled = isDisabled;
            this.cart.billTo.validation.email.isRequired = isRequired;
            this.cart.billTo.validation.firstName.isDisabled = isDisabled;
            this.cart.billTo.validation.firstName.isRequired = isRequired;
            this.cart.billTo.validation.lastName.isDisabled = isDisabled;
            this.cart.billTo.validation.lastName.isRequired = isRequired;
            this.cart.billTo.validation.phone.isDisabled = isDisabled;
            this.cart.billTo.validation.phone.isRequired = isRequired;
            this.cart.billTo.validation.postalCode.isDisabled = isDisabled;
            this.cart.billTo.validation.postalCode.isRequired = isRequired;
            this.cart.billTo.validation.state.isDisabled = isDisabled;
            this.cart.billTo.validation.state.isRequired = isRequired;
        }

        updateShipToValidation(shipTo: ShipToModel, isRequired: boolean, isDisabled: boolean) {
            shipTo.validation.address1.isDisabled = isDisabled;
            shipTo.validation.address1.isRequired = isRequired;
            shipTo.validation.address2.isDisabled = isDisabled;
            shipTo.validation.address2.isRequired = false;
            shipTo.validation.city.isDisabled = isDisabled;
            shipTo.validation.city.isRequired = isRequired;
            shipTo.validation.companyName.isDisabled = isDisabled;
            shipTo.validation.companyName.isRequired = isRequired;
            shipTo.validation.country.isDisabled = isDisabled;
            shipTo.validation.country.isRequired = isRequired;
            shipTo.validation.firstName.isDisabled = isDisabled;
            shipTo.validation.firstName.isRequired = isRequired;
            shipTo.validation.lastName.isDisabled = isDisabled;
            shipTo.validation.lastName.isRequired = isRequired;
            shipTo.validation.phone.isDisabled = isDisabled;
            shipTo.validation.phone.isRequired = isRequired;
            shipTo.validation.postalCode.isDisabled = isDisabled;
            shipTo.validation.postalCode.isRequired = isRequired;
            shipTo.validation.state.isDisabled = isDisabled;
            shipTo.validation.state.isRequired = isRequired;
        }

        mapNewUserInfoToCart() {
            // BUSA - 446 : State field not being populating correctly in order file on FTP Starts.
            this.cart.properties["IsNewUser"] = this.isNewUser.toString();
            // BUSA - 446 : State field not being populating correctly in order file on FTP Ends.

            if (this.isNewUser) {
                this.cart.properties["NewUsrBTFirstName"] = this.cart.billTo.firstName;
                this.cart.properties["NewUsrBTLastName"] = this.cart.billTo.lastName;
                this.cart.properties["NewUsrBTCompanyName"] = this.cart.billTo.companyName;
                this.cart.properties["NewUsrBTAddress1"] = this.cart.billTo.address1;
                this.cart.properties["NewUsrBTAddress2"] = this.cart.billTo.address2;
                this.cart.properties["NewUsrBTCity"] = this.cart.billTo.city;
                this.cart.properties["NewUsrBTPostalCode"] = this.cart.billTo.postalCode;
                this.cart.properties["NewUsrBTPhone"] = this.cart.billTo.phone;
                this.cart.properties["NewUsrBTEmail"] = this.cart.billTo.email;
                this.cart.properties["NewUsrBTCountry"] = this.cart.billTo.country.name;
                this.cart.properties["NewUsrBTState"] = this.cart.billTo.state.name;

                // BUSA - 446 : State field not being populating correctly in order file on FTP Starts.
                this.cart.properties["NewUsrBTStateCode"] = this.cart.billTo.state.abbreviation;
                this.cart.properties["NewUsrSTStateCode"] = this.cart.shipTo.state.abbreviation;
                // BUSA - 446 : State field not being populating correctly in order file on FTP Ends.

                this.cart.properties["NewUsrSTFirstName"] = this.cart.shipTo.firstName;
                this.cart.properties["NewUsrSTLastName"] = this.cart.shipTo.lastName;
                this.cart.properties["NewUsrSTCompanyName"] = this.cart.shipTo.companyName;
                this.cart.properties["NewUsrSTAddress1"] = this.cart.shipTo.address1;
                this.cart.properties["NewUsrSTAddress2"] = this.cart.shipTo.address2;
                this.cart.properties["NewUsrSTCity"] = this.cart.shipTo.city;
                this.cart.properties["NewUsrSTPostalCode"] = this.cart.shipTo.postalCode;
                this.cart.properties["NewUsrSTPhone"] = this.cart.shipTo.phone;
                this.cart.properties["NewUsrSTCountry"] = this.cart.shipTo.country.name;
                this.cart.properties["NewUsrSTState"] = this.cart.shipTo.state.name;

                this.cart.properties["PractitionerFirstName"] = this.practitionerFirstName;
                if (this.practitionerMiddleName != "") {
                    this.cart.properties["PractitionerMiddleName"] = this.practitionerMiddleName;
                }
                this.cart.properties["PractitionerLastName"] = this.practitionerLastName;
                this.cart.properties["DentalLicenseState"] = this.dentalLicenseState.name;
                this.cart.properties["DentalLicenseNumber"] = this.dentalLicenseNumber;
                this.cart.properties["OrderingFirstName"] = this.orderingFirstName;
                this.cart.properties["OrderingLastName"] = this.orderingLastName;
                this.cart.properties["PayableAccountFirstName"] = this.payableAccountFirstName;
                this.cart.properties["PayableAccountLastName"] = this.payableAccountLastName;
                // changes for BUSA- 337 start. Added if condition for BUSA-412
                if (this.selectedcustomerType == undefined) {
                    this.cart.properties["customerType"] = "None";
                }
                else {
                    this.cart.properties["customerType"] = this.selectedcustomerType;
                }
                // changes for BUSA- 337 end
                this.cart.properties["ExemptTax"] = String(this.exemptTax);
                this.cart.properties["PORequired"] = String(this.requiredPO);
                this.cart.properties["ApplyCredit"] = String(this.applyCredit);
                if (this.applyCredit) {
                    this.cart.properties["ResponsiblePartyFirstName"] = this.responsiblePartyFirstName;
                    this.cart.properties["ResponsiblePartyLastName"] = this.responsiblePartyLastName;
                    this.cart.properties["ResponsiblePartyTaxOrEmpId"] = this.responsiblePartyTaxOrEmpId;
                }
            }
        }

        populateAdditionalInfo(properties: { [key: string]: string }) {
            if (properties["practitionerFirstName"] != null) {
                this.practitionerFirstName = properties["practitionerFirstName"];
            }
            if (properties["practitionerMiddleName"] != null) {
                this.practitionerMiddleName = properties["practitionerMiddleName"];
            }
            if (properties["practitionerLastName"] != null) {
                this.practitionerLastName = properties["practitionerLastName"];
            }
            if (properties["dentalLicenseState"] != null && this.states.filter(state => { return state.name == properties["dentalLicenseState"] }).length > 0) {
                this.dentalLicenseState = this.states.filter(state => { return state.name == properties["dentalLicenseState"] })[0];
            }
            if (properties["dentalLicenseNumber"] != null) {
                this.dentalLicenseNumber = properties["dentalLicenseNumber"];
            }
            if (properties["orderingFirstName"] != null) {
                this.orderingFirstName = properties["orderingFirstName"];
            }
            if (properties["orderingLastName"] != null) {
                this.orderingLastName = properties["orderingLastName"];
            }
            if (properties["payableAccountFirstName"] != null) {
                this.payableAccountFirstName = properties["payableAccountFirstName"];
            }
            if (properties["payableAccountLastName"] != null) {
                this.payableAccountLastName = properties["payableAccountLastName"];
            }
            if (properties["exemptTax"] != null) {
                this.exemptTax = properties["exemptTax"] == "true";
            }
            if (properties["poRequired"] != null) {
                this.requiredPO = properties["poRequired"] == "true";
            }
            if (properties["applyCredit"] != null) {
                this.applyCredit = properties["applyCredit"] == "true";
            }
            if (properties["responsiblePartyFirstName"] != null) {
                this.responsiblePartyFirstName = properties["responsiblePartyFirstName"];
            }
            if (properties["responsiblePartyLastName"] != null) {
                this.responsiblePartyLastName = properties["responsiblePartyLastName"];
            }
            if (properties["responsiblePartyTaxOrEmpId"] != null) {
                this.responsiblePartyTaxOrEmpId = properties["responsiblePartyTaxOrEmpId"];
            }
        }

        // BUSA-372 : Add "same as Billing Address" check box in Checkout page for new User Starts
        chkSameAsBilling(itemChecked) {
            if (this.isNewUser) {
                if (itemChecked) {
                    this.isReadOnly = true;
                    this.cart.shipTo.firstName = this.cart.billTo.firstName;
                    this.cart.shipTo.lastName = this.cart.billTo.lastName;
                    this.cart.shipTo.companyName = this.cart.billTo.companyName;
                    this.cart.shipTo.address1 = this.cart.billTo.address1;
                    this.cart.shipTo.address2 = this.cart.billTo.address2;
                    this.cart.shipTo.country = this.cart.billTo.country;
                    this.cart.shipTo.state = this.cart.billTo.state;
                    this.cart.shipTo.city = this.cart.billTo.city;
                    this.cart.shipTo.postalCode = this.cart.billTo.postalCode;
                    this.cart.shipTo.phone = this.cart.billTo.phone;
                    //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
                    if (this.cart.shipTo.address1.match(this.pattern)) {
                        $(".st-add1-error").attr("style", "display:block");
                        $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    }
                    else {
                        $(".st-add1-error").attr("style", "display:none");
                        $('#continueCheckoutBtn').removeAttr('disabled');
                    }

                    if (this.cart.shipTo.address2.match(this.pattern)) {
                        $(".st-add2-error").attr("style", "display:block");
                        $('#continueCheckoutBtn').attr('disabled', 'disabled');
                    }
                    else {
                        $(".st-add2-error").attr("style", "display:none");
                        $('#continueCheckoutBtn').removeAttr('disabled');
                    }

                    //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field
                }
                else {
                    //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
                    $(".st-add1-error").attr("style", "display:none");
                    $('#continueCheckoutBtn').removeAttr('disabled');

                    $(".st-add2-error").attr("style", "display:none");
                    $('#continueCheckoutBtn').removeAttr('disabled');
                    //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field
                    this.isReadOnly = false;
                    this.cart.shipTo.firstName = "";
                    this.cart.shipTo.lastName = "";
                    this.cart.shipTo.companyName = "";
                    this.cart.shipTo.address1 = "";
                    this.cart.shipTo.address2 = "";
                    this.cart.shipTo.city = "";
                    this.cart.shipTo.postalCode = "";
                    this.cart.shipTo.phone = "";
                }
            }
            //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
            else if (this.cart.shipTo.address1.match(this.pattern)) {
                $(".st-add1-error").attr("style", "display:block");
                $('#continueCheckoutBtn').attr('disabled', 'disabled');
            }
            else {
                $(".st-add1-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }

            if (this.cart.shipTo.address2.match(this.pattern)) {
                $(".st-add2-error").attr("style", "display:block");
                $('#continueCheckoutBtn').attr('disabled', 'disabled');
            }
            else {
                $(".st-add2-error").attr("style", "display:none");
                $('#continueCheckoutBtn').removeAttr('disabled');
            }
            //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field

            $("#addressForm").validate().resetForm();
            this.updateValidationRules("stfirstname", this.selectedShipTo.validation.firstName);
            this.updateValidationRules("stlastname", this.selectedShipTo.validation.lastName);
            this.updateValidationRules("stcompanyName", this.selectedShipTo.validation.companyName);
            this.updateValidationRules("ststate", this.selectedShipTo.validation.state);
        }
        // BUSA-372 : Add "same as Billing Address" check box in Checkout page for new User Ends

        //BUSA-1069  start : Hide "Create One Time Shipping Address" in the checkout for smart supply
        protected getAddressFieldsCompleted(addressFields: AddressFieldCollectionModel): void {
            this.addressFields = addressFields;

            this.cartService.expand = "shiptos,validation,cartlines";
            this.cartService.getCart(this.cartId).then(
                (cart: CartModel) => {
                    this.getCartCompleted(cart);
                },
                (error: any) => { this.getCartFailed(error); });
        }
        //BUSA-1069  end : Hide "Create One Time Shipping Address" in the checkout for smart supply
    }

    angular
        .module("insite")
        .controller("CheckoutAddressController", BrasselerCheckoutAddressController);
}