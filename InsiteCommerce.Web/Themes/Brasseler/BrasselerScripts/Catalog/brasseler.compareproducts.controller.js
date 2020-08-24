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
        var BrasselerCompareProductsController = /** @class */ (function (_super) {
            __extends(BrasselerCompareProductsController, _super);
            function BrasselerCompareProductsController(cartService, coreService, productService, compareProductsService, addToWishlistPopupService, settingsService, $localStorage, $rootScope, $scope, $window) {
                var _this = _super.call(this, cartService, coreService, productService, compareProductsService, addToWishlistPopupService, settingsService, $localStorage) || this;
                _this.cartService = cartService;
                _this.coreService = coreService;
                _this.productService = productService;
                _this.compareProductsService = compareProductsService;
                _this.addToWishlistPopupService = addToWishlistPopupService;
                _this.settingsService = settingsService;
                _this.$localStorage = $localStorage;
                _this.$rootScope = $rootScope;
                _this.$scope = $scope;
                _this.$window = $window;
                _this.ready = false;
                _this.init();
                return _this;
            }
            BrasselerCompareProductsController.prototype.init = function () {
                _super.prototype.init.call(this);
            };
            BrasselerCompareProductsController.prototype.addToCart = function (product) {
                var _this = this;
                if (this.isAuthenticated()) {
                    this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
                }
                else {
                    this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
                }
            };
            BrasselerCompareProductsController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
                this.sampleErrorMessage = error.message;
            };
            BrasselerCompareProductsController.prototype.isAuthenticated = function () {
                return this.$localStorage.get("accessToken", null) !== null;
            };
            BrasselerCompareProductsController.$inject = [
                "cartService",
                "coreService",
                "productService",
                "compareProductsService",
                "addToWishlistPopupService",
                "settingsService",
                "$localStorage",
                "$rootScope",
                "$scope",
                "$window",
            ];
            return BrasselerCompareProductsController;
        }(catalog.CompareProductsController));
        catalog.BrasselerCompareProductsController = BrasselerCompareProductsController;
        angular.module("insite")
            .controller("CompareProductsController", BrasselerCompareProductsController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.compareproducts.controller.js.map