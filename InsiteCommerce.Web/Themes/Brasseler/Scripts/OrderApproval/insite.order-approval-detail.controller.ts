module insite.orderapproval {
    "use strict";

    export class OrderApprovalDetailController {
        currentCart: CartModel;
        account: AccountModel;
        cart: CartModel;
        approveOrderErrorMessage: string;
        validationMessage: string;

        static $inject = ["orderApprovalService", "cartService", "accountService", "coreService", "queryString"];

        constructor(
            protected orderApprovalService: orderapproval.IOrderApprovalService,
            protected cartService: cart.ICartService,
            protected accountService: account.IAccountService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            const cartId = this.queryString.get("cartid");

            this.initEvents();

            this.accountService.getAccount().then(
                (account: AccountModel) => { this.getAccountCompleted(account); },
                (error: any) => { this.getAccountFailed(error); });

            this.orderApprovalService.getCart(cartId).then(
                (cart: CartModel) => { this.orderApprovalServiceGetCartCompleted(cart); },
                (error: any) => { this.orderApprovalServiceGetCartFailed(error); });
        }

        protected initEvents(): void {
            this.cartService.getCart().then(
                (cart: CartModel) => { this.cartServiceGetCartCompleted(cart); },
                (error: any) => { this.cartServiceGetCartFailed(error); });
        }

        protected getAccountCompleted(account: AccountModel): void {
            this.account = account;
        }

        protected getAccountFailed(error: any): void {
        }

        protected orderApprovalServiceGetCartCompleted(cart: CartModel): void {
            this.cart = cart;
            this.canApproveOrders();
        }

        protected orderApprovalServiceGetCartFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        protected cartServiceGetCartCompleted(cart: CartModel): void {
            this.currentCart = cart;
            this.canApproveOrders();
        }

        protected cartServiceGetCartFailed(error: any): void {
        }

        protected canApproveOrders(): void {
            if (this.account && this.account.canApproveOrders && this.cart) {
                this.account.canApproveOrders = this.account.userName !== this.cart.initiatedByUserName;
            }
        }

        approveOrder(cartUri: string): void {
            this.approveOrderErrorMessage = "";
            this.cart.status = "Cart";

            this.cartService.updateCart(this.cart).then(
                (cart: CartModel) => { this.updateCartCompleted(cartUri, cart); },
                (error: any) => { this.updateCartFailed(error); });
        }

        protected updateCartCompleted(cartUri: string, cart: CartModel): void {
            this.coreService.redirectToPath(cartUri);
        }

        protected updateCartFailed(error: any): void {
            this.approveOrderErrorMessage = error.message;
        }
    }

    angular
        .module("insite")
        .controller("OrderApprovalDetailController", OrderApprovalDetailController);
}