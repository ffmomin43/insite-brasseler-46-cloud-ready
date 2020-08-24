import CartSettingsModel = Insite.Cart.WebApi.V1.ApiModels.CartSettingsModel;

module insite.cart {
    "use strict";

    export class CartController {
        cart: CartModel;
        cartIdParam: string;
        promotions: PromotionModel[];
        settings: CartSettingsModel;
        showInventoryAvailability = false;
        productsCannotBePurchased = false;
        requiresRealTimeInventory = false;
        failedToGetRealTimeInventory = false;
        canAddAllToList = false;
        requisitionSubmitting = false;
        enableWarehousePickup = false;
        fulfillmentMethod: string;
        pickUpWarehouse: WarehouseModel;
        session: SessionModel;

        static $inject = ["$scope", "cartService", "promotionService", "settingsService", "coreService", "$localStorage", "addToWishlistPopupService", "spinnerService", "sessionService"];

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
        }

        $onInit(): void {
            this.initEvents();
            this.cartService.cartLoadCalled = true; // prevents request race
        }

        protected initEvents(): void {
            this.$scope.$on("cartChanged", (event: ng.IAngularEvent) => this.onCartChanged(event));

            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.$scope.$on("sessionUpdated", (event: ng.IAngularEvent, session: SessionModel) => {
                this.onSessionUpdated(session);
            });
        }

        protected onCartChanged(event: ng.IAngularEvent): void {
            this.getCart();
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.cartSettings;
            this.showInventoryAvailability = settingsCollection.productSettings.showInventoryAvailability;
            this.requiresRealTimeInventory = settingsCollection.productSettings.realTimeInventory;
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            this.getCart();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.fulfillmentMethod = session.fulfillmentMethod;
            this.pickUpWarehouse = session.pickUpWarehouse;
        }

        protected getSessionFailed(error: any): void {
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.fulfillmentMethod = session.fulfillmentMethod;
            this.pickUpWarehouse = session.pickUpWarehouse;
            this.getCart();
        }

        protected getCart(): void {
            this.cartService.expand = "cartlines,costcodes,hiddenproducts";
            if (this.settings.showTaxAndShipping) {
                this.cartService.expand += ",shipping,tax";
                this.cartService.allowInvalidAddress = true;
            }
            const hasRestrictedProducts = this.$localStorage.get("hasRestrictedProducts");
            if (hasRestrictedProducts === true.toString()) {
                this.cartService.expand += ",restrictions";
            }
            this.spinnerService.show();
            this.cartService.getCart().then(
                (cart: CartModel) => { this.getCartCompleted(cart); },
                (error: any) => { this.getCartFailed(error); });
        }

        protected getCartCompleted(cart: CartModel): void {
            this.cartService.expand = "";
            this.failedToGetRealTimeInventory = cart.failedToGetRealTimeInventory;
            this.cartService.allowInvalidAddress = false;
            if (!cart.cartLines.some(o => o.isRestricted || !o.isActive)) {
                this.$localStorage.remove("hasRestrictedProducts");
                this.productsCannotBePurchased = false;
            } else {
                this.productsCannotBePurchased = true;
            }
            this.displayCart(cart);
            this.cartIdParam = this.cart.id === "current" ? "" : `?cartId=${this.cart.id}`;
        }

        protected getCartFailed(error: any): void {
            this.cartService.expand = "";
            this.cartService.allowInvalidAddress = false;
        }

        displayCart(cart: CartModel): void {
            this.cart = cart;
            this.canAddAllToList = this.cart.cartLines.every(l => l.canAddToWishlist);
            this.promotionService.getCartPromotions(this.cart.id).then(
                (promotionCollection: PromotionCollectionModel) => { this.getCartPromotionsCompleted(promotionCollection); },
                (error: any) => { this.getCartPromotionsFailed(error); });
        }

        protected getCartPromotionsCompleted(promotionCollection: PromotionCollectionModel): void {
            this.promotions = promotionCollection.promotions;
        }

        protected getCartPromotionsFailed(error: any): void {
        }

        emptyCart(emptySuccessUri: string): void {
            this.cartService.removeLineCollection(this.cart).then(
                () => { this.emptyCartCompleted(); },
                (error: any) => { this.emptyCartFailed(error); });
        }

        protected emptyCartCompleted(): void {
        }

        protected emptyCartFailed(error: any): void {
        }

        saveCart(saveSuccessUri: string, signInUri: string): void {
            if (!this.cart.isAuthenticated || this.cart.isGuestOrder) {
                this.coreService.redirectToPath(`${signInUri}?returnUrl=${this.coreService.getCurrentPath()}`);
                return;
            }
            this.cartService.saveCart(this.cart).then(
                (cart: CartModel) => this.saveCartCompleted(saveSuccessUri, cart),
                (error: any) => { this.saveCartFailed(error); });
        }

        protected saveCartCompleted(saveSuccessUri: string, cart: CartModel): void {
            this.cartService.getCart();
            if (cart.id !== "current") {
                this.coreService.redirectToPath(`${saveSuccessUri}?cartid=${cart.id}`);
            }
        }

        protected saveCartFailed(error: any): void {
        }

        addAllToList(): void {
            let products = [];
            for (let i = 0; i < this.cart.cartLines.length; i++) {
                const cartLine = this.cart.cartLines[i];
                if (!cartLine.canAddToWishlist) {
                    continue;
                }
                const product = <ProductDto>{
                    id: cartLine.productId,
                    qtyOrdered: cartLine.qtyOrdered,
                    selectedUnitOfMeasure: cartLine.unitOfMeasure
                };
                products.push(product);
            }

            this.addToWishlistPopupService.display(products);
        }

        submitRequisition(submitRequisitionSuccessUri: string): void {
            if (this.requisitionSubmitting) {
                return;
            }

            this.requisitionSubmitting = true;
            this.cart.status = "RequisitionSubmitted";
            this.cartService.submitRequisition(this.cart).then(
                (cart: CartModel) => this.submitRequisitionCompleted(submitRequisitionSuccessUri, cart),
                (error: any) => { this.submitRequisitionFailed(error); });
        }

        protected submitRequisitionCompleted(submitRequisitionSuccessUri: string, cart: CartModel): void {
            this.cartService.getCart();
            this.coreService.redirectToPath(submitRequisitionSuccessUri);
            this.requisitionSubmitting = false;
        }

        protected submitRequisitionFailed(error: any): void {
            this.requisitionSubmitting = false;
        }

        continueShopping($event): void {
            const referrer = this.coreService.getReferringPath();
            if (typeof(referrer) !== "undefined" && referrer !== null) {
                $event.preventDefault();
                this.coreService.redirectToPath(referrer);
            }
        }
    }

    angular
        .module("insite")
        .controller("CartController", CartController);
}