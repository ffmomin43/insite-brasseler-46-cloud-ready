module insite.orderapproval {
    "use strict";

    export class BrasselerOrderApprovalDetailController extends OrderApprovalDetailController {
        currentCart: CartModel;
        account: AccountModel;
        cart: CartModel;
        promotions: PromotionModel[];
        approveOrderErrorMessage: string;
        validationMessage: string;
        frequencyMap: any;
        optedFrequency: string;
        errorMessage: string;

        static $inject = ["orderApprovalService", "cartService", "accountService", "coreService", "queryString", "spinnerService", "$window", "promotionService", "addToCartPopupService", "$rootScope"];

        constructor(
            protected orderApprovalService: orderapproval.IOrderApprovalService,
            protected cartService: cart.ICartService,
            protected accountService: account.IAccountService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService,
            protected spinnerService: core.ISpinnerService,
            protected $window: ng.IWindowService,
            protected promotionService: promotions.IPromotionService,
            protected addToCartPopupService: insite.cart.IAddToCartPopupService,
            protected $rootScope: ng.IRootScopeService) {
            super(orderApprovalService, cartService, accountService, coreService, queryString);

        }

        //BUSA-1038 Removed init() and added SS params for DBConcurrency
        protected orderApprovalServiceGetCartCompleted(cart: CartModel): void {
            this.cart = cart;
            this.canApproveOrders();
            if (this.cart.properties["subscriptionFrequency"] != null) {
                this.frequencyMap = JSON.parse(this.cart.properties["subscriptionFrequency"]);
                this.optedFrequency = this.cart.properties['subscriptionFrequencyOpted'];
            }
            if (this.promotionService != undefined) {
                this.getPromotions(this.cart.id);
            }
        }

        protected getCartPromotionsCompleted(promotionCollection: PromotionCollectionModel): void {
            this.promotions = promotionCollection.promotions;
        }

        protected getCartPromotionsFailed(error: any): void {
        }

        protected updateCartFailed(error: any): void {
            this.approveOrderErrorMessage = error.message;
            this.$window.scrollTo(0, 0);
        }

        getPromotions(cartId): void {
            this.promotionService.getCartPromotions(cartId).then(
                (promotionCollection: PromotionCollectionModel) => { this.getCartPromotionsCompleted(promotionCollection); },
                (error: any) => { this.getCartPromotionsFailed(error); });
        }

        update() {
            var cartId = this.queryString.get("cartid");
            this.orderApprovalService.getCart(cartId).then(cart => {
                this.cart = cart;
                this.getPromotions(cartId);
                this.canApproveOrders();
            });
            this.initEvents();
        }

        updateLine(cartLine: CartLineModel, refresh: boolean, redirectURI?: string) {
            if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                if (this.cart.lineCount == 1) {
                    this.cartService.removeCart(this.cart).then(() => {
                        this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                    });
                } else {
                    this.cartService.removeLine(cartLine).then(result => {
                        this.spinnerService.show();
                        this.update();
                    });
                    this.spinnerService.show();
                }

            } else {
                this.cartService.updateLine(cartLine, refresh).then(result => {
                    // BUSA-1319: Limit Qty Per Product Popup
                    if (result.properties['isQtyAdjusted'] != undefined) {
                        this.addToCartPopupService.display({ isQtyAdjusted: result.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                        this.$rootScope.$broadcast("cartChanged");
                    }
                    this.spinnerService.show();
                    this.approveOrderErrorMessage = null;
                    this.update();
                },
                    (error: any) => { this.updateLineFailed(error); });
                this.spinnerService.show();
            }
        }

        updateLineFailed (error: any): void
        {
            this.approveOrderErrorMessage = error.message;
        }

        removeLine(cartLine: CartLineModel, redirectURI: string) {
            if (this.cart.lineCount == 1) {
                this.cartService.removeCart(this.cart).then(() => {
                    this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                });
            }
            else {
                this.cartService.removeLine(cartLine).then(result => {
                    this.spinnerService.show();
                    this.update();
                });
                this.spinnerService.show();
            }
        }

        quantityKeyPress(keyEvent: KeyboardEvent, cartLine: CartLineModel) {
            if (keyEvent.which === 13) {
                (<any>keyEvent.target).blur();
                this.spinnerService.show();
            }
        }

        cancelOrder(redirectUri: string) {
            this.cartService.removeCart(this.cart).then(() => {
                this.$window.location.href = redirectUri;
            });
        }
    }

    angular
        .module("insite")
        .controller("OrderApprovalDetailController", BrasselerOrderApprovalDetailController);
}