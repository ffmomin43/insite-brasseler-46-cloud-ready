module insite.wishlist {
    "use strict";

    export class WishListController {
        wishListCount: number;
        wishListCollection: WishListModel[] = [];
        selectedWishList: WishListModel;
        paginationStorageKey = "DefaultPagination-WishList";
        productSettings: ProductSettingsModel;
        wishListSettings: WishListSettingsModel;
        hasAnyWishListsLine: boolean;
        inProgress = false;
        failedToGetRealTimeInventory = false;

        static $inject = ["$scope", "coreService", "wishListService", "productService", "cartService", "paginationService", "settingsService", "queryString"];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected wishListService: IWishListService,
            protected productService: catalog.IProductService,
            protected cartService: cart.ICartService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            this.getWishLists();

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.wishListSettings = settingsCollection.wishListSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        mapData(data: any): void {
            this.wishListCount = data.wishListCollection.length;
            this.hasAnyWishListsLine = data.wishListCollection.some(e => e.hasAnyLines);
            if (this.wishListCount > 0) {
                this.wishListCollection = data.wishListCollection;

                const wishListId = this.queryString.get("wishListId") || this.queryString.get("id");

                if (wishListId.length > 0) {
                    this.selectedWishList = this.wishListCollection.filter(x => x.id.toLowerCase() === wishListId.toLowerCase())[0];
                } else {
                    this.selectedWishList = this.wishListCollection[0];
                }

                this.getSelectedWishListDetails();
            }
        }

        getWishLists(): void {
            const pagination = { pageSize: 999 } as PaginationModel;
            this.wishListService.getWishLists(null, null, null, pagination).then(
                (wishListCollection: WishListCollectionModel) => { this.getWishListsCompleted(wishListCollection); },
                (error: any) => { this.getWishListsFailed(error); });
        }

        protected getWishListsCompleted(wishListCollection: WishListCollectionModel): void {
            this.mapData(wishListCollection);
        }

        protected getWishListsFailed(error: any): void {
        }

        getSelectedWishListDetails(): void {
            this.selectedWishList.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey, this.selectedWishList.pagination);

            this.wishListService.getWishList(this.selectedWishList).then(
                (wishList: WishListModel) => { this.getWishListCompleted(wishList); },
                (error: any) => { this.getWishListFailed(error); });
        }

        protected getWishListCompleted(wishList: WishListModel): void {
            this.selectedWishList = wishList;
            this.inProgress = false;

            this.getRealTimePrices();
            if (!this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected getWishListFailed(error: any): void {
        }

        protected getRealTimePrices(): void {
            if (this.productSettings.realTimePricing && this.selectedWishList.wishListLineCollection != null) {
                const products = this.selectedWishList.wishListLineCollection.map((wishlistLine) => {
                    return {
                        id: wishlistLine.productId,
                        unitOfMeasure: wishlistLine.unitOfMeasure,
                        selectedUnitOfMeasure: wishlistLine.unitOfMeasure,
                        qtyOrdered: wishlistLine.qtyOrdered
                    };
                }) as any as ProductDto[];

                this.productService.getProductRealTimePrices(products).then(
                    (pricingResult: RealTimePricingModel) => { this.handleRealTimePricesCompleted(pricingResult); },
                    (reason: any) => { this.handleRealtimePricesFailed(reason); });
            }
        }

        protected handleRealTimePricesCompleted(result: RealTimePricingModel): void {
            result.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const wishlistLine = this.selectedWishList.wishListLineCollection.find((p: WishListLineModel) => p.productId === productPrice.productId && p.unitOfMeasure === productPrice.unitOfMeasure);
                wishlistLine.pricing = productPrice;
            });

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected handleRealtimePricesFailed(reason: any): void {
            this.selectedWishList.wishListLineCollection.forEach(p => {
                if (p.pricing) {
                    (p.pricing as any).failedToGetRealTimePrices = true;
                }
            });

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.failedToGetRealTimeInventory = true;
            }
        }

        protected getRealTimeInventory(): void {
            if (this.productSettings.realTimeInventory && this.selectedWishList.wishListLineCollection != null) {
                const products = this.selectedWishList.wishListLineCollection.map(wishlistLine => this.mapWishlistLineToProduct(wishlistLine));

                this.productService.getProductRealTimeInventory(products).then(
                    (inventoryResult: RealTimeInventoryModel) => { this.handleRealTimeInventoryCompleted(inventoryResult); },
                    (reason: any) => { this.handleRealtimeInventoryFailed(reason); });
            }
        }

        protected handleRealTimeInventoryCompleted(result: RealTimeInventoryModel): void {
            this.selectedWishList.wishListLineCollection.forEach((line: WishListLineModel) => {
                const productInventory = result.realTimeInventoryResults.find((productInventory: ProductInventoryDto) => line.productId === productInventory.productId);
                if (productInventory) {
                    var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(o => o.unitOfMeasure === line.unitOfMeasure);
                    if (inventoryAvailability) {
                        line.availability = inventoryAvailability.availability;
                    } else {
                        line.availability = { messageType: 0 };
                    }

                    line.productUnitOfMeasures.forEach((productUnitOfMeasure: ProductUnitOfMeasureDto) => {
                        var inventoryAvailability = productInventory.inventoryAvailabilityDtos.find(o => o.unitOfMeasure === productUnitOfMeasure.unitOfMeasure);
                        if (inventoryAvailability) {
                            productUnitOfMeasure.availability = inventoryAvailability.availability;
                        } else {
                            productUnitOfMeasure.availability = { messageType: 0 };
                        }
                    });

                    this.updateAvailability(line);
                }
            });
        }

        protected handleRealtimeInventoryFailed(reason: any): void {
            this.failedToGetRealTimeInventory = true;
        }

        deleteWishList(): void {
            this.wishListService.deleteWishList(this.selectedWishList).then(
                (wishList: WishListModel) => { this.deleteWishListCompleted(wishList); },
                (error: any) => { this.deleteWishListFailed(error); });
        }

        protected deleteWishListCompleted(wishList: WishListModel): void {
            this.coreService.displayModal(angular.element("#popup-deletewishlist"));
            this.getWishLists();
        }

        protected deleteWishListFailed(error: any): void {
        }

        deleteLine(line: WishListLineModel): void {
            if (this.inProgress) {
                return;
            }

            this.inProgress = true;
            this.wishListService.deleteLine(line).then(
                (wishListLine: WishListLineModel) => { this.deleteLineCompleted(wishListLine); },
                (error: any) => { this.deleteLineFailed(error); });
        }

        protected deleteLineCompleted(wishListLine: WishListLineModel): void {
            this.getSelectedWishListDetails();
        }

        protected deleteLineFailed(error: any): void {
        }

        updateLine(line: WishListLineModel): void {
            if (line.qtyOrdered === 0) {
                this.deleteLine(line);
            } else {
                this.wishListService.updateLine(line).then(
                    (wishListLine: WishListLineModel) => { this.updateLineCompleted(wishListLine); },
                    (error: any) => { this.updateLineFailed(error); });
            }
        }

        protected updateLineCompleted(wishListLine: WishListLineModel): void {
            this.getSelectedWishListDetails();
        }

        protected updateLineFailed(error: any): void {
        }

        quantityKeyPress(line: WishListLineModel): void {
            this.updateLine(line);
        }

        addLineToCart(line: any): void {
            this.cartService.addLine(line, true).then(
                (cartLine: CartLineModel) => { this.addLineCompleted(cartLine); },
                (error: any) => { this.addLineFailed(error); });
        }

        protected addLineCompleted(cartLine: CartLineModel): void {
        }

        protected addLineFailed(error: any): void {
        }

        addAllToCart(): void {
            this.inProgress = true;
            this.cartService.addLineCollection(this.selectedWishList.wishListLineCollection, true).then(
                (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                (error: any) => { this.addLineCollectionFailed(error); });
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
            this.inProgress = false;
        }

        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
        }

        allQtysIsValid(): boolean {
            if (!this.selectedWishList || !this.selectedWishList.wishListLineCollection) {
                return false;
            }

            return this.selectedWishList.wishListLineCollection.every((wishListLine: WishListLineModel) => {
                return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
            });
        }

        changeUnitOfMeasure(line: WishListLineModel): void {
            const product = this.mapWishlistLineToProduct(line);
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(line, productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(line: WishListLineModel, productDto: ProductDto): void {
            line = this.mapProductToWishlistLine(productDto, line);
            if (!productDto.quoteRequired) {
                line.pricing = productDto.pricing;
            }

            this.updateLine(line);
            this.updateAvailability(line);
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        updateAvailability(line: WishListLineModel): void {
            if (line && line.productUnitOfMeasures && line.selectedUnitOfMeasure) {
                const productUnitOfMeasure = line.productUnitOfMeasures.find((uom) => uom.unitOfMeasure === line.selectedUnitOfMeasure);
                if (productUnitOfMeasure && (productUnitOfMeasure as any).availability) {
                    line.availability = (productUnitOfMeasure as any).availability;
                }
            }
        }

        protected mapProductToWishlistLine(product: ProductDto, line: WishListLineModel): WishListLineModel {
            line.productUnitOfMeasures = product.productUnitOfMeasures;
            line.unitOfMeasureDisplay = product.unitOfMeasureDisplay;
            line.unitOfMeasureDescription = product.unitOfMeasureDescription;
            line.unitOfMeasure = product.unitOfMeasure;
            line.canShowUnitOfMeasure = product.canShowUnitOfMeasure;
            line.selectedUnitOfMeasure = product.selectedUnitOfMeasure;
            return line;
        }

        protected mapWishlistLineToProduct(line: WishListLineModel): ProductDto {
            return {
                id: line.productId,
                productUnitOfMeasures: line.productUnitOfMeasures,
                unitOfMeasure: line.unitOfMeasure,
                selectedUnitOfMeasure: line.selectedUnitOfMeasure,
                quoteRequired: line.quoteRequired,
                pricing: line.pricing
            } as ProductDto;
        }
    }

    angular
        .module("insite")
        .controller("WishListController", WishListController);
}