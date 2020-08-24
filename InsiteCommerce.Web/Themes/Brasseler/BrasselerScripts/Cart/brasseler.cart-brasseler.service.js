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
        var BrasslerCartService = /** @class */ (function (_super) {
            __extends(BrasslerCartService, _super);
            function BrasslerCartService($http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService, coreService) {
                var _this = _super.call(this, $http, $rootScope, $q, addressErrorPopupService, addToCartPopupService, apiErrorPopupService, httpWrapperService) || this;
                _this.$http = $http;
                _this.$rootScope = $rootScope;
                _this.$q = $q;
                _this.addressErrorPopupService = addressErrorPopupService;
                _this.addToCartPopupService = addToCartPopupService;
                _this.apiErrorPopupService = apiErrorPopupService;
                _this.httpWrapperService = httpWrapperService;
                _this.coreService = coreService;
                _this.invalidAddressExceptionNew = "Insite.Core.Exceptions.InvalidAddressException";
                _this.sampleException = "SampleException";
                return _this;
            }
            BrasslerCartService.prototype.showCartError = function (error) {
                var sampleMessage = null;
                if (error.message != null || error.message == "") {
                    sampleMessage = error.message.substring(0, 45);
                }
                if (error.message === this.invalidAddressExceptionNew) {
                    this.addressErrorPopupService.display(null);
                }
                else if (sampleMessage.includes("Limit Notification") || sampleMessage.includes("Notification de limite")) {
                    this.errorMessage = error.message;
                    var $popup = angular.element("#sampleproduct");
                    this.coreService.displayModal($popup);
                }
                else {
                    this.apiErrorPopupService.display(error);
                }
            };
            BrasslerCartService.$inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService", "coreService"];
            return BrasslerCartService;
        }(cart.CartService));
        cart.BrasslerCartService = BrasslerCartService;
        angular
            .module("insite")
            .service("cartService", BrasslerCartService);
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.cart-brasseler.service.js.map