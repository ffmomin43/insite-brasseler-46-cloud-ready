

module insite.cart {

    "use strict";

    export interface IBrasselerCartService {
        forceRecalculation: boolean;
        cartLoadCalled: boolean;
        preventCartLoad: boolean;
        expand: string;
        cartPopupTimeout: number;
        getCart(cartId?: string): ng.IPromise<CartModel>;
        addSmartSupplyLine(cartLine: CartLineModel): ng.IPromise<CartLineModel>;
        addSmartSupplyLineFromProduct(product: ProductDto, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto): ng.IPromise<CartLineModel>;
    }

    export class BrasselerCartService implements IBrasselerCartService {
        forceRecalculation: boolean = false;
        serviceUri = "/api/v1/carts";
        cartSettingsUri = "/api/v1/settings/cart";
        //BUSA-463 : Subscription. Add to Smart Supply on first click.
        SmartSupplycartLinesUri = "/api/v1/carts/current/cartlines";
        cartLinesUri = "";
        currentCartLinesUri = "";
        currentCart: CartModel = null;
        cartPopupTimeout = 3000;
        cartLoadCalled = false;
        preventCartLoad = false;
        expand = "";

        private invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";



        static $inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService", "coreService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected addToCartPopupService: IAddToCartPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected httpWrapperService: core.HttpWrapperService,
            protected coreService: core.ICoreService) {
        }



        getCart(cartId?: string, suppressApiErrors = false): ng.IPromise<CartModel> {
            if (!cartId) {
                cartId = "current";
            }

            if (cartId === "current") {
                this.cartLoadCalled = true;
            }

            const uri = `${this.serviceUri}/${cartId}`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: uri, params: this.getCartParams(), bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartModel>) => { this.getCartCompleted(response, cartId); },
                suppressApiErrors ? this.getCartFailedSuppressErrors : this.getCartFailed);
        }

        protected getCartFailedSuppressErrors(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected getCartParams(): any {
            const params = {} as any;
            if (this.expand) {
                params.expand = this.expand;
            }

            if (this.forceRecalculation) {
                params.forceRecalculation = this.forceRecalculation;
            }

            return params;
        }

        protected getCartCompleted(response: ng.IHttpPromiseCallbackArg<CartModel>, cartId: string): void {
            const cart = response.data;
            this.cartLinesUri = cart.cartLinesUri;
            if (cartId === "current") {
                this.currentCart = cart;
                this.currentCartLinesUri = cart.cartLinesUri;
                this.$rootScope.$broadcast("cartLoaded", cart);
            }
        }

        protected getCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.showCartError(error.data);
        }

        protected showCartError(error: any): void {
            if (error.message === this.invalidAddressException) {
                this.addressErrorPopupService.display(null);
            } else {
                this.apiErrorPopupService.display(error);
            }
        }

        addSmartSupplyLine(cartLine: CartLineModel, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
            const parsedQty = parseFloat(cartLine.qtyOrdered.toString());
            cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
            const postUrl = toCurrentCart ? this.currentCartLinesUri : this.SmartSupplycartLinesUri;// BUSA-1121 : Add to Smart Supply from PDP, product does not get added to cart in the first click.
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: cartLine, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartLineModel>) => { this.addLineCompleted(response, showAddToCartPopup); },
                this.addLineFailed);
        }

        protected addLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.getCart();
            this.showCartError(error.data);
        }

        protected addLineCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>, showAddToCartPopup?: boolean): void {
            const cartLine = response.data;
            this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
            //cartLine.availability = cartLine.availability;
            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        addSmartSupplyLineFromProduct(product: ProductDto, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
            const cartLine = {} as CartLineModel;
            cartLine.productId = product.id;
            cartLine.qtyOrdered = product.qtyOrdered;
            cartLine.unitOfMeasure = product.unitOfMeasure;
            cartLine.properties = {};
            cartLine.properties["IsSubscriptionOpted"] = "true";
            if (configuration) {
                cartLine.sectionOptions = (configuration as any); // both contain sectionOptionId
            }

            if (productSubscription) {
                const productSubscriptionCustomPropertyName = "ProductSubscription";
                cartLine.properties = {};
                cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
            }

            return this.addSmartSupplyLine(cartLine, toCurrentCart, showAddToCartPopup);
        }

    }

    angular
        .module("insite")
        .service("brasselerCartService", BrasselerCartService);

}