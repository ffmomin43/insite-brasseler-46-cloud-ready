module insite.cart {
    "use strict";

    import ProductDto = Insite.Catalog.Services.Dtos.ProductDto;

    export class CartLinesController {
        openLineNoteId = "";
        isUpdateInProgress = false;
        productSettings: ProductSettingsModel;

        static $inject = ["$scope", "cartService", "productSubscriptionPopupService", "addToWishlistPopupService", "spinnerService", "settingsService"];

        constructor(
            protected $scope: ICartScope,
            protected cartService: ICartService,
            protected productSubscriptionPopupService: catalog.ProductSubscriptionPopupService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected spinnerService: core.ISpinnerService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.$scope.$on("cartLoaded", (event: ng.IAngularEvent, cart: CartModel) => this.onCartLoaded(event, cart));

            this.$scope.$on("updateProductSubscription", (event: ng.IAngularEvent, productSubscription: ProductSubscriptionDto, product: ProductDto, cartLine: CartLineModel) =>
                this.onUpdateProductSubscription(event, productSubscription, product, cartLine));

            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onCartLoaded(event: ng.IAngularEvent, cart: CartModel): void {
            this.isUpdateInProgress = false;
        }

        protected onUpdateProductSubscription(event: ng.IAngularEvent, productSubscription: ProductSubscriptionDto, product: ProductDto, cartLine: CartLineModel): void {
            const productSubscriptionCustomPropertyName = "ProductSubscription";
            cartLine.properties[productSubscriptionCustomPropertyName] = JSON.stringify(productSubscription);
            this.updateLine(cartLine, true);
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
        }

        protected updateLineCompleted(cartLine: CartLineModel): void {
        }

        protected updateLineFailed(error: any): void {
        }

        removeLine(cartLine: CartLineModel): void {
            this.spinnerService.show();
            this.cartService.removeLine(cartLine).then(
                () => { this.removeLineCompleted(cartLine); }, // the cartLine returned from the call will be null if successful, instead, send in the cartLine that was removed
                (error: any) => { this.removeLineFailed(error); });
        }

        protected removeLineCompleted(cartLine: CartLineModel): void {
        }

        protected removeLineFailed(error: any): void {
        }

        quantityKeyPress(keyEvent: KeyboardEvent, cartLine: CartLineModel): void {
            if (keyEvent.which === 13) {
                (keyEvent.target as any).blur();
            }
        }

        notesKeyPress(keyEvent: KeyboardEvent, cartLine: CartLineModel): void {
            if (keyEvent.which === 13) {
                this.updateLine(cartLine, false);
            }
        }

        notePanelClicked(lineId: string): void {
            if (this.openLineNoteId === lineId) {
                this.openLineNoteId = "";
            } else {
                this.openLineNoteId = lineId;
            }
        }

        getSumQtyPerUom(productId: System.Guid, cartLines: CartLineModel[]): number {
            return cartLines.reduce((sum, current) => {
                return current.productId === productId
                    ? sum + current.qtyPerBaseUnitOfMeasure * current.qtyOrdered
                    : sum;
            }, 0);
        }

        openProductSubscriptionPopup(cartLine: CartLineModel): void {
            this.productSubscriptionPopupService.display({ product: null, cartLine: cartLine, productSubscription: null });
        }

        openWishListPopup(cartLine: CartLineModel): void {
            const product = <ProductDto>{
                id: cartLine.productId,
                qtyOrdered: cartLine.qtyOrdered,
                selectedUnitOfMeasure: cartLine.unitOfMeasure
            };

            this.addToWishlistPopupService.display([product]);
        }

        isOutOfStockLine(inventoryCheck: boolean, cartLine: CartLineModel): boolean {
            return inventoryCheck && (cartLine.availability as any).messageType === 2 && !cartLine.canBackOrder;
        }
    }

    angular
        .module("insite")
        .controller("CartLinesController", CartLinesController);
}