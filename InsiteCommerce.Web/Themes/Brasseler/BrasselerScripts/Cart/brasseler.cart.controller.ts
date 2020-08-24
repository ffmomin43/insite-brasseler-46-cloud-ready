module insite.cart {
    "use strict";

    export class BrasselerCartController extends CartController {
        static $inject = [
            "$scope",
            "cartService",
            "promotionService",
            "settingsService",
            "coreService",
            "$localStorage",
            "addToWishlistPopupService",
            "spinnerService",
            "sessionService"];

        isCartSubscribed: string = "";

        constructor(
            protected $scope: ICartScope,
            protected cartService: ICartService,
            protected promotionService: promotions.IPromotionService,
            protected settingsService: core.ISettingsService,
            protected coreService: core.ICoreService,
            protected $localStorage: common.IWindowStorage,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected spinnerService: core.ISpinnerService,
            protected sessionService: account.ISessionService) {
            super($scope, cartService, promotionService, settingsService, coreService, $localStorage, addToWishlistPopupService, spinnerService, sessionService);
        }

        displayCart(cart: CartModel): void {
            this.cart = cart;
          
            //BUSA-842:"Punch-out" button should be grey out and unclick able when cart consists of out of stock products.
            if (this.cart.hasInsufficientInventory) {
                $("#btnCartCheckoutPunchout").attr("style", "cursor: not-allowed;pointer-events: none");
                $("#btnCartCheckoutPunchout").addClass("disabled");
            }
            else {
                $("#btnCartCheckoutPunchout").removeClass("disabled");
                $("#btnCartCheckoutPunchout").removeAttr("style");
            }
            this.canAddAllToList = this.cart.cartLines.every(l => l.canAddToWishlist);
            this.promotionService.getCartPromotions(this.cart.id).then(
                (promotionCollection: PromotionCollectionModel) => { this.getCartPromotionsCompleted(promotionCollection); },
                (error: any) => { this.getCartPromotionsFailed(error); });
        }

        continueCheckout(url: any): void {
            window.location.href = url;

            //Google Tag Manager measuring cart checkout *****************
            var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
            dataLayer.push({
                'event': 'checkout',
                'ecommerce': {
                    'checkout': {
                        'actionField': { 'step': 1, 'option': 'cart Checkout' },
                        'cart': [{
                            'price': this.cart.totalCountDisplay,
                            'quantity': this.cart.totalQtyOrdered,
                            'brand': 'Brasseler',
                        }]
                    }
                },
                'eventCallback': function () {
                    document.location = url
                }
            });
        }
    }

    angular
        .module("insite")
        .controller("CartController", BrasselerCartController);
}