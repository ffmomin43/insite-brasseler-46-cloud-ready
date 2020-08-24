var insite;
(function (insite) {
    var order;
    (function (order_1) {
        "use strict";
        var OrderDetailController = /** @class */ (function () {
            function OrderDetailController(orderService, settingsService, queryString, coreService, sessionService, cartService, addToWishlistPopupService) {
                this.orderService = orderService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.coreService = coreService;
                this.sessionService = sessionService;
                this.cartService = cartService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.canReorderItems = false;
                this.showCancelationConfirmation = false;
            }
            OrderDetailController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.orderNumber = this.queryString.get("orderNumber");
                if (typeof this.orderNumber === "undefined") {
                    // handle "clean urls"
                    var pathArray = window.location.pathname.split("/");
                    var pathOrderNumber = pathArray[pathArray.length - 1];
                    if (pathOrderNumber !== "OrderHistoryDetail") {
                        this.orderNumber = pathOrderNumber;
                    }
                }
                this.stEmail = this.queryString.get("stEmail");
                this.stPostalCode = this.queryString.get("stPostalCode");
                this.extraProperties = {
                    stEmail: this.stEmail,
                    stPostalCode: this.stPostalCode
                };
                this.getOrder(this.orderNumber, this.stEmail, this.stPostalCode);
                this.getOrderStatusMappings();
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            OrderDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.canReorderItems = settingsCollection.orderSettings.canReorderItems;
                this.showPoNumber = settingsCollection.orderSettings.showPoNumber;
                this.showTermsCode = settingsCollection.orderSettings.showTermsCode;
            };
            OrderDetailController.prototype.getSettingsFailed = function (error) {
            };
            OrderDetailController.prototype.getOrderStatusMappings = function () {
                var _this = this;
                this.orderService.getOrderStatusMappings().then(function (orderStatusMappingCollection) { _this.getOrderStatusMappingsCompleted(orderStatusMappingCollection); }, function (error) { _this.getOrderStatusMappingsFailed(error); });
            };
            OrderDetailController.prototype.getOrderStatusMappingsCompleted = function (orderStatusMappingCollection) {
                this.allowRmaStatuses = [];
                this.allowCancellationStatuses = [];
                for (var i = 0; i < orderStatusMappingCollection.orderStatusMappings.length; i++) {
                    if (orderStatusMappingCollection.orderStatusMappings[i].allowRma) {
                        this.allowRmaStatuses.push(orderStatusMappingCollection.orderStatusMappings[i].erpOrderStatus);
                    }
                    if (orderStatusMappingCollection.orderStatusMappings[i].allowCancellation) {
                        this.allowCancellationStatuses.push(orderStatusMappingCollection.orderStatusMappings[i].erpOrderStatus);
                    }
                }
            };
            OrderDetailController.prototype.getOrderStatusMappingsFailed = function (error) {
            };
            OrderDetailController.prototype.allowCancellationCheck = function (status) {
                return this.allowCancellationStatuses && this.allowCancellationStatuses.indexOf(status) !== -1;
            };
            OrderDetailController.prototype.allowRmaCheck = function (status) {
                return this.isAuthenticated && this.allowRmaStatuses && this.allowRmaStatuses.indexOf(status) !== -1;
            };
            OrderDetailController.prototype.discountOrderFilter = function (promotion) {
                if (promotion == null) {
                    return false;
                }
                return (promotion.promotionResultType === "AmountOffOrder" || promotion.promotionResultType === "PercentOffOrder");
            };
            OrderDetailController.prototype.discountShippingFilter = function (promotion) {
                if (promotion == null) {
                    return false;
                }
                return (promotion.promotionResultType === "AmountOffShipping" || promotion.promotionResultType === "PercentOffShipping");
            };
            OrderDetailController.prototype.formatCityCommaStateZip = function (city, state, zip) {
                var formattedString = "";
                if (city) {
                    formattedString += city;
                }
                if (city && (state || zip)) {
                    formattedString += ",";
                }
                if (state) {
                    formattedString += " " + state;
                }
                if (zip) {
                    formattedString += " " + zip;
                }
                return formattedString;
            };
            OrderDetailController.prototype.getOrder = function (orderNumber, stEmail, stPostalCode) {
                var _this = this;
                this.orderService.getOrder(orderNumber, "orderlines,shipments", stEmail, stPostalCode).then(function (order) { _this.getOrderCompleted(order); }, function (error) { _this.getOrderFailed(error); });
            };
            OrderDetailController.prototype.getOrderCompleted = function (order) {
                this.order = order;
                this.btFormat = this.formatCityCommaStateZip(this.order.billToCity, this.order.billToState, this.order.billToPostalCode);
                this.stFormat = this.formatCityCommaStateZip(this.order.shipToCity, this.order.shipToState, this.order.shipToPostalCode);
            };
            OrderDetailController.prototype.getOrderFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            OrderDetailController.prototype.reorderProduct = function ($event, line) {
                var _this = this;
                $event.preventDefault();
                line.canAddToCart = false;
                var reorderItemsCount = 0;
                for (var i = 0; i < this.order.orderLines.length; i++) {
                    if (this.order.orderLines[i].canAddToCart) {
                        reorderItemsCount++;
                    }
                }
                this.canReorderItems = reorderItemsCount !== 0;
                this.cartService.addLine(this.orderService.convertToCartLine(line), true).then(function (cartLine) { _this.addLineCompleted(cartLine); }, function (error) { _this.addLineFailed(error); });
            };
            OrderDetailController.prototype.addLineCompleted = function (cartLine) {
            };
            OrderDetailController.prototype.addLineFailed = function (error) {
            };
            OrderDetailController.prototype.reorderAllProducts = function ($event) {
                var _this = this;
                $event.preventDefault();
                this.canReorderItems = false;
                var cartLines = this.orderService.convertToCartLines(this.order.orderLines);
                if (cartLines.length > 0) {
                    this.cartService.addLineCollection(cartLines, true).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
                }
            };
            OrderDetailController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
            };
            OrderDetailController.prototype.addLineCollectionFailed = function (error) {
            };
            OrderDetailController.prototype.cancelAndReorder = function ($event) {
                this.reorderAllProducts($event);
                this.cancelOrder($event);
            };
            OrderDetailController.prototype.cancelOrder = function ($event) {
                var _this = this;
                // call update order with cancelation status
                var updateOrderModel = { status: "CancellationRequested" };
                updateOrderModel.erpOrderNumber = this.orderNumber;
                this.orderService.updateOrder(this.orderNumber, updateOrderModel).then(function (order) { _this.updateOrderCompleted(order); }, function (error) { _this.updateOrderFailed(error); });
            };
            OrderDetailController.prototype.updateOrderCompleted = function (order) {
                this.order.status = order.status;
                this.order.statusDisplay = order.statusDisplay;
                this.showCancelationConfirmation = true;
            };
            OrderDetailController.prototype.updateOrderFailed = function (error) {
                this.validationMessage = error.exceptionMessage;
            };
            OrderDetailController.prototype.showShareModal = function () {
                this.coreService.displayModal("#shareEntityPopupContainer");
            };
            OrderDetailController.prototype.openWishListPopup = function (orderLine) {
                var product = ({
                    id: orderLine.productId,
                    qtyOrdered: orderLine.qtyOrdered,
                    selectedUnitOfMeasure: orderLine.unitOfMeasure
                });
                this.addToWishlistPopupService.display([product]);
            };
            OrderDetailController.prototype.getSessionCompleted = function (sessionModel) {
                this.isAuthenticated = sessionModel.isAuthenticated;
            };
            OrderDetailController.prototype.getSessionFailed = function (error) {
            };
            OrderDetailController.$inject = ["orderService", "settingsService", "queryString", "coreService", "sessionService", "cartService", "addToWishlistPopupService"];
            return OrderDetailController;
        }());
        order_1.OrderDetailController = OrderDetailController;
        angular
            .module("insite")
            .controller("OrderDetailController", OrderDetailController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-detail.controller.js.map