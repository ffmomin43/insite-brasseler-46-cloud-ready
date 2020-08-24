module insite.quickorder {
    "use strict";

    export class QuickOrderController {
        product: ProductDto;
        alternateUnitsOfMeasure: boolean;
        canAddToCart: boolean;
        errorMessage: string;
        searchTerm: string;
        selectedUnitOfMeasure: string;
        selectedQty: number;
        productSettings: Insite.Catalog.WebApi.V1.ApiModels.ProductSettingsModel;
        orderSettings: Insite.Order.WebApi.V1.ApiModels.OrderSettingsModel;
        autocompleteOptions: AutoCompleteOptions;
        findingProduct: boolean;
        addingToCart = false;
        alternateUnitsOfMeasureFromSettings: boolean;

        static $inject = ["cartService", "productService", "searchService", "settingsService", "$q", "$scope", "selectVariantProductPopupService"];

        constructor(
            protected cartService: cart.ICartService,
            protected productService: catalog.IProductService,
            protected searchService: catalog.ISearchService,
            protected settingsService: core.ISettingsService,
            protected $q: ng.IQService,
            protected $scope: ng.IScope,
            protected selectVariantProductPopupService: SelectVariantProductPopupService) {
        }

        $onInit(): void {
            this.product = null;
            this.alternateUnitsOfMeasure = true;
            this.canAddToCart = true;
            this.findingProduct = false;
            this.selectedUnitOfMeasure = "EA";
            this.selectedQty = 1;

            this.getSettings();

            this.initializeAutocomplete();
            this.$scope.$on("addProductToQuickOrderForm", (event, product: ProductDto) => {
                this.searchTerm = product.shortDescription;
                this.addProduct(product.erpNumber);
            });
        }

        protected initializeAutocomplete(): void {
            this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(() => this.searchTerm);

            this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(() => this.searchTerm, "tst_quickOrderWidget_autocomplete");

            this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
        }

        protected onAutocompleteOptionsSelect(): (event: kendo.ui.AutoCompleteSelectEvent) => void {
            return (event: kendo.ui.AutoCompleteSelectEvent) => {
                const dataItem = event.sender.dataItem(event.item.index());
                this.addProduct(dataItem.erpNumber);
            };
        }

        protected getSettings(): void {
            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settings: core.SettingsCollection): void {
            this.productSettings = settings.productSettings;
            this.orderSettings = settings.orderSettings;
            this.alternateUnitsOfMeasureFromSettings = settings.productSettings.alternateUnitsOfMeasure;
        }

        protected getSettingsFailed(error: any): void {
        }

        protected addProduct(erpNumber: string): void {
            if (!erpNumber || erpNumber.length === 0) {
                return;
            }

            this.findProduct(erpNumber).then(
                (productCollection: ProductCollectionModel) => { this.addProductCompleted(productCollection); },
                (error: any) => { this.addProductFailed(error); });
        }

        protected addProductCompleted(productCollection: ProductCollectionModel): void {
            this.findingProduct = false;

            this.getRealTimeInventory(productCollection.products[0]).then(() => {
                this.validateAndSetProduct(productCollection);
            });
        }

        protected addProductFailed(error: any): void {
            this.findingProduct = false;
            this.errorMessage = angular.element("#messageNotFound").val();
        }

        protected getRealTimeInventory(product: ProductDto): ng.IPromise<void> {
            const deferred = this.$q.defer<void>();

            if (this.productSettings.realTimeInventory) {
                this.productService.getProductRealTimeInventory([product]).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory, deferred),
                    (error: any) => this.getProductRealTimeInventoryFailed(error, deferred));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel, deferred: ng.IDeferred<void>): void {
            deferred.resolve();
        }

        protected getProductRealTimeInventoryFailed(error: any, deferred: ng.IDeferred<void>): void {
            deferred.resolve();
        }

        protected validateAndSetProduct(productCollection: ProductCollectionModel): boolean {
            const product = productCollection.products[0];

            if (this.validateProduct(product)) {
                product.qtyOrdered = Math.max(this.selectedQty || 1, product.minimumOrderQty || 1);
                this.selectedQty = product.qtyOrdered;
                this.product = product;
                this.errorMessage = "";
                return true;
            } else {
                return false;
            }
        }

        protected findProduct(erpNumber: string): ng.IPromise<ProductCollectionModel> {
            this.findingProduct = true;
            const parameters: catalog.IProductCollectionParameters = { extendedNames: [erpNumber] };
            const expand = ["pricing", "brand", "styledproducts"];

            return this.productService.getProducts(parameters, expand);
        }

        protected validateProduct(product: ProductDto): boolean {
            if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                this.errorMessage = angular.element("#messageConfigurableProduct").val();
                return false;
            }
            if (product.isStyleProductParent) {
                this.selectVariantProductPopupService.display(product);
                return false;
            }
            if (!product.canAddToCart) {
                this.errorMessage = angular.element("#messageUnavailable").val();
                return false;
            }
            return true;
        }

        onEnterKeyPressedInAutocomplete(): void {
            const autocomplete = $("#qo-search-widget").data("kendoAutoComplete") as any;
            if (autocomplete._last === kendo.keys.ENTER) {
                if (!autocomplete.list.is(":visible") && this.selectedQty && !this.findingProduct && !this.addingToCart && this.product) {
                    this.addToCart(this.product);
                } else if (autocomplete.listView.selectedDataItems().length === 0) {
                    this.addProduct(this.searchTerm);
                }
            }
        }

        changeUnitOfMeasure(product: ProductDto): void {
            if (!product.productUnitOfMeasures) {
                return;
            }
            // this calls to get a new price and updates the product which updates the ui
            product.selectedUnitOfMeasure = this.selectedUnitOfMeasure;

            this.productService.changeUnitOfMeasure(product).then(
                (productResult: ProductDto) => { this.changeUnitOfMeasureCompleted(productResult); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            if (!product) {
                if (!this.searchTerm) {
                    this.errorMessage = angular.element("#messageEnterProduct").val();
                    this.addingToCart = false;
                    return;
                }

                // get the product and add it all at once
                this.findProduct(this.searchTerm).then(
                    (productCollection: ProductCollectionModel) => { this.addToCartCompleted(productCollection); },
                    (error: any) => { this.addToCartFailed(error); });
            } else {
                this.product.qtyOrdered = this.selectedQty;
                this.addToCartAndClearInput(this.product);
            }
        }

        protected addToCartCompleted(productCollection: ProductCollectionModel): void {
            this.findingProduct = false;
            this.addingToCart = false;

            this.getRealTimeInventory(productCollection.products[0]).then(() => {
                if (this.validateAndSetProduct(productCollection)) {
                    this.product.qtyOrdered = this.selectedQty;
                    this.addToCartAndClearInput(this.product);
                }
            });
        }

        protected addToCartFailed(error: any): void {
            this.findingProduct = false;
            this.addingToCart = false;

            this.errorMessage = angular.element("#messageNotFound").val();
        }

        protected addToCartAndClearInput(product: ProductDto): void {
            if (product.qtyOrdered === 0) {
                product.qtyOrdered = product.minimumOrderQty || 1;
            }

            this.addLineFromProduct(product, null, null, true);
        }

        protected addLineFromProduct(product: ProductDto, configuration?: ConfigSectionOptionDto[], productSubscription?: ProductSubscriptionDto, toCurrentCart?: boolean): void {
            this.cartService.addLineFromProduct(product, configuration, productSubscription, toCurrentCart).then(
                (cartLine: CartLineModel) => { this.addLineFromProductCompleted(cartLine); },
                (error: any) => { this.addLineFromProductFailed(error); });
        }

        protected addLineFromProductCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
            this.searchTerm = "";
            this.selectedUnitOfMeasure = "EA";
            this.product = null;
            this.selectedQty = 1;
        }

        protected addLineFromProductFailed(error: any): void {
            this.addingToCart = false;
        }
    }

    angular
        .module("insite")
        .controller("QuickOrderController", QuickOrderController);
}