//BUSA-1061 - start: Removed Redundant API calls to single call (Countries,shipto, address fields)

module insite.cart {
    "use strict";

    export class BrasselerAddressValidateController {
        pattern = /(p[\_\-\.\s]?o.?[\_\.\-\s]?|postoffice|post office\s)b(\d+|\.|ox\d+|ox)?\b/igm;
        static $inject = [
            "$scope"
        ];
        init() {

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
    }

    angular
        .module("insite")
        .controller("BrasselerAddressValidateController", BrasselerAddressValidateController);
}

//BUSA-1061 - end: Removed Redundant API calls  to single call (Countries,shipto,address fields)