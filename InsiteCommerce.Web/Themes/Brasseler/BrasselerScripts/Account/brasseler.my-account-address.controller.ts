module insite.account {
    "use strict";

    export class BrasselerMyAccountAddressController extends MyAccountAddressController {

        static $inject = ["$location", "$localStorage", "customerService", "websiteService", "sessionService", "queryString", "$rootScope"];

        constructor(
            protected $location: ng.ILocaleService,
            protected $localStorage: common.IWindowStorage,
            protected customerService: customers.ICustomerService,
            protected websiteService: websites.IWebsiteService,
            protected sessionService: account.ISessionService,
            protected queryString: common.IQueryStringService,
            protected $rootScope: ng.IRootScopeService) {
            super($location, $localStorage, customerService, websiteService, sessionService, queryString, $rootScope);
            this.init();
        }

        init() {
            this.getBillTo();
        }


        getBillTo(selectedShipTo?: ShipToModel) {
            this.customerService.getBillTo("shiptos,validation,country,state").then(result => {
                this.billTo = result;
                var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
                this.billTo.shipTos = this.billTo.shipTos.filter(shipTo => {
                    if (shipTo.id == "") {
                        return false;
                    }
                    else
                        return !(chkIfOneTimeShipTo.test(shipTo.customerSequence))
                });
                this.billTo.shipTos.forEach(x => {
                    if (x.label != "Use Billing Address")
                        x.label = x.label.slice(1);
                });

                this.websiteService.getCountries("states").then(result => {
                    this.countries = result.countries;

                    this.setObjectToReference(this.countries, this.billTo, "country");
                    if (this.billTo.country) {
                        this.setObjectToReference(this.billTo.country.states, this.billTo, "state");
                    }

                    var shipTos = this.billTo.shipTos;

                    var shipToBillTo: ShipToModel;
                    shipTos.forEach(shipTo => {
                        this.setObjectToReference(this.countries, shipTo, "country");
                        if (shipTo.country) {
                            this.setObjectToReference(shipTo.country.states, shipTo, "state");
                        }
                        if (shipTo.id === this.billTo.id) {
                            shipToBillTo = shipTo;
                        }
                    });

                    if (shipToBillTo) {
                        this.billTo.label = shipToBillTo.label;
                        shipTos.splice(shipTos.indexOf(shipToBillTo), 1);
                        shipTos.unshift(<ShipToModel><any>this.billTo);
                    }

                    if (selectedShipTo) {
                        shipTos.forEach(shipTo => {
                            if (shipTo.id === selectedShipTo.id) {
                                this.shipTo = shipTo;
                            }
                        });
                    } else {
                        this.shipTo = shipTos[0];
                    }
                });
            });
        }
    }

    angular
        .module("insite")
        .controller("MyAccountAddressController", BrasselerMyAccountAddressController);
}
