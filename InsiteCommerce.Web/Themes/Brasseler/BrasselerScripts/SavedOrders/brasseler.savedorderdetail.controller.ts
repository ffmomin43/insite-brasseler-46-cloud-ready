module insite.savedorders {
    "use strict";

    export class BrasselerSavedOrderDetailController extends SavedOrderDetailController {
        cart: CartModel = null;
        canAddToCart = false;
        canAddAllToCart = false;
        showInventoryAvailability = false;
        isUpdateInProgress = false;
        errorMessage: String;

        static $inject = [
            "cartService",
            "coreService",
            "spinnerService",
            "settingsService",
            "queryString",
            "addToWishlistPopupService",
            "$scope",
            "$window",
            "addToCartPopupService",
            "$rootScope"
        ];

        constructor(
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected addToCartPopupService: insite.cart.IAddToCartPopupService,
            protected $rootScope: ng.IRootScopeService) {
            super(cartService, coreService, spinnerService, settingsService, queryString, addToWishlistPopupService);
            this.init();
        }

        init() {
            //Start : BUSA-695 : Saved orders page should display with updated price if admin updates price list.
            //this.$scope.$on("settingsLoaded", (event, data) => {
            var cartId = this.queryString.get("cartid");
            //BUSA-1130: Saved Order Error, added a boolean parameter "true" after the cartId 
            this.cartService.getCart(cartId, true).then(cart => {
                this.cart = cart;
                this.cart.showTaxAndShipping = true;
            });
            //});
            //End : BUSA-695 : Saved orders page should display with updated price if admin updates price list.
            super.init();
        }

        //BUSA-524 : Saved Orders and Wishlist Pricing update start.
        //updatePrice() {
        //    var cartId = this.coreService.getQueryStringParameter("cartid", true);
        //    this.cartService.getCart(cartId).then(cart => {
        //        this.cart = cart;
        //        this.cart.cartLines.forEach(x=> { this.updateLine(x, true); }
        //            )
        //    });
        //}
        //BUSA-524 : Saved Orders and Wishlist Pricing update end.

        protected addLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
        }
        updateLine(cartLine: CartLineModel, refresh: boolean, redirectURI?: string) {
            if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                this.spinnerService.show();
                if (this.cart.lineCount == 1) {
                    this.cartService.removeCart(this.cart).then(() => {
                        this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                    });
                } else {
                    // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                    this.cartService.removeLine(cartLine).then(result => {
                        this.init();
                    });
                }

            } else {
                // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                this.cartService.updateLine(cartLine, refresh).then(result => {
                    // BUSA-1319: Limit Qty Per Product Popup
                    if (result.properties['isQtyAdjusted'] != undefined) {
                        this.addToCartPopupService.display({ isQtyAdjusted: result.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                        this.$rootScope.$broadcast("cartChanged");
                    }
                    super.init();
                });
                this.spinnerService.show();
            }
        }

        removeLine(cartLine: CartLineModel, redirectURI: string) {
            if (this.cart.lineCount == 1) {
                this.cartService.removeCart(this.cart).then(() => {
                    this.$window.location.href = redirectURI + "?returnUrl=" + this.$window.location.href;
                });
            }
            else {
                // BUSA-580 : Save Order Details - Page reloads when user updates the quantity.
                this.cartService.removeLine(cartLine).then(result => {
                    this.init();
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
    }

    angular
        .module("insite")
        .controller("SavedOrderDetailController", BrasselerSavedOrderDetailController);
}