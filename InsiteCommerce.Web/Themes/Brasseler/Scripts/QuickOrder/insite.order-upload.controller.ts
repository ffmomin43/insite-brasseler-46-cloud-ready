module insite.quickorder {
    "use strict";
    import BaseUploadController = common.BaseUploadController;
    import UploadError = common.UploadError;

    export class OrderUploadController extends BaseUploadController {
        settings: ProductSettingsModel;

        static $inject = [
            "$scope",
            "productService",
            "cartService",
            "coreService",
            "settingsService",
            "sessionService"];

        constructor(
            protected $scope: ng.IScope,
            protected productService: catalog.IProductService,
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected sessionService: account.ISessionService) {
            super($scope, productService, coreService, settingsService);
        }

        $onInit() {
            super.$onInit();

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.productSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        uploadProducts(popupSelector?: string): void {
            super.uploadProducts(popupSelector);

            this.cartService.addLineCollectionFromProducts(this.products, true, false).then(
                (cartLineCollection: CartLineCollectionModel) => { this.uploadingCompleted(cartLineCollection); },
                (error: any) => { this.uploadingFailed(error); });
        }

        protected addProductToList(product: ProductDto, item: any, index: any): void {
            const baseUnitOfMeasure = this.getBaseUnitOfMeasure(product);
            const currentUnitOfMeasure = this.getCurrentUnitOfMeasure(product);

            if (product.trackInventory && !product.canBackOrder && !product.quoteRequired && baseUnitOfMeasure && currentUnitOfMeasure &&
                product.qtyOrdered * baseUnitOfMeasure.qtyPerBaseUnitOfMeasure > product.qtyOnHand * currentUnitOfMeasure.qtyPerBaseUnitOfMeasure) {
                const errorProduct = this.mapProductErrorInfo(index, UploadError.NotEnough, item.Name, product);
                errorProduct.conversionRequested = currentUnitOfMeasure.qtyPerBaseUnitOfMeasure;
                errorProduct.conversionOnHands = baseUnitOfMeasure.qtyPerBaseUnitOfMeasure;
                errorProduct.umOnHands = baseUnitOfMeasure.unitOfMeasureDisplay;
                this.errorProducts.push(errorProduct);
            }

            this.products.push(product);
        }

        protected showUploadingPopup() {
            this.coreService.displayModal(angular.element("#orderUploadingPopup"));
        }

        protected hideUploadingPopup() {
            this.coreService.closeModal("#orderUploadingPopup");
        }

        protected showUploadSuccessPopup() {
            const $popup = angular.element("#orderUploadSuccessPopup");
            if ($popup.length > 0) {
                this.coreService.displayModal($popup);
            }
        }

        protected hideUploadSuccessPopup() {
            this.coreService.closeModal("#orderUploadSuccessPopup");
        }

        protected showUploadingIssuesPopup() {
            this.coreService.displayModal(angular.element("#orderUploadingIssuesPopup"));
        }

        protected hideUploadingIssuesPopup() {
            this.cleanupUploadData();
            this.coreService.closeModal("#orderUploadingIssuesPopup");
        }

        protected batchGetCompleted(products: ProductDto[]): void {
            if (this.uploadCancelled) {
                return;
            }

            let currentContext = this.sessionService.getContext();

            if (this.settings.realTimeInventory && products.some(o => o != null)
                && ((!this.settings.allowBackOrderForDelivery && currentContext.fulfillmentMethod === "Ship") 
                    || (!this.settings.allowBackOrderForPickup && currentContext.fulfillmentMethod === "PickUp"))) {
                this.productService.getProductRealTimeInventory(products.filter(o => o != null)).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory, products),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            } else {
                this.processProducts(products);
                this.checkCompletion();
            }
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel, products: ProductDto[]): void {
            this.processProducts(products);
            this.checkCompletion();
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("OrderUploadController", OrderUploadController);
}