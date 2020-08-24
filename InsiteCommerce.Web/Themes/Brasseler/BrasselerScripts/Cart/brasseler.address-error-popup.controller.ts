module insite.cart {
    "use strict";

    //BUSA-768 Extended controller to redirect to address page on postal code error.
    export class BrasselerAddressErrorPopupController extends AddressErrorPopupController {

        protected displayFunction(): void {
            const $popup = angular.element(".address-error-popup");
            if ($popup.length > 0) {
                const path = this.$window.location.pathname.toLowerCase();
                if (path.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1 || path.indexOf(this.myAccountAddressUrl.toLowerCase()) > -1) {
                    this.continueUrl = "";
                } else {
                    this.continueUrl = this.checkoutAddressUrl;
                }
                this.coreService.displayModal($popup);
            }
        }
    }
    angular
        .module("insite")
        .controller("AddressErrorPopupController", BrasselerAddressErrorPopupController)
}