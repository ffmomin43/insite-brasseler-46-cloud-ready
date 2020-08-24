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
        var BrasselerMyAccountAddressController = /** @class */ (function (_super) {
            __extends(BrasselerMyAccountAddressController, _super);
            function BrasselerMyAccountAddressController($location, $localStorage, customerService, websiteService, sessionService, queryString, $rootScope) {
                var _this = _super.call(this, $location, $localStorage, customerService, websiteService, sessionService, queryString, $rootScope) || this;
                _this.$location = $location;
                _this.$localStorage = $localStorage;
                _this.customerService = customerService;
                _this.websiteService = websiteService;
                _this.sessionService = sessionService;
                _this.queryString = queryString;
                _this.$rootScope = $rootScope;
                _this.init();
                return _this;
            }
            BrasselerMyAccountAddressController.prototype.init = function () {
                this.getBillTo();
            };
            BrasselerMyAccountAddressController.prototype.getBillTo = function (selectedShipTo) {
                var _this = this;
                this.customerService.getBillTo("shiptos,validation,country,state").then(function (result) {
                    _this.billTo = result;
                    var chkIfOneTimeShipTo = new RegExp('[a-z,A-Z]');
                    _this.billTo.shipTos = _this.billTo.shipTos.filter(function (shipTo) {
                        if (shipTo.id == "") {
                            return false;
                        }
                        else
                            return !(chkIfOneTimeShipTo.test(shipTo.customerSequence));
                    });
                    _this.billTo.shipTos.forEach(function (x) {
                        if (x.label != "Use Billing Address")
                            x.label = x.label.slice(1);
                    });
                    _this.websiteService.getCountries("states").then(function (result) {
                        _this.countries = result.countries;
                        _this.setObjectToReference(_this.countries, _this.billTo, "country");
                        if (_this.billTo.country) {
                            _this.setObjectToReference(_this.billTo.country.states, _this.billTo, "state");
                        }
                        var shipTos = _this.billTo.shipTos;
                        var shipToBillTo;
                        shipTos.forEach(function (shipTo) {
                            _this.setObjectToReference(_this.countries, shipTo, "country");
                            if (shipTo.country) {
                                _this.setObjectToReference(shipTo.country.states, shipTo, "state");
                            }
                            if (shipTo.id === _this.billTo.id) {
                                shipToBillTo = shipTo;
                            }
                        });
                        if (shipToBillTo) {
                            _this.billTo.label = shipToBillTo.label;
                            shipTos.splice(shipTos.indexOf(shipToBillTo), 1);
                            shipTos.unshift(_this.billTo);
                        }
                        if (selectedShipTo) {
                            shipTos.forEach(function (shipTo) {
                                if (shipTo.id === selectedShipTo.id) {
                                    _this.shipTo = shipTo;
                                }
                            });
                        }
                        else {
                            _this.shipTo = shipTos[0];
                        }
                    });
                });
            };
            BrasselerMyAccountAddressController.$inject = ["$location", "$localStorage", "customerService", "websiteService", "sessionService", "queryString", "$rootScope"];
            return BrasselerMyAccountAddressController;
        }(account.MyAccountAddressController));
        account.BrasselerMyAccountAddressController = BrasselerMyAccountAddressController;
        angular
            .module("insite")
            .controller("MyAccountAddressController", BrasselerMyAccountAddressController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.my-account-address.controller.js.map