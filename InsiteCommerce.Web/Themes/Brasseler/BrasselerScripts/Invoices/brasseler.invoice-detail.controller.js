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
    var invoice;
    (function (invoice_1) {
        "use strict";
        var BrasselerInvoiceDetailController = /** @class */ (function (_super) {
            __extends(BrasselerInvoiceDetailController, _super);
            function BrasselerInvoiceDetailController(invoiceService, coreService, queryString, cartService, orderService) {
                var _this = _super.call(this, invoiceService, coreService, queryString) || this;
                _this.invoiceService = invoiceService;
                _this.coreService = coreService;
                _this.queryString = queryString;
                _this.cartService = cartService;
                _this.orderService = orderService;
                _this.canReorderItems = true;
                _super.prototype.$onInit.call(_this);
                return _this;
            }
            //BUSA-678: Add RMA possibility to the invoice history
            BrasselerInvoiceDetailController.prototype.reorderProduct = function ($event, line) {
                $event.preventDefault();
                line.canAddToCart = false;
                var aa = this.convertToCartLine(line);
                this.cartService.addLine(aa);
            };
            BrasselerInvoiceDetailController.prototype.convertToCartLine = function (line) {
                var cartLine = {};
                cartLine.productId = line.properties["productID"];
                cartLine.qtyOrdered = line.qtyInvoiced;
                cartLine.unitOfMeasure = line.unitOfMeasure;
                return cartLine;
            };
            BrasselerInvoiceDetailController.prototype.reorderAllProducts = function ($event) {
                $event.preventDefault();
                this.canReorderItems = false;
                var cartLines = [];
                for (var i = 0; i < this.invoice.invoiceLines.length; i++) {
                    cartLines.push(this.convertToCartLine(this.invoice.invoiceLines[i]));
                }
                if (cartLines.length > 0) {
                    this.cartService.addLineCollection(cartLines);
                }
            };
            BrasselerInvoiceDetailController.prototype.addLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            BrasselerInvoiceDetailController.prototype.getInvoiceCompleted = function (invoice) {
                var _this = this;
                _super.prototype.getInvoiceCompleted.call(this, invoice);
                var invoiceOrderNumber = this.invoice.invoiceLines[0].erpOrderNumber + '-0';
                this.orderService.getOrder(invoiceOrderNumber, "").then(function (result) {
                    _this.invoice.properties["isSampleOrFreeProd"] = result.properties["isSampleOrFreeProd"];
                });
            };
            BrasselerInvoiceDetailController.$inject = [
                "invoiceService",
                "coreService",
                "queryString",
                "cartService",
                "orderService"
            ];
            return BrasselerInvoiceDetailController;
        }(invoice_1.InvoiceDetailController));
        invoice_1.BrasselerInvoiceDetailController = BrasselerInvoiceDetailController;
        angular
            .module("insite")
            .controller("InvoiceDetailController", BrasselerInvoiceDetailController);
    })(invoice = insite.invoice || (insite.invoice = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.invoice-detail.controller.js.map