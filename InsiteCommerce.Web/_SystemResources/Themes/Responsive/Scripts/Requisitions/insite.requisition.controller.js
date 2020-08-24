var insite;
(function (insite) {
    var requisitions;
    (function (requisitions) {
        "use strict";
        var RequisitionsController = /** @class */ (function () {
            function RequisitionsController(requisitionService, cartService, paginationService, coreService, $attrs, spinnerService) {
                this.requisitionService = requisitionService;
                this.cartService = cartService;
                this.paginationService = paginationService;
                this.coreService = coreService;
                this.$attrs = $attrs;
                this.spinnerService = spinnerService;
                this.requireQuote = {};
                this.approvedRequisitionCollection = {};
                this.paginationStorageKey = "DefaultPagination-Requisitions";
            }
            RequisitionsController.prototype.$onInit = function () {
                this.updateItemMessage = this.$attrs.updateItemMessage;
                this.deleteItemMessage = this.$attrs.deleteItemMessage;
                this.deleteOrderLineMessage = this.$attrs.deleteOrderLineMessage;
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.getRequisitions();
            };
            RequisitionsController.prototype.getRequisitions = function () {
                var _this = this;
                this.spinnerService.show();
                this.requisitionService.getRequisitions(this.pagination).then(function (requisitionCollection) { _this.getRequisitionsCompleted(requisitionCollection); }, function (error) { _this.getRequisitionsFailed(error); });
            };
            RequisitionsController.prototype.getRequisitionsCompleted = function (requisitionCollection) {
                var _this = this;
                this.requisitionCollection = requisitionCollection;
                this.pagination = requisitionCollection.pagination;
                this.requisitionCollection.requisitions.forEach(function (requisition) {
                    if (_this.approvedRequisitionCollection[requisition.id]) {
                        requisition.isApproved = true;
                    }
                });
                this.spinnerService.hide();
            };
            RequisitionsController.prototype.getRequisitionsFailed = function (error) {
                this.spinnerService.hide();
            };
            RequisitionsController.prototype.openRequisition = function (requisitionId) {
                var _this = this;
                this.message = "";
                this.requisitionService.getRequisition(requisitionId).then(function (requisition) { _this.getRequisitionCompleted(requisition); }, function (error) { _this.getRequisitionFailed(error); });
            };
            RequisitionsController.prototype.getRequisitionCompleted = function (requisition) {
                this.requisition = requisition;
                this.displayRequisition();
            };
            RequisitionsController.prototype.getRequisitionFailed = function (error) {
            };
            RequisitionsController.prototype.patchRequisitionLine = function (requisitionLine) {
                var _this = this;
                this.message = "";
                this.requisitionService.patchRequisitionLine(requisitionLine).then(function (requisition) { _this.patchRequisitionLineCompleted(requisitionLine, requisition); }, function (error) { _this.patchRequisitionLineFailed(error); });
            };
            RequisitionsController.prototype.patchRequisitionLineCompleted = function (requisitionLine, requisition) {
                this.getRequisitions();
                if (requisition === null) {
                    this.requisition.requisitionLineCollection = null;
                }
                else {
                    this.requisition = requisition;
                }
                if (requisitionLine.qtyOrdered <= 0) {
                    this.message = this.deleteItemMessage;
                }
                else {
                    this.message = this.updateItemMessage;
                }
            };
            RequisitionsController.prototype.patchRequisitionLineFailed = function (error) {
            };
            RequisitionsController.prototype.deleteRequisitionLine = function (requisitionLine) {
                var _this = this;
                this.message = "";
                this.spinnerService.show();
                this.requisitionService.deleteRequisitionLine(requisitionLine).then(function (requisition) { _this.deleteRequisitionLineCompleted(requisitionLine, requisition); }, function (error) { _this.deleteRequisitionLineFailed(error); });
            };
            RequisitionsController.prototype.deleteRequisitionLineCompleted = function (requisitionLine, requisition) {
                var _this = this;
                this.spinnerService.show();
                this.getRequisitions();
                this.requisition.requisitionLineCollection.requisitionLines = this.requisition.requisitionLineCollection.requisitionLines.filter(function (o) { return o.id !== requisitionLine.id; });
                if (this.requisition.requisitionLineCollection.requisitionLines.length === 0) {
                    this.message = this.deleteOrderLineMessage;
                    return;
                }
                this.requisitionService.getRequisition(this.requisition.id).then(function (requisition) { _this.getRequisitionAfterDeleteCompleted(requisition); }, function (error) { _this.getRequisitionAfterDeleteFailed(error); });
            };
            RequisitionsController.prototype.getRequisitionAfterDeleteCompleted = function (requisition) {
                this.requisition = requisition;
                if (this.requisition.requisitionLineCollection.requisitionLines.length === 0) {
                    this.message = this.deleteOrderLineMessage;
                }
                else {
                    this.message = this.deleteItemMessage;
                }
            };
            RequisitionsController.prototype.getRequisitionAfterDeleteFailed = function (error) {
            };
            RequisitionsController.prototype.deleteRequisitionLineFailed = function (error) {
            };
            RequisitionsController.prototype.displayRequisition = function () {
                this.coreService.displayModal(angular.element("#popup-requisition"));
            };
            RequisitionsController.prototype.addAllToCart = function () {
                var _this = this;
                var cartLines = [];
                angular.forEach(this.approvedRequisitionCollection, function (value) {
                    cartLines.push(value);
                });
                if (cartLines.length > 0) {
                    this.cartService.addLineCollection(cartLines).then(function (cartLineCollection) { _this.addLineCollectionCompleted(cartLineCollection); }, function (error) { _this.addLineCollectionFailed(error); });
                }
            };
            RequisitionsController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.getRequisitions();
            };
            RequisitionsController.prototype.addLineCollectionFailed = function (error) {
            };
            RequisitionsController.prototype.convertForPrice = function (requisition) {
                if (!requisition.quoteRequired) {
                    return requisition;
                }
                if (this.requireQuote[requisition.id]) {
                    return this.requireQuote[requisition.id];
                }
                var product = {};
                product.id = requisition.productId;
                product.quoteRequired = requisition.quoteRequired;
                this.requireQuote[requisition.id] = product;
                return product;
            };
            RequisitionsController.prototype.changeApprovedList = function (requisition) {
                if (requisition.isApproved) {
                    this.approvedRequisitionCollection[requisition.id] = requisition;
                }
                else {
                    delete this.approvedRequisitionCollection[requisition.id];
                }
            };
            RequisitionsController.$inject = ["requisitionService", "cartService", "paginationService", "coreService", "$attrs", "spinnerService"];
            return RequisitionsController;
        }());
        requisitions.RequisitionsController = RequisitionsController;
        angular
            .module("insite")
            .controller("RequisitionsController", RequisitionsController);
    })(requisitions = insite.requisitions || (insite.requisitions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.requisition.controller.js.map