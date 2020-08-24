module insite.invoice {
    "use strict";

    export class BrasselerInvoiceDetailController extends InvoiceDetailController {
        canReorderItems = true;
        errorMessage : string;

        static $inject = [
            "invoiceService",
            "coreService",
            "queryString",
            "cartService",
            "orderService"
        ];

        constructor(protected invoiceService: invoice.IInvoiceService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected cartService: cart.ICartService,
            protected orderService: order.IOrderService) {
            super(invoiceService, coreService, queryString)
            super.init();
        }

        //BUSA-678: Add RMA possibility to the invoice history
        reorderProduct($event, line: OrderLineModel): void {
            $event.preventDefault();
            line.canAddToCart = false;

            var aa = this.convertToCartLine(line);
            this.cartService.addLine(aa);
        }

        protected convertToCartLine(line: any): CartLineModel {
            var cartLine = <CartLineModel>{};
            cartLine.productId = line.properties["productID"];
            cartLine.qtyOrdered = line.qtyInvoiced;
            cartLine.unitOfMeasure = line.unitOfMeasure;

            return cartLine;
        }

        reorderAllProducts($event): void {
            $event.preventDefault();
            this.canReorderItems = false;
            var cartLines: CartLineModel[] = [];
            for (var i = 0; i < this.invoice.invoiceLines.length; i++) {
                cartLines.push(this.convertToCartLine(this.invoice.invoiceLines[i]));
            }
            if (cartLines.length > 0) {
                this.cartService.addLineCollection(cartLines);
            }
        }

        protected addLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
        }

        protected getInvoiceCompleted(invoice: InvoiceModel): void {
            super.getInvoiceCompleted(invoice);
            var invoiceOrderNumber = this.invoice.invoiceLines[0].erpOrderNumber + '-0';
            this.orderService.getOrder(invoiceOrderNumber, "").then(result => {
                this.invoice.properties["isSampleOrFreeProd"] = result.properties["isSampleOrFreeProd"];
            });
        }
    }

    angular
        .module("insite")
        .controller("InvoiceDetailController", BrasselerInvoiceDetailController);
}