module insite.cart {
    "use strict";
    import StateModel = Insite.Websites.WebApi.V1.ApiModels.StateModel;
    import CountryModel = Insite.Websites.WebApi.V1.ApiModels.CountryModel;

    export class BrasselerOrderConfirmationController extends OrderConfirmationController {

        isCartSubscribed = false;
        frequencyMap: any;
        deactivationDate: Date;
        nextShipDate: Date;

        static $inject = ["cartService", "promotionService", "queryString", "orderService", "sessionService", "settingsService"];

        constructor(
            protected cartService: ICartService,
            protected promotionService: promotions.IPromotionService,
            protected queryString: common.IQueryStringService,
            protected orderService: order.IOrderService,
            protected sessionService: account.ISessionService,
            protected settingsService: core.ISettingsService) {
            super(cartService, promotionService, queryString, orderService, sessionService, settingsService);
            super.init();
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
                    "event": "transactionComplete", 'ecommerce': {
                        'purchase': {
                            'actionField': {
                                "id": confirmedCart.orderNumber,
                                "affiliation": confirmedCart.billTo.companyName,
                                "revenue": confirmedCart.orderGrandTotal,
                                "tax": confirmedCart.totalTax,
                                "shipping": confirmedCart.shippingAndHandling
                            },
                            "products": []
                        }
                    }
                };

                const cartLines = this.cart.cartLines;
                for (let key in cartLines) {
                    if (cartLines.hasOwnProperty(key)) {
                        const cartLine = cartLines[key];
                        data.ecommerce.purchase.products.push({
                            "id": cartLine.erpNumber,
                            "name": cartLine.shortDescription,
                            "price": cartLine.pricing.unitNetPrice,
                            "quantity": cartLine.qtyOrdered,
                            "variant": cartLine.unitOfMeasure,
                            "brand": "Brasseler"
                        });
                       
                    }
                }

                (window as any).dataLayer.push(data);
                // BUSA-463 : Set Smart Supply Deactivation date a year from the order date.
                var orderDate = new Date(this.cart.orderDate.toString());
                var year = orderDate.getFullYear();
                var month = orderDate.getMonth();
                var day = orderDate.getDate();
                var deActivationDate = new Date(year + 1, month, day);
                this.deactivationDate = deActivationDate;
                this.nextShipDate = new Date(this.cart.properties["checkoutNextShipDate"]);//BUSA-871 showing next ship date
                if (this.cart.properties["checkoutNextShipDate"] != undefined) {
                    this.cart.properties["checkoutNextShipDate"] = this.cart.properties["checkoutNextShipDate"].substr(0, 10);
                }
            }
            this.cart.cartLines.forEach(cartline => {
                if (cartline.isSubscription == true && confirmedCart.properties['subscriptionFrequencyOpted']) {
                    this.isCartSubscribed = true;
                }
            });

            this.orderService.getOrder(this.cart.orderNumber, "").then(
                (order: OrderModel) => { this.getOrderCompleted(order); },
                (error: any) => { this.getCartFailed(error); });

            this.promotionService.getCartPromotions(this.cart.id).then(
                (promotionCollection: PromotionCollectionModel) => { this.getCartPromotionsCompleted(promotionCollection); },
                (error: any) => { this.getCartFailed(error); });
            if (this.cart.properties["subscriptionFrequency"] != null) {
                this.frequencyMap = JSON.parse(this.cart.properties["subscriptionFrequency"]);
            }
        }
    }

    angular
        .module("insite")
        .controller("OrderConfirmationController", BrasselerOrderConfirmationController);
}