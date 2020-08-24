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
    var catalog;
    (function (catalog) {
        "use strict";
        var BrasselerCrossSellCarouselController = /** @class */ (function (_super) {
            __extends(BrasselerCrossSellCarouselController, _super);
            function BrasselerCrossSellCarouselController(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope, $rootScope, sessionService) {
                var _this = _super.call(this, cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope) || this;
                _this.cartService = cartService;
                _this.productService = productService;
                _this.$timeout = $timeout;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.settingsService = settingsService;
                _this.$scope = $scope;
                _this.$rootScope = $rootScope;
                _this.sessionService = sessionService;
                _this.newWebShopperCustomerNumber = "1055357";
                _this.isNewUser = false;
                _this.init();
                return _this;
            }
            BrasselerCrossSellCarouselController.prototype.init = function () {
                var _this = this;
                if (this.sessionService != undefined) {
                    this.sessionService.getSession().then(function (session) {
                        _this.session = session;
                        if (_this.session != null && _this.session != undefined && _this.session.billTo) {
                            if (String(_this.session.billTo.customerNumber).includes(_this.newWebShopperCustomerNumber)) {
                                _this.isNewUser = true;
                            }
                        }
                    });
                }
                _super.prototype.$onInit.call(this);
            };
            BrasselerCrossSellCarouselController.prototype.addToCart = function (product) {
                if (this.isAuthenticated()) {
                    _super.prototype.addToCart.call(this, product);
                }
                else {
                    this.$rootScope.$broadcast("addToCartList");
                }
            };
            BrasselerCrossSellCarouselController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
                this.sampleErrorMessage = error.message;
            };
            BrasselerCrossSellCarouselController.prototype.isAuthenticated = function () {
                return this.session && this.session.isAuthenticated;
            };
            BrasselerCrossSellCarouselController.$inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope", "$rootScope", "sessionService"];
            return BrasselerCrossSellCarouselController;
        }(catalog.CrossSellCarouselController));
        catalog.BrasselerCrossSellCarouselController = BrasselerCrossSellCarouselController;
        angular.module("insite")
            .controller("CrossSellCarouselController", BrasselerCrossSellCarouselController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.crosssellcarousel.controller.js.map