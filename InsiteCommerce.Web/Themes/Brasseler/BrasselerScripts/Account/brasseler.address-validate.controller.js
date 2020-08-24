//BUSA-1061 - start: Removed Redundant API calls to single call (Countries,shipto, address fields)
var insite;
(function (insite) {
    var cart;
    (function (cart) {
        "use strict";
        var BrasselerAddressValidateController = /** @class */ (function () {
            function BrasselerAddressValidateController() {
                this.pattern = /(p[\_\-\.\s]?o.?[\_\.\-\s]?|postoffice|post office\s)b(\d+|\.|ox\d+|ox)?\b/igm;
            }
            BrasselerAddressValidateController.prototype.init = function () {
            };
            BrasselerAddressValidateController.prototype.validateAddress1 = function (isAddress, val, field) {
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
            };
            BrasselerAddressValidateController.$inject = [
                "$scope"
            ];
            return BrasselerAddressValidateController;
        }());
        cart.BrasselerAddressValidateController = BrasselerAddressValidateController;
        angular
            .module("insite")
            .controller("BrasselerAddressValidateController", BrasselerAddressValidateController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//BUSA-1061 - end: Removed Redundant API calls  to single call (Countries,shipto,address fields)
//# sourceMappingURL=brasseler.address-validate.controller.js.map