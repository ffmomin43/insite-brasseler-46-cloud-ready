import CartSubscriptionDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.CartSubscriptionDto;
import CartModelBrasseler = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.CartModel_Brasseler;
import CartModels = insite.cart;

module insite.smartsupply {
    "use strict";

    export interface ISmartSupplyService {
        expand: string;
        postCartSubscriptionDto(cartSubscriptionDto: CartSubscriptionDto): ng.IPromise<CartSubscriptionDto>;
        getSmartSupplyCart(cartId?: string): ng.IPromise<CartModel>;
        //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts
        addLineToSmartSupply(product: ProductDto, cartId?: string, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto): ng.IPromise<CartLineModel>;
        addLine(cartLine: CartLineModel, cartId?: string): ng.IPromise<CartLineModel>;
        getSmartSupplyCarts(filter?: CartModels.IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<CartCollectionModel>;
        //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Ends
    }

    export class SmartSupplyService implements ISmartSupplyService {
        serviceUriCart = "/api/v1/carts";
        serviceUri = "/api/v1/SubscriptionCart";
        private invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";
        expand = "";
        cartPopupTimeout = 3000;
        cartLoadCalled = false;
        preventCartLoad = false;
        cartLinesUri = "";
        currentCartLinesUri = "";
        currentCart: CartModel = null;
        forceRecalculation = false;

        static $inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected addToCartPopupService: cart.IAddToCartPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getSmartSupplyCart(cartId?: string, suppressApiErrors = false): ng.IPromise<CartModel> {
            if (!cartId) {
                cartId = "current";
            }

            if (cartId === "current") {
                this.cartLoadCalled = true;
            }

            const uri = `${this.serviceUriCart}/${cartId}`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: uri, params: this.getCartParams(), bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } }),
                (response: ng.IHttpPromiseCallbackArg<CartModel>) => { this.getCartCompleted(response, cartId); },
                suppressApiErrors ? this.getCartFailedSuppressErrors : this.getCartFailed);
        }

        protected getCartFailedSuppressErrors(error: ng.IHttpPromiseCallbackArg<any>): void {
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

        protected getCartCompleted(response: ng.IHttpPromiseCallbackArg<CartModel>, cartId: string): void {
            const cart = response.data;
            this.cartLinesUri = cart.cartLinesUri;
            if (cartId === "current") {
                this.currentCart = cart;
                this.currentCartLinesUri = cart.cartLinesUri;
                this.$rootScope.$broadcast("cartLoaded", cart);
            }
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

        postCartSubscriptionDto(cartSubscriptionDto: CartSubscriptionDto): ng.IPromise<CartSubscriptionDto> {
            const postUrl = this.serviceUri;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: cartSubscriptionDto, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartSubscriptionDto>) => { this.PostCartSubscriptionDTOCompleted(response); },
                this.PostCartSubscriptionDTOFailed);
        }

        protected PostCartSubscriptionDTOCompleted(response: ng.IHttpPromiseCallbackArg<CartSubscriptionDto>): void {
        }

        protected PostCartSubscriptionDTOFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts
        addLineToSmartSupply(product: ProductDto, cartId?: string, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
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

            return this.addLine(cartLine, cartId, toCurrentCart, false);
        }

        addLine(cartLine: CartLineModel, cartId: string, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
            var parsedQty = parseFloat(cartLine.qtyOrdered.toString());
            cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
            var deferred = this.$q.defer();
            var uri = cartId + "/cartlines";
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: uri, data: cartLine, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartLineModel>) => { this.addLineCompleted(response, showAddToCartPopup); },
                this.addLineFailed);
        }

        protected addLineCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>, showAddToCartPopup?: boolean): void {
            const cartLine = response.data;
            this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
            cartLine.availability = cartLine.availability;
            //this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected addLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            //this.getCart();
            this.showCartError(error.data);
        }

        getSmartSupplyCarts(filter?: CartModels.IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<CartCollectionModel> {
            var uri = this.serviceUriCart;
            if (filter) {
                uri += "?";
                for (var property in filter) {
                    if (filter[property]) {
                        uri += property + "=" + filter[property] + "&";
                    }
                }
            }
            if (pagination) {
                uri += "page=" + pagination.currentPage + "&pageSize=" + pagination.pageSize;
            }
            uri = uri.replace(/&$/, "");
            //return this.$http({ method: "GET", url: uri, bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } });

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: uri, bypassErrorInterceptor: true, headers: { 'Cache-Control': 'no-cache' } }),
                this.getCartsCompleted,
                this.getCartsFailed
                );

        }

        protected getCartsCompleted(response: ng.IHttpPromiseCallbackArg<CartCollectionModel>): void {
        }

        protected getCartsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
        //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Ends
    }
    angular
        .module("insite")
        .service("smartSupplyService", SmartSupplyService);
}