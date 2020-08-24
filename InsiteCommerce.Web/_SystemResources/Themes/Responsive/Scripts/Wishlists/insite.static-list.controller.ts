module insite.wishlist {
    "use strict";

    export class StaticListController {
        listId: string;
        myListDetailUrl: string;
        listModel: WishListModel;
        productSettings: ProductSettingsModel;
        failedToGetRealTimeInventory = false;
        inProgress = false;
        errorMessage: string;
        saveListForm: any;
        saveInProgress: boolean;
        isAuthenticated: boolean;
        listName: string;

        static $inject = [
            "$scope",
            "settingsService",
            "queryString",
            "wishListService",
            "cartService",
            "coreService",
            "spinnerService",
            "productService",
            "addToWishlistPopupService",
            "sessionService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected wishListService: IWishListService,
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected productService: catalog.IProductService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected sessionService: account.ISessionService) {
        }

        $onInit(): void {
            this.listId = this.queryString.get("id");
            this.updateBreadcrumbs();
            this.initListPopupEvents();

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("sessionUpdated", (event: ng.IAngularEvent, session: SessionModel) => {
                this.onSessionUpdated(session);
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.getList();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.getList();
        }

        updateBreadcrumbs(): void {
            this.$scope.$watch(() => this.listModel && this.listModel.name, (newValue) => {
                if (newValue) {
                    angular.element(".breadcrumbs > .current").text(newValue);
                }
            }, true);
        }

        protected closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        getList(): void {
            this.spinnerService.show();
            this.wishListService.getListById(this.listId, "staticlist,getalllines").then(
                (list: WishListModel) => { this.getListCompleted(list); },
                (error: any) => { this.getListFailed(error); });
        }

        protected getListCompleted(list: WishListModel): void {
            this.spinnerService.hide();
            this.listModel = list;

            this.getRealTimePrices();
            if (!this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected getListFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected getRealTimePrices(): void {
            if (this.productSettings.realTimePricing && this.listModel.wishListLineCollection != null) {
                const products = this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection);

                this.productService.getProductRealTimePrices(products).then(
                    (pricingResult: RealTimePricingModel) => { this.handleRealTimePricesCompleted(pricingResult); },
                    (reason: any) => { this.handleRealtimePricesFailed(reason); });
            }
        }

        protected handleRealTimePricesCompleted(result: RealTimePricingModel): void {
            result.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const wishlistLine = this.listModel.wishListLineCollection.find((p: WishListLineModel) => p.productId === productPrice.productId);
                wishlistLine.pricing = productPrice;
            });

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected handleRealtimePricesFailed(reason: any): void {
            this.listModel.wishListLineCollection.forEach(p => {
                if (p.pricing) {
                    (p.pricing as any).failedToGetRealTimePrices = true;
                }
            });

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.failedToGetRealTimeInventory = true;
            }
        }

        protected getRealTimeInventory(): void {
            if (this.productSettings.realTimeInventory && this.listModel.wishListLineCollection != null) {
                const products = this.listModel.wishListLineCollection.map(wishlistLine => this.wishListService.mapWishlistLineToProduct(wishlistLine));

                this.productService.getProductRealTimeInventory(products).then(
                    (inventoryResult: RealTimeInventoryModel) => { this.handleRealTimeInventoryCompleted(inventoryResult); },
                    (reason: any) => { this.handleRealtimeInventoryFailed(reason); });
            }
        }

        protected handleRealTimeInventoryCompleted(result: RealTimeInventoryModel): void {
            this.wishListService.applyRealTimeInventoryResult(this.listModel, result);
        }

        protected handleRealtimeInventoryFailed(reason: any): void {
            this.failedToGetRealTimeInventory = true;
        }

        changeUnitOfMeasure(line: WishListLineModel): void {
            const product = this.wishListService.mapWishlistLineToProduct(line);
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(line, productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(line: WishListLineModel, productDto: ProductDto): void {
            line = this.wishListService.mapProductToWishlistLine(productDto, line);
            if (!productDto.quoteRequired) {
                line.pricing = productDto.pricing;
            }

            this.wishListService.updateAvailability(line);
        }

        protected changeUnitOfMeasureFailed(error: any): void {
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

        openWishListPopup(line: WishListLineModel): void {
            const product = <ProductDto>{
                id: line.productId,
                qtyOrdered: line.qtyOrdered,
                selectedUnitOfMeasure: line.unitOfMeasure
            };

            this.addToWishlistPopupService.display([product]);
        }

        allQtysIsValid(): boolean {
            if (!this.listModel || !this.listModel.wishListLineCollection) {
                return false;
            }

            return this.listModel.wishListLineCollection.every((wishListLine: WishListLineModel) => {
                return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
            });
        }

        addAllToCart(wishList: WishListModel): void {
            this.inProgress = true;
            this.cartService.addLineCollection(wishList.wishListLineCollection, true).then(
                (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                (error: any) => { this.addLineCollectionFailed(error); });
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
            this.inProgress = false;
        }

        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
        }

        protected initListPopupEvents(): void {
            const popup = angular.element("#popup-save-list");

            popup.on("closed", () => {
                this.clearMessages();
                this.listName = "";
                if (this.saveListForm) {
                    this.saveListForm.$setPristine();
                    this.saveListForm.$setUntouched();
                }
                this.$scope.$apply();
            });
        }

        protected clearMessages(): void {
            this.errorMessage = "";
            this.saveInProgress = false;
        }

        openSaveListModal(): void {
            this.spinnerService.show();
            this.sessionService.getSession().then((session: SessionModel) => {
                this.spinnerService.hide();
                this.isAuthenticated = session.isAuthenticated;
                this.coreService.displayModal("#popup-save-list");
            });
        }

        saveList(): void {
            this.clearMessages();
            if (!this.saveListForm.$valid) {
                return;
            }

            this.disableSaveForm();
            this.wishListService.addWishList(this.listName).then(
                (list: WishListModel) => { this.addListCompleted(list); },
                (error: any) => { this.addListFailed(error); });
        }

        protected addListCompleted(list: WishListModel): void {
            this.addProductsToList(list);
        }

        protected addListFailed(error: any): void {
            this.errorMessage = error.message;
            this.enableSaveForm();
        }

        protected addProductsToList(list: WishListModel): void {
            if (this.listModel.wishListLinesCount === 1) {
                this.addLineToList(list);
            } else {
                this.addLineCollectionToList(list);
            }
        }

        protected addLineToList(list: WishListModel): void {
            this.wishListService.addWishListLine(list, this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection)[0]).then(
                (listLine: WishListLineModel) => { this.addListLineCompleted(list, listLine); },
                (error: any) => { this.addListLineFailed(error); });
        }

        protected addListLineCompleted(list: WishListModel, listLine: WishListLineModel): void {
            this.redirectToWishListPage(list);
        }

        protected addListLineFailed(error: any): void {
            this.errorMessage = error.message;
            this.enableSaveForm();
        }

        protected addLineCollectionToList(list: WishListModel): void {
            this.wishListService.addWishListLines(list, this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection)).then(
                (listLineCollection: WishListLineCollectionModel) => { this.addListLineCollectionCompleted(list, listLineCollection); },
                (error: any) => { this.addListLineCollectionFailed(error); });
        }

        protected addListLineCollectionCompleted(list: WishListModel, listLineCollection: WishListLineCollectionModel): void {
            this.redirectToWishListPage(list);
        }

        protected addListLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
            this.enableSaveForm();
        }

        protected disableSaveForm(): void {
            this.saveInProgress = true;
            this.spinnerService.show();
        }

        protected enableSaveForm(): void {
            this.saveInProgress = false;
            this.spinnerService.hide();
        }

        protected redirectToWishListPage(list: WishListModel): void {
            this.coreService.closeModal("#popup-save-list");
            this.coreService.redirectToPath(this.myListDetailUrl + "?id=" + list.id);
        }
    }

    angular
        .module("insite")
        .controller("StaticListController", StaticListController);
}