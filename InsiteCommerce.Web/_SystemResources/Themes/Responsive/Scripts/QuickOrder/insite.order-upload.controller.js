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
        var BaseUploadController = insite.common.BaseUploadController;
        var UploadError = insite.common.UploadError;
        var OrderUploadController = /** @class */ (function (_super) {
            __extends(OrderUploadController, _super);
            function OrderUploadController($scope, productService, cartService, coreService, settingsService, sessionService) {
                var _this = _super.call(this, $scope, productService, coreService, settingsService) || this;
                _this.$scope = $scope;
                _this.productService = productService;
                _this.cartService = cartService;
                _this.coreService = coreService;
                _this.settingsService = settingsService;
                _this.sessionService = sessionService;
                return _this;
            }
            OrderUploadController.prototype.$onInit = function () {
                var _this = this;
                _super.prototype.$onInit.call(this);
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            OrderUploadController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
            };
            OrderUploadController.prototype.getSettingsFailed = function (error) {
            };
            OrderUploadController.prototype.uploadProducts = function (popupSelector) {
                var _this = this;
                _super.prototype.uploadProducts.call(this, popupSelector);
                this.cartService.addLineCollectionFromProducts(this.products, true, false).then(function (cartLineCollection) { _this.uploadingCompleted(cartLineCollection); }, function (error) { _this.uploadingFailed(error); });
            };
            OrderUploadController.prototype.addProductToList = function (product, item, index) {
                var baseUnitOfMeasure = this.getBaseUnitOfMeasure(product);
                var currentUnitOfMeasure = this.getCurrentUnitOfMeasure(product);
                if (product.trackInventory && !product.canBackOrder && !product.quoteRequired && baseUnitOfMeasure && currentUnitOfMeasure &&
                    product.qtyOrdered * baseUnitOfMeasure.qtyPerBaseUnitOfMeasure > product.qtyOnHand * currentUnitOfMeasure.qtyPerBaseUnitOfMeasure) {
                    var errorProduct = this.mapProductErrorInfo(index, UploadError.NotEnough, item.Name, product);
                    errorProduct.conversionRequested = currentUnitOfMeasure.qtyPerBaseUnitOfMeasure;
                    errorProduct.conversionOnHands = baseUnitOfMeasure.qtyPerBaseUnitOfMeasure;
                    errorProduct.umOnHands = baseUnitOfMeasure.unitOfMeasureDisplay;
                    this.errorProducts.push(errorProduct);
                }
                this.products.push(product);
            };
            OrderUploadController.prototype.showUploadingPopup = function () {
                this.coreService.displayModal(angular.element("#orderUploadingPopup"));
            };
            OrderUploadController.prototype.hideUploadingPopup = function () {
                this.coreService.closeModal("#orderUploadingPopup");
            };
            OrderUploadController.prototype.showUploadSuccessPopup = function () {
                var $popup = angular.element("#orderUploadSuccessPopup");
                if ($popup.length > 0) {
                    this.coreService.displayModal($popup);
                }
            };
            OrderUploadController.prototype.hideUploadSuccessPopup = function () {
                this.coreService.closeModal("#orderUploadSuccessPopup");
            };
            OrderUploadController.prototype.showUploadingIssuesPopup = function () {
                this.coreService.displayModal(angular.element("#orderUploadingIssuesPopup"));
            };
            OrderUploadController.prototype.hideUploadingIssuesPopup = function () {
                this.cleanupUploadData();
                this.coreService.closeModal("#orderUploadingIssuesPopup");
            };
            OrderUploadController.prototype.batchGetCompleted = function (products) {
                var _this = this;
                if (this.uploadCancelled) {
                    return;
                }
                var currentContext = this.sessionService.getContext();
                if (this.settings.realTimeInventory && products.some(function (o) { return o != null; })
                    && ((!this.settings.allowBackOrderForDelivery && currentContext.fulfillmentMethod === "Ship")
                        || (!this.settings.allowBackOrderForPickup && currentContext.fulfillmentMethod === "PickUp"))) {
                    this.productService.getProductRealTimeInventory(products.filter(function (o) { return o != null; })).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory, products); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
                else {
                    this.processProducts(products);
                    this.checkCompletion();
                }
            };
            OrderUploadController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory, products) {
                this.processProducts(products);
                this.checkCompletion();
            };
            OrderUploadController.prototype.getProductRealTimeInventoryFailed = function (error) {
            };
            OrderUploadController.$inject = [
                "$scope",
                "productService",
                "cartService",
                "coreService",
                "settingsService",
                "sessionService"
            ];
            return OrderUploadController;
        }(BaseUploadController));
        quickorder.OrderUploadController = OrderUploadController;
        angular
            .module("insite")
            .controller("OrderUploadController", OrderUploadController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-upload.controller.js.map