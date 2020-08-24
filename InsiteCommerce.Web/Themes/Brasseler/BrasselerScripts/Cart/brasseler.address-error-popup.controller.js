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
    var cart;
    (function (cart) {
        "use strict";
        //BUSA-768 Extended controller to redirect to address page on postal code error.
        var BrasselerAddressErrorPopupController = /** @class */ (function (_super) {
            __extends(BrasselerAddressErrorPopupController, _super);
            function BrasselerAddressErrorPopupController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BrasselerAddressErrorPopupController.prototype.displayFunction = function () {
                var $popup = angular.element(".address-error-popup");
                if ($popup.length > 0) {
                    var path = this.$window.location.pathname.toLowerCase();
                    if (path.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1 || path.indexOf(this.myAccountAddressUrl.toLowerCase()) > -1) {
                        this.continueUrl = "";
                    }
                    else {
                        this.continueUrl = this.checkoutAddressUrl;
                    }
                    this.coreService.displayModal($popup);
                }
            };
            return BrasselerAddressErrorPopupController;
        }(cart.AddressErrorPopupController));
        cart.BrasselerAddressErrorPopupController = BrasselerAddressErrorPopupController;
        angular
            .module("insite")
            .controller("AddressErrorPopupController", BrasselerAddressErrorPopupController);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.address-error-popup.controller.js.map