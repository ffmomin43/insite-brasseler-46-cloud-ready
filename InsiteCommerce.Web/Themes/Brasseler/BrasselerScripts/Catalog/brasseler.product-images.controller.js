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
        var BrasselerProductImagesController = /** @class */ (function (_super) {
            __extends(BrasselerProductImagesController, _super);
            function BrasselerProductImagesController($scope, cartService) {
                var _this = _super.call(this, $scope) || this;
                _this.$scope = $scope;
                _this.cartService = cartService;
                _this.init();
                return _this;
            }
            BrasselerProductImagesController.prototype.init = function () {
                _super.prototype.init.call(this);
                if (this.cartService != undefined) {
                    this.cartService.getCart().then(function (result) {
                        grecaptcha.render('lblrecapResultp', {
                            'sitekey': result.properties['siteKey']
                        });
                    });
                }
            };
            BrasselerProductImagesController.$inject = ["$scope", "cartService"];
            return BrasselerProductImagesController;
        }(catalog.ProductImagesController));
        catalog.BrasselerProductImagesController = BrasselerProductImagesController;
        angular
            .module("insite")
            .controller("ProductImagesController", BrasselerProductImagesController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.product-images.controller.js.map