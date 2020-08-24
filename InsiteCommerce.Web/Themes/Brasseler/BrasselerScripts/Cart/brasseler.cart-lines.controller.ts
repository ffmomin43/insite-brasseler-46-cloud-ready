module insite.cart {
    "use strict";

    import ProductDto = Insite.Catalog.Services.Dtos.ProductDto;

    export class BrasselerCartLinesController extends CartLinesController {
        errorMessage: string;
        openLineNoteId = "";
        isUpdateInProgress = false;
        grpRelatedProducts: any;
        brkPrices: BreakPriceDto[];
        testbool: boolean = true;
        isNewUser: boolean = false;
        newWebShopperCustomerNumber = "1055357";
        private invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";

        static $inject = ["$scope", "cartService", "productSubscriptionPopupService", "addToWishlistPopupService", "spinnerService", "sessionService", "coreService", "addressErrorPopupService", "apiErrorPopupService", "addToCartPopupService", "$rootScope"];

        constructor(
            protected $scope: ICartScope,
            protected cartService: ICartService,
            protected productSubscriptionPopupService: catalog.ProductSubscriptionPopupService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected spinnerService: core.ISpinnerService,
            protected sessionService: account.ISessionService,
            protected coreService: core.ICoreService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected addToCartPopupService: IAddToCartPopupService,
            protected $rootScope: ng.IRootScopeService) {
            super($scope, cartService, productSubscriptionPopupService, addToWishlistPopupService, spinnerService);
            this.init();

        }

        init(): void {
            super.init();
            if (this.sessionService != undefined) {
                this.sessionService.getSession().then(session => {
                    if (session != null && session != undefined && session.billTo) {
                        if (String(session.billTo.customerNumber).includes(this.newWebShopperCustomerNumber)) {
                            this.isNewUser = true;
                        }
                    }
                });
            }
        }

        updateLine(cartLine: CartLineModel, refresh: boolean, oldQtyOrdered: number = 1): void {
            if (cartLine.qtyOrdered || cartLine.qtyOrdered === 0) {
                if (refresh) {
                    this.isUpdateInProgress = true;
                }
                if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                    this.removeLine(cartLine);
                } else {
                    this.spinnerService.show();
                    this.cartService.updateLine(cartLine, refresh).then(
                        (cartLineModel: CartLineModel) => { this.updateLineCompleted(cartLineModel); },
                        (error: any) => { this.updateLineFailed(error); });
                }
            } else {
                cartLine.qtyOrdered = oldQtyOrdered;
            }
            $('.accord-check').prop("checked", false);
        }

        //BUSA-1170 Method to show error popup on Sample validation on cartline update start
        protected updateLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.cartService.getCart().then(
                (cart: CartModel) => { },
                (error: any) => { });
            this.showCartError(error);
        }

        protected showCartError(error: any): void {
            var sampleMessage = null;
            if (error.message != null || error.message == "") {
                sampleMessage = error.message.substring(0, 45);
            }
           
            if (sampleMessage.includes("Limit Notification") || sampleMessage.includes("Notification de limite")) {
                this.errorMessage = error.message;
                const $popup = angular.element("#sampleproduct");
                this.coreService.displayModal($popup);
            }
        }
        //BUSA-1170 Method to show error popup on Sample validation on cartline update end

        updateLineSubscription(cartLine: CartLineModel, refresh: boolean, isSubscriptionOpted: boolean, oldQtyOrdered: number = 1) {
            if (cartLine.qtyOrdered || cartLine.qtyOrdered === 0) {
                if (refresh) {
                    this.isUpdateInProgress = true;
                }
                if (parseFloat(cartLine.qtyOrdered.toString()) === 0) {
                    this.removeLine(cartLine);
                } else {
                    this.spinnerService.show();
                    cartLine.properties["IsSubscriptionOpted"] = isSubscriptionOpted.toString();
                    this.cartService.updateLine(cartLine, refresh).then(
                        (cartLineModel: CartLineModel) => { this.updateLineCompleted(cartLineModel); },
                        (error: any) => { this.updateLineFailed(error); });
                }
            } else {
                cartLine.qtyOrdered = oldQtyOrdered;
            }
            $('.accord-check').prop("checked", false);
        }

        protected updateLineCompleted(cartLine: CartLineModel): void {
            //BUSA-1319: Limit Qty Per Product Popup
            if (cartLine.properties['isQtyAdjusted'] != undefined) {
                this.addToCartPopupService.display({ isQtyAdjusted: cartLine.properties['isQtyAdjusted'] == 'True', showAddToCartPopup: true });
                this.$rootScope.$broadcast("cartChanged");
            }
        }

        //protected updateLineFailed(error: any): void {
        //}

        removeLine(cartLine: CartLineModel): void {
            this.spinnerService.show();
            this.cartService.removeLine(cartLine).then(
                () => { this.removeLineCompleted(cartLine); }, // the cartLine returned from the call will be null if successful, instead, send in the cartLine that was removed
                (error: any) => { this.removeLineFailed(error); });
            $('.accord-check').prop("checked", false);
            //********* BUSA-573 
            //Google Tag Manager measuring removeFromCart impressions *****************
            var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
            dataLayer.push({
                'event': 'removeFromCart',
                'ecommerce': {
                    'remove': {
                        'product': [{
                            "id": cartLine.productName,
                            "name": cartLine.shortDescription,
                            "price": cartLine.pricing.actualPriceDisplay,
                            "quantity": cartLine.qtyOrdered,
                            "variant": cartLine.unitOfMeasure,
                            "brand": "Brasseler"
                        }]
                    }
                }

            });
        }

        ShowRelatedProducts(cart: CartModel, cartLine: CartLineModel) {
            console.log("from showrelatedProd");
            // BUSA-665 : Volume discount group grid is displayed blank on cart page for fraction of seconds.
            this.spinnerService.show();
            var totalGrpQty = this.calculateTotalGrpQty(cart, cartLine);
            cart.properties['getRelatedProducts'] = 'getRelatedProducts';
            cart.properties['grpDescription'] = cartLine.properties['grpDescription'];
            this.cartService.updateCart(cart).then(result => {
                if (result.properties["grpRelatedProduct"] != null) {
                    this.grpRelatedProducts = JSON.parse(result.properties['grpRelatedProduct']);
                }
                this.calculateRemainingQty(cart, cartLine, totalGrpQty);
            });
        }

        calculateRemainingQty(cart: CartModel, cartLine: CartLineModel, totalGrpQty: number) {
            this.brkPrices = null;
            this.brkPrices = angular.copy(cartLine.breakPrices);
            this.brkPrices.forEach(x => {
                x.breakQty = x.breakQty - totalGrpQty;
            });

            var count = 0;
            this.brkPrices.forEach(x => {
                if (x.breakQty > 0) {
                    count = count + 1;
                }
            });
        }

        calculateTotalGrpQty(cart: CartModel, cartLine: CartLineModel): number {
            var totalGrpQty = 0.0;
            cart.cartLines.forEach(x => {
                if (x.properties['grpDescription'] != null && x.properties['altCnv'] != null && x.properties['grpDescription'] == cartLine.properties['grpDescription']) {
                    totalGrpQty = totalGrpQty + (Number(x.qtyOrdered) * (+(x.properties['altCnv']))); // BUSA-804 Changes to Volume Discount
                }
            });
            return totalGrpQty;
        }

        // BUSA-463 : Subscription. Sorting frequency
        sortFilter(input: any) {
            return parseInt(input.value);
        }
    }

    angular
        .module("insite")
        .controller("CartLinesController", BrasselerCartLinesController);
}