var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductAvailabilityMessageController = /** @class */ (function () {
            function ProductAvailabilityMessageController(availabilityByWarehousePopupService, productService) {
                this.availabilityByWarehousePopupService = availabilityByWarehousePopupService;
                this.productService = productService;
            }
            ProductAvailabilityMessageController.prototype.showLink = function (productSettings, page) {
                if (productSettings && productSettings.displayInventoryPerWarehouse && productSettings.showInventoryAvailability) {
                    return !productSettings.displayInventoryPerWarehouseOnlyOnProductDetail || productSettings.displayInventoryPerWarehouseOnlyOnProductDetail && page === "ProductDetail";
                }
                return false;
            };
            ProductAvailabilityMessageController.prototype.openPopup = function (productSettings, productId, unitOfMeasure, configuration) {
                this.availabilityByWarehousePopupService.display({ warehouses: [] });
                if (productSettings.realTimeInventory) {
                    this.getRealTimeInventory(productId, unitOfMeasure, configuration);
                }
                else {
                    this.getWarehouses(productId, unitOfMeasure, configuration);
                }
            };
            ProductAvailabilityMessageController.prototype.getWarehouses = function (productId, unitOfMeasure, configuration) {
                var _this = this;
                this.productService.getProductByParameters({ productId: productId, unitOfMeasure: unitOfMeasure, configuration: configuration, expand: "warehouses", replaceProducts: false }).then(function (productModel) { _this.getProductCompleted(productModel); }, function (error) { _this.getProductFailed(error); });
            };
            ProductAvailabilityMessageController.prototype.getProductCompleted = function (productModel) {
                this.availabilityByWarehousePopupService.updatePopupData({
                    warehouses: productModel.product.warehouses
                });
            };
            ProductAvailabilityMessageController.prototype.getProductFailed = function (error) {
                this.availabilityByWarehousePopupService.close();
            };
            ProductAvailabilityMessageController.prototype.getRealTimeInventory = function (productId, unitOfMeasure, configuration) {
                var _this = this;
                var configurations = {};
                configurations["" + productId] = configuration;
                this.productService.getProductRealTimeInventory([{ id: productId, productUnitOfMeasures: [] }], ["warehouses"], configurations).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory, productId, unitOfMeasure); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
            };
            ProductAvailabilityMessageController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory, productId, unitOfMeasure) {
                var realTimeInventoryResult = realTimeInventory.realTimeInventoryResults.find(function (o) { return o.productId === productId; });
                if (realTimeInventoryResult) {
                    var inventoryWarehousesDto = realTimeInventoryResult.inventoryWarehousesDtos.find(function (o) { return o.unitOfMeasure === unitOfMeasure; })
                        || realTimeInventoryResult.inventoryWarehousesDtos[0];
                    if (inventoryWarehousesDto) {
                        this.availabilityByWarehousePopupService.updatePopupData({
                            warehouses: inventoryWarehousesDto.warehouseDtos
                        });
                    }
                }
            };
            ProductAvailabilityMessageController.prototype.getProductRealTimeInventoryFailed = function (error) {
                this.availabilityByWarehousePopupService.close();
            };
            ProductAvailabilityMessageController.$inject = [
                "availabilityByWarehousePopupService",
                "productService"
            ];
            return ProductAvailabilityMessageController;
        }());
        catalog.ProductAvailabilityMessageController = ProductAvailabilityMessageController;
        ;
        angular
            .module("insite")
            .controller("ProductAvailabilityMessageController", ProductAvailabilityMessageController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-availability-message.controller.js.map