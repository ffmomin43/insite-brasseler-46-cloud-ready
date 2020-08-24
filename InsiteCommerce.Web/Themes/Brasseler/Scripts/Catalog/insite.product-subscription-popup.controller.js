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
        var ProductSubscriptionPopupController = /** @class */ (function () {
            function ProductSubscriptionPopupController($rootScope, coreService, productSubscriptionPopupService) {
                this.$rootScope = $rootScope;
                this.coreService = coreService;
                this.productSubscriptionPopupService = productSubscriptionPopupService;
            }
            ProductSubscriptionPopupController.prototype.$onInit = function () {
                var _this = this;
                this.productSubscriptionPopupService.registerDisplayFunction(function (data) {
                    _this.product = data.product;
                    _this.cartLine = data.cartLine;
                    _this.currentProductSubscription = data.productSubscription;
                    _this.initializeSubscriptionOptions();
                    _this.initializeProductSubscription();
                    setTimeout(function () {
                        _this.coreService.displayModal(angular.element("#popup-product-subscription"));
                    });
                });
            };
            ProductSubscriptionPopupController.prototype.initializeSubscriptionOptions = function () {
                this.subscriptionCyclePeriodOptions = ["Day", "Month"];
            };
            ProductSubscriptionPopupController.prototype.initializeProductSubscription = function () {
                var defaultProductSubscription = this.getDefaultProductSubscription();
                this.productSubscription = {
                    subscriptionAddToInitialOrder: defaultProductSubscription.subscriptionAddToInitialOrder,
                    subscriptionAllMonths: defaultProductSubscription.subscriptionAllMonths,
                    subscriptionApril: defaultProductSubscription.subscriptionApril,
                    subscriptionAugust: defaultProductSubscription.subscriptionAugust,
                    subscriptionCyclePeriod: defaultProductSubscription.subscriptionCyclePeriod || "Month",
                    subscriptionDecember: defaultProductSubscription.subscriptionDecember,
                    subscriptionFebruary: defaultProductSubscription.subscriptionFebruary,
                    subscriptionFixedPrice: defaultProductSubscription.subscriptionFixedPrice,
                    subscriptionJanuary: defaultProductSubscription.subscriptionJanuary,
                    subscriptionJuly: defaultProductSubscription.subscriptionJuly,
                    subscriptionJune: defaultProductSubscription.subscriptionJune,
                    subscriptionMarch: defaultProductSubscription.subscriptionMarch,
                    subscriptionMay: defaultProductSubscription.subscriptionMay,
                    subscriptionNovember: defaultProductSubscription.subscriptionNovember,
                    subscriptionOctober: defaultProductSubscription.subscriptionOctober,
                    subscriptionPeriodsPerCycle: defaultProductSubscription.subscriptionPeriodsPerCycle,
                    subscriptionSeptember: defaultProductSubscription.subscriptionSeptember,
                    subscriptionShipViaId: defaultProductSubscription.subscriptionShipViaId,
                    subscriptionTotalCycles: defaultProductSubscription.subscriptionTotalCycles
                };
            };
            ProductSubscriptionPopupController.prototype.getDefaultProductSubscription = function () {
                var defaultProductSubscription = null;
                if (this.currentProductSubscription) {
                    return this.currentProductSubscription;
                }
                if (this.cartLine) {
                    var productSubscriptionCustomPropertyName = "productSubscription";
                    var productSubscriptionProperty = this.cartLine.properties[productSubscriptionCustomPropertyName];
                    if (productSubscriptionProperty) {
                        defaultProductSubscription = JSON.parse(productSubscriptionProperty);
                    }
                    if (!defaultProductSubscription) {
                        defaultProductSubscription = this.cartLine.productSubscription;
                    }
                }
                if (!defaultProductSubscription) {
                    defaultProductSubscription = this.product.productSubscription;
                }
                return defaultProductSubscription;
            };
            ProductSubscriptionPopupController.prototype.saveProductSubscription = function () {
                this.$rootScope.$broadcast("updateProductSubscription", this.productSubscription, this.product, this.cartLine);
                this.coreService.closeModal("#popup-product-subscription");
            };
            ProductSubscriptionPopupController.prototype.cancelProductSubscription = function () {
                this.coreService.closeModal("#popup-product-subscription");
            };
            ProductSubscriptionPopupController.$inject = ["$rootScope", "coreService", "productSubscriptionPopupService"];
            return ProductSubscriptionPopupController;
        }());
        catalog.ProductSubscriptionPopupController = ProductSubscriptionPopupController;
        var ProductSubscriptionPopupService = /** @class */ (function (_super) {
            __extends(ProductSubscriptionPopupService, _super);
            function ProductSubscriptionPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ProductSubscriptionPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-product-subscription-popup></isc-product-subscription-popup>";
            };
            return ProductSubscriptionPopupService;
        }(base.BasePopupService));
        catalog.ProductSubscriptionPopupService = ProductSubscriptionPopupService;
        angular
            .module("insite")
            .controller("ProductSubscriptionPopupController", ProductSubscriptionPopupController)
            .service("productSubscriptionPopupService", ProductSubscriptionPopupService)
            .directive("iscProductSubscriptionPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductSubscriptionPopup",
            controller: "ProductSubscriptionPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-subscription-popup.controller.js.map