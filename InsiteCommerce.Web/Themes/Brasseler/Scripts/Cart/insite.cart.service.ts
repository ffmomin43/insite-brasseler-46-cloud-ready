import CartCollectionModel = Insite.Cart.WebApi.V1.ApiModels.CartCollectionModel;
import CartLineCollectionModel = Insite.Cart.WebApi.V1.ApiModels.CartLineCollectionModel;
import CartLineModel = Insite.Cart.WebApi.V1.ApiModels.CartLineModel;
import PaginationModel = Insite.Core.WebApi.PaginationModel;
import ProductSubscriptionDto = Insite.Catalog.Services.Dtos.ProductSubscriptionDto;

module insite.cart {
    "use strict";

    export interface IAddWishListToCartData {
        changedSharedListLinesQuantities: { [key: string]: number };
    }

    export interface ICartService {
        cartLoadCalled: boolean;
        expand: string;
        alsoPurchasedMaxResults: number;
        forceRecalculation: boolean;
        allowInvalidAddress: boolean;

        getCarts(filter?: IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<CartCollectionModel>;
        getCart(cartId?: string, suppressApiErrors?: boolean): ng.IPromise<CartModel>;
        updateCart(cart: CartModel, suppressApiErrors?: boolean): ng.IPromise<CartModel>;
        saveCart(cart: CartModel): ng.IPromise<CartModel>;
        submitRequisition(cart: CartModel): ng.IPromise<CartModel>;
        removeCart(cart: CartModel): ng.IPromise<CartModel>;
        addLine(cartLine: CartLineModel, toCurrentCart?: boolean, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel>;
        addLineFromProduct(product: ProductDto, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto, toCurrentCart?: boolean, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel>;
        addLineCollection(cartLines: any, toCurrentCart?: boolean, showAddToCartPopup?: boolean): ng.IPromise<CartLineCollectionModel>;
        addLineCollectionFromProducts(products: ProductDto[], toCurrentCart?: boolean, showAddToCartPopup?: boolean): ng.IPromise<CartLineCollectionModel>;
        addWishListToCart(wishListId: string, showAddToCartPopup?: boolean, data?: IAddWishListToCartData): ng.IPromise<CartLineCollectionModel>;
        updateLine(cartLine: CartLineModel, refresh: boolean): ng.IPromise<CartLineModel>;
        removeLine(cartLine: CartLineModel): ng.IPromise<CartLineModel>;
        removeLineCollection(cart: CartModel): ng.IPromise<CartModel>;
        getLoadedCurrentCart(): CartModel;
        getRealTimeInventory(cart: CartModel): ng.IPromise<RealTimeInventoryModel>;
    }

    export class CartService implements ICartService {
        serviceUri = "/api/v1/carts";
        cartSettingsUri = "/api/v1/settings/cart";
        realTimeInventoryUri = "/api/v1/realtimeinventory";
        cartLinesUri = "";
        currentCartLinesUri = "";

        cartLoadCalled = false;
        expand = "";
        alsoPurchasedMaxResults = 0;
        forceRecalculation = false;
        allowInvalidAddress = false;

        currentCart: CartModel = null;

        private invalidAddressException = "Insite.Core.Exceptions.InvalidAddressException";

        static $inject = ["$http", "$rootScope", "$q", "addressErrorPopupService", "addToCartPopupService", "apiErrorPopupService", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected addressErrorPopupService: cart.IAddressErrorPopupService,
            protected addToCartPopupService: IAddToCartPopupService,
            protected apiErrorPopupService: core.IApiErrorPopupService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        // returns the current cart if it is already loaded
        getLoadedCurrentCart(): CartModel {
            return this.currentCart;
        }

        getCarts(filter?: IQueryStringFilter, pagination?: PaginationModel): ng.IPromise<CartCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getCartsParams(filter, pagination) }),
                this.getCartsCompleted,
                this.getCartsFailed
            );
        }

        protected getCartsParams(filter?: IQueryStringFilter, pagination?: PaginationModel): any {
            const params: any = filter ? JSON.parse(JSON.stringify(filter)) : {};

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getCartsCompleted(response: ng.IHttpPromiseCallbackArg<CartCollectionModel>): void {
        }

        protected getCartsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
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

        protected getCartParams(): any {
            const params = {} as any;
            if (this.expand) {
                params.expand = this.expand;
            }

            if (this.alsoPurchasedMaxResults) {
                params.alsoPurchasedMaxResults = this.alsoPurchasedMaxResults;
            }

            if (this.forceRecalculation) {
                params.forceRecalculation = this.forceRecalculation;
            }

            if (this.allowInvalidAddress) {
                params.allowInvalidAddress = this.allowInvalidAddress;
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

        updateCart(cart: CartModel, suppressApiErrors = false): ng.IPromise<CartModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: cart.uri, data: cart }),
                this.updateCartCompleted,
                suppressApiErrors ? this.updateCartFailedSuppressErrors : this.updateCartFailed);
        }

        protected updateCartCompleted(response: ng.IHttpPromiseCallbackArg<CartModel>): void {
        }

        protected updateCartFailedSuppressErrors(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        protected updateCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.showCartError(error.data);
        }

        saveCart(cart: CartModel): ng.IPromise<CartModel> {
            cart.status = "Saved";
            return this.updateCart(cart);
        }

        submitRequisition(cart: CartModel): ng.IPromise<CartModel> {
            cart.status = "RequisitionSubmitted";
            return this.updateCart(cart);
        }

        removeCart(cart: CartModel): ng.IPromise<CartModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.delete(cart.uri),
                this.removeCartCompleted,
                this.removeCartFailed);
        }

        protected removeCartCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>): void {
            this.$rootScope.$broadcast("cartChanged");
        }

        protected removeCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        addLine(cartLine: CartLineModel, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
            const parsedQty = parseFloat(cartLine.qtyOrdered.toString());
            cartLine.qtyOrdered = parsedQty > 0 ? parsedQty : 1;

            const postUrl = toCurrentCart ? this.currentCartLinesUri : this.cartLinesUri;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: postUrl, data: cartLine, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartLineModel>) => { this.addLineCompleted(response, showAddToCartPopup); },
                this.addLineFailed);
        }

        protected addLineCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>, showAddToCartPopup?: boolean): void {
            const cartLine = response.data;
            this.addToCartPopupService.display({ isQtyAdjusted: cartLine.isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });
            cartLine.availability = cartLine.availability;
            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected addLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.getCart();
            this.showCartError(error.data);
        }

        addLineFromProduct(product: ProductDto, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineModel> {
            const cartLine = {} as CartLineModel;
            cartLine.productId = product.id;
            cartLine.qtyOrdered = product.qtyOrdered;
            cartLine.unitOfMeasure = product.unitOfMeasure;

            if (configuration) {
                cartLine.sectionOptions = (configuration as any); // both contain sectionOptionId
            }

            if (productSubscription) {
                const productSubscriptionCustomPropertyName = "ProductSubscription";
                cartLine.properties = {};
                cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
            }

            return this.addLine(cartLine, toCurrentCart, showAddToCartPopup);
        }

        addLineCollection(cartLines: any, toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineCollectionModel> {
            const cartLineCollection = { cartLines: cartLines } as CartLineCollectionModel;

            cartLineCollection.cartLines.forEach((line) => {
                const parsedQty = parseFloat(line.qtyOrdered.toString());
                line.qtyOrdered = parsedQty > 0 ? parsedQty : 1;
            });

            const postUrl = toCurrentCart ? this.currentCartLinesUri : this.cartLinesUri;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: `${postUrl}/batch`, data: cartLineCollection, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartLineCollectionModel>) => { this.addLineCollectionCompleted(response, showAddToCartPopup); },
                this.addLineCollectionFailed);
        }

        protected addLineCollectionCompleted(response: ng.IHttpPromiseCallbackArg<CartLineCollectionModel>, showAddToCartPopup?: boolean): void {
            const cartLineCollection = response.data;
            const isQtyAdjusted = cartLineCollection.cartLines.some((line) => {
                return line.isQtyAdjusted;
            });

            this.addToCartPopupService.display({ isAddAll: true, isQtyAdjusted: isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });

            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected addLineCollectionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.showCartError(error.data);
        }

        addLineCollectionFromProducts(products: ProductDto[], toCurrentCart = false, showAddToCartPopup?: boolean): ng.IPromise<CartLineCollectionModel> {
            const cartLineCollection: CartLineModel[] = [];
            angular.forEach(products, product => {
                cartLineCollection.push({
                    productId: product.id,
                    qtyOrdered: product.qtyOrdered,
                    unitOfMeasure: product.selectedUnitOfMeasure
                } as CartLineModel);
            });
            return this.addLineCollection(cartLineCollection, toCurrentCart, showAddToCartPopup);
        }

        addWishListToCart(wishListId: string, showAddToCartPopup?: boolean, data?: IAddWishListToCartData): ng.IPromise<CartLineCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "POST", url: `${this.currentCartLinesUri}/wishlist/${wishListId}`, data: data, bypassErrorInterceptor: true }),
                (response: ng.IHttpPromiseCallbackArg<CartLineCollectionModel>) => { this.addWishListToCartCompleted(response, showAddToCartPopup); },
                this.addWishListToCartFailed);
        }

        protected addWishListToCartCompleted(response: ng.IHttpPromiseCallbackArg<CartLineCollectionModel>, showAddToCartPopup?: boolean): void {
            const cartLineCollection = response.data;
            const isQtyAdjusted = cartLineCollection.cartLines.some((line) => {
                return line.isQtyAdjusted;
            });

            this.addToCartPopupService.display({ isAddAll: true, notAllAdded: cartLineCollection.notAllAddedToCart, isQtyAdjusted: isQtyAdjusted, showAddToCartPopup: showAddToCartPopup });

            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected addWishListToCartFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
            this.showCartError(error.data);
        }

        updateLine(cartLine: CartLineModel, refresh: boolean): ng.IPromise<CartLineModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: cartLine.uri, data: cartLine }),
                (response: ng.IHttpPromiseCallbackArg<CartLineModel>) => { this.updateLineCompleted(response, refresh); },
                this.updateLineFailed);
        }

        protected updateLineCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>, refresh: boolean): void {
            if (refresh) {
                this.getCart();
                this.$rootScope.$broadcast("cartChanged");
            }
        }

        protected updateLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        removeLine(cartLine: CartLineModel): ng.IPromise<CartLineModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.delete(cartLine.uri),
                this.removeLineCompleted,
                this.removeLineFailed
            );
        }

        protected removeLineCompleted(response: ng.IHttpPromiseCallbackArg<CartLineModel>): void {
            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected removeLineFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        removeLineCollection(cart: CartModel): ng.IPromise<CartModel> {
            const uri = `${cart.uri}/cartlines`;

            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.delete(uri),
                this.removeLineCollectionCompleted,
                this.removeLineCollectionFailed
            );
        }

        protected removeLineCollectionCompleted(response: ng.IHttpPromiseCallbackArg<CartModel>): void {
            this.getCart();
            this.$rootScope.$broadcast("cartChanged");
        }

        protected removeLineCollectionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getRealTimeInventory(cart: CartModel): ng.IPromise<RealTimeInventoryModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(this.realTimeInventoryUri, this.getRealTimeInventoryParams(cart.cartLines)),
                (response: ng.IHttpPromiseCallbackArg<RealTimeInventoryModel>) => { this.getRealTimeInventoryCompleted(response, cart); },
                this.getProductRealTimeInventoryFailed
            );
        }

        protected getRealTimeInventoryParams(cartLines: CartLineModel[]): any {
            var productIds = new Array<System.Guid>();
            cartLines.forEach((cartLine) => {
                if (productIds.indexOf(cartLine.productId) === -1) {
                    productIds.push(cartLine.productId);
                }
            });
            return {
                productIds: productIds
            };
        }

        protected getRealTimeInventoryCompleted(response: ng.IHttpPromiseCallbackArg<RealTimeInventoryModel>, cart: CartModel): void {
            cart.cartLines.forEach((cartLine: CartLineModel) => {
                const productInventory = response.data.realTimeInventoryResults.find((productInventory: ProductInventoryDto) => productInventory.productId === cartLine.productId);
                if (productInventory) {
                    cartLine.qtyOnHand = productInventory.qtyOnHand;
                    var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(o => o.unitOfMeasure === cartLine.unitOfMeasure);
                    if (inventoryAvailability) {
                        cartLine.availability = inventoryAvailability.availability;
                        if (!cart.hasInsufficientInventory && !cartLine.canBackOrder && !cartLine.quoteRequired && (inventoryAvailability.availability as any).messageType == 2) {
                            cart.hasInsufficientInventory = true;
                        }
                    } else {
                        cartLine.availability = { messageType: 0 };
                    }
                } else {
                    cartLine.availability = { messageType: 0 };
                }
            });
        }

        protected getProductRealTimeInventoryFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("cartService", CartService);
}