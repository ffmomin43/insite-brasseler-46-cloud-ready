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
    var quickorder;
    (function (quickorder) {
        "use strict";
        var BrasselerQuickOrderPageController = /** @class */ (function (_super) {
            __extends(BrasselerQuickOrderPageController, _super);
            function BrasselerQuickOrderPageController($scope, $filter, coreService, cartService, productService, searchService, settingsService, addToWishlistPopupService, sessionService, spinnerService) {
                var _this = _super.call(this, $scope, $filter, coreService, cartService, productService, searchService, settingsService, addToWishlistPopupService) || this;
                _this.$scope = $scope;
                _this.$filter = $filter;
                _this.coreService = coreService;
                _this.cartService = cartService;
                _this.productService = productService;
                _this.searchService = searchService;
                _this.settingsService = settingsService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.sessionService = sessionService;
                _this.spinnerService = spinnerService;
                _this.isNewUser = false;
                _this.newWebShopperCustomerNumber = "1055357";
                console.log('inside custom method');
                return _this;
                //this.init();
            }
            BrasselerQuickOrderPageController.prototype.init = function () {
                _super.prototype.init.call(this);
            };
            BrasselerQuickOrderPageController.prototype.getProductCompleted = function (product) {
                var _this = this;
                // TODO ISC-4519
                // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
                if (this.sessionService != undefined) {
                    this.sessionService.getSession().then(function (session) {
                        if (session != null && session != undefined && session.billTo) {
                            if (String(session.billTo.customerNumber).includes(_this.newWebShopperCustomerNumber)) {
                                _this.isNewUser = true;
                                console.log(_this.isNewUser);
                            }
                        }
                    });
                }
                this.addProduct(product.product);
            };
            BrasselerQuickOrderPageController.prototype.addAllToCart = function (redirectUrl) {
                var _this = this;
                this.spinnerService.show();
                this.cartService.addLineCollectionFromProducts(this.products, true).then(function (cartLines) { _this.addAllToCartCompleted(cartLines, redirectUrl); _this.spinnerService.hide(); }, function (error) {
                    _this.addAllToCartFailed(error);
                    _this.sampleErrorMessage = error.message;
                    _this.spinnerService.hide();
                });
            };
            BrasselerQuickOrderPageController.$inject = ["$scope", "$filter", "coreService", "cartService", "productService", "searchService", "settingsService", "addToWishlistPopupService", "sessionService", "spinnerService"];
            return BrasselerQuickOrderPageController;
        }(quickorder.QuickOrderPageController));
        quickorder.BrasselerQuickOrderPageController = BrasselerQuickOrderPageController;
        angular
            .module("insite")
            .controller("QuickOrderPageController", BrasselerQuickOrderPageController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.quick-order-page.controller.js.map