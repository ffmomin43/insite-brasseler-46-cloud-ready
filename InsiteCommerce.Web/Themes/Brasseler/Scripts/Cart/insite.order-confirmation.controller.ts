module insite.cart {
    "use strict";
    import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;
    import CountryModel = Insite.Websites.WebApi.V1.ApiModels.CountryModel;

    export class OrderConfirmationController {
        cart: CartModel;
        creditCardBillingAddress: BaseAddressModel;
        promotions: PromotionModel[];
        showRfqMessage: boolean;
        order: OrderModel;
        settings: AccountSettingsModel;
        isGuestUser: boolean;

        static $inject = ["cartService", "promotionService", "queryString", "orderService", "sessionService", "settingsService", "addToWishlistPopupService"];

        constructor(
            protected cartService: ICartService,
            protected promotionService: promotions.IPromotionService,
            protected queryString: common.IQueryStringService,
            protected orderService: order.IOrderService,
            protected sessionService: account.ISessionService,
            protected settingsService: core.ISettingsService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService) {
        }

        $onInit(): void {
            const confirmedCartId = this.queryString.get("cartId");

            this.cartService.expand = "cartlines,carriers,creditCardBillingAddress";

            this.cartService.getCart(confirmedCartId).then(
                (confirmedCart: CartModel) => { this.getConfirmedCartCompleted(confirmedCart); },
                (error: any) => { this.getConfirmedCartFailed(error); });

            // get the current cart to update the mini cart
            this.cartService.expand = "";

            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getConfirmedCartCompleted(confirmedCart: CartModel): void {
            this.cart = confirmedCart;

            if (this.cart.creditCardBillingAddress) {
                this.creditCardBillingAddress = <any>this.cart.creditCardBillingAddress;
                this.creditCardBillingAddress.state = ({ abbreviation: this.cart.creditCardBillingAddress.stateAbbreviation } as StateModel);
                this.creditCardBillingAddress.country = ({ abbreviation: this.cart.creditCardBillingAddress.countryAbbreviation } as CountryModel);
            }

            if (window.hasOwnProperty("dataLayer")) {
                const data = {
                    "event": "transactionComplete",
                    "transactionId": this.cart.orderNumber,
                    "transactionAffiliation": this.cart.billTo.companyName,
                    "transactionTotal": this.cart.orderGrandTotal,
                    "transactionTax": this.cart.totalTax,
                    "transactionShipping": this.cart.shippingAndHandling,
                    "transactionProducts": []
                };

                const cartLines = this.cart.cartLines;
                for (let key in cartLines) {
                    if (cartLines.hasOwnProperty(key)) {
                        const cartLine = cartLines[key];
                        data.transactionProducts.push({
                            "sku": cartLine.erpNumber,
                            "name": cartLine.shortDescription,
                            "price": cartLine.pricing.unitNetPrice,
                            "quantity": cartLine.qtyOrdered
                        });
                    }
                }

                (window as any).dataLayer.push(data);
            }

            this.orderService.getOrder(this.cart.orderNumber, "").then(
                (order: OrderModel) => { this.getOrderCompleted(order); },
                (error: any) => { this.getCartFailed(error); });

            this.promotionService.getCartPromotions(this.cart.id).then(
                (promotionCollection: PromotionCollectionModel) => { this.getCartPromotionsCompleted(promotionCollection); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getConfirmedCartFailed(error: any): void {
        }

        protected getOrderCompleted(orderHistory: OrderModel): void {
            this.order = orderHistory;
        }

        protected getOrderFailed(error: any): void {
        }

        protected getCartPromotionsCompleted(promotionCollection: PromotionCollectionModel): void {
            this.promotions = promotionCollection.promotions;
        }

        protected getCartPromotionsFailed(error: any): void {
        }

        protected getCartCompleted(cart: CartModel): void {
            this.showRfqMessage = cart.canRequestQuote && cart.quoteRequiredCount > 0;
        }

        protected getCartFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.isGuestUser = session.isAuthenticated && session.isGuest;
        }

        protected getSessionFailed(error: any): void {
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.accountSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        openWishListPopup() {
            const products = this.cart.cartLines
                .filter(o => o.canAddToWishlist)
                .map(o => ({ id: o.productId, qtyOrdered: o.qtyOrdered, selectedUnitOfMeasure: o.unitOfMeasure } as ProductDto));

            this.addToWishlistPopupService.display(products);
        }
    }

    angular
        .module("insite")
        .controller("OrderConfirmationController", OrderConfirmationController);
}