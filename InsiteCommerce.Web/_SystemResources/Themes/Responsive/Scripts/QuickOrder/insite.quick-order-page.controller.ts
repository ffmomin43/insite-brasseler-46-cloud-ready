module insite.quickorder {
    "use strict";

    export class QuickOrderPageController {
        products: ProductDto[];
        searchTerm: string;
        errorMessage: string;
        settings: ProductSettingsModel;
        orderSettings: Insite.Order.WebApi.V1.ApiModels.OrderSettingsModel;
        autocompleteOptions: AutoCompleteOptions;
        canAddAllToList = false;
        alternateUnitsOfMeasureFromSettings: boolean;
        selectedUnitOfMeasure: string;
        product: ProductDto = { qtyOrdered: 1 } as ProductDto;

        static $inject = ["$scope", "$filter", "coreService", "cartService", "productService", "searchService", "settingsService", "addToWishlistPopupService", "selectVariantProductPopupService", "$q"];

        constructor(
            protected $scope: ng.IScope,
            protected $filter: ng.IFilterService,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService,
            protected productService: catalog.IProductService,
            protected searchService: catalog.ISearchService,
            protected settingsService: core.ISettingsService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected selectVariantProductPopupService: SelectVariantProductPopupService,
            protected $q: ng.IQService) {
        }

        $onInit(): void {
            this.products = [];
            this.getSettings();
            this.selectedUnitOfMeasure = "EA";

            this.initializeAutocomplete();
            this.initCanAddAllToList();
            this.$scope.$on("addProductToQuickOrderForm", (event, product: ProductDto) => {
                this.searchTerm = product.shortDescription;
                this.lookupAndAddProductById(product.id as string);
            });
        }

        initCanAddAllToList(): void {
            this.$scope.$watch(() => this.products, (newValue) => {
                this.canAddAllToList = this.products.every(l => l.canAddToWishlist);
            }, true);
        }

        addAllToList(): void {
            let products = [];
            for (let i = this.products.length - 1; i >= 0; i--) {
                if (!this.products[i].canAddToWishlist) {
                    continue;
                }
                products.push(this.products[i]);
            }

            this.addToWishlistPopupService.display(products);
        }

        protected initializeAutocomplete(): void {
            this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(() => this.searchTerm);

            this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(() => this.searchTerm, "tst_quickOrder_autocomplete");

            this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();

            this.autocompleteOptions.open = this.onAutocompleteOptionsOpen();
        }

        protected onAutocompleteOptionsSelect(): (evt: kendo.ui.AutoCompleteSelectEvent) => void {
            return (evt: kendo.ui.AutoCompleteSelectEvent) => {
                const dataItem = evt.sender.dataItem(evt.item.index());
                this.lookupAndAddProductById(dataItem.id);
            };
        }

        protected onAutocompleteOptionsOpen(): (evt: kendo.ui.AutoCompleteSelectEvent) => void {
            return (evt: kendo.ui.AutoCompleteSelectEvent) => {
                if (!this.searchTerm) {
                    evt.preventDefault();
                }
            };
        }

        protected getSettings(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.productSettings;
            this.orderSettings = settingsCollection.orderSettings;
            this.alternateUnitsOfMeasureFromSettings = settingsCollection.productSettings.alternateUnitsOfMeasure;
        }

        protected getSettingsFailed(error: any): void {
        }

        onEnterKeyPressedInAutocomplete(): void {
            const autocomplete = $("#qo-search-view").data("kendoAutoComplete") as any;
            if (autocomplete._last === kendo.keys.ENTER) {
                if (!autocomplete.list.is(":visible") && this.product.id && this.product.qtyOrdered) {
                    this.addProduct(this.product);
                } else if (autocomplete.listView.selectedDataItems().length === 0) {
                    this.lookupAndAddProductBySearchTerm(this.searchTerm);
                }
            }
        }

        protected lookupAndAddProductById(id: string): void {
            const expandParameter = ["pricing", "brand", "styledproducts"];

            this.productService.getProduct(null, id, expandParameter).then(
                (product: ProductModel) => { this.getProductCompleted(product); },
                (error: any) => { this.getProductFailed(error); });

        }

        protected getProductCompleted(product: ProductModel): void {
            // TODO ISC-4519
            // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
            this.getRealTimeInventory(product.product).then(() => {
                this.validateAndSetProduct(product.product);
            });
        }

        protected getProductFailed(error: any): void {
            this.errorMessage = angular.element("#messageNotFound").val();
        }

        protected lookupAndAddProductBySearchTerm(searchTerm: string): void {
            const parameter: catalog.IProductCollectionParameters = { extendedNames: [searchTerm] };
            const expandParameter = ["pricing", "brand", "styledproducts"];

            this.productService.getProducts(parameter, expandParameter).then(
                (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection); },
                (error: any) => { this.getProductsFailed(error); });
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel): void {
            // TODO ISC-4519
            // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
            this.getRealTimeInventory(productCollection.products[0]).then(() => {
                this.validateAndSetProduct(productCollection.products[0]);
            });
        }

        protected getProductsFailed(error: any): void {
            this.errorMessage = angular.element("#messageNotFound").val();
        }

        protected validateAndSetProduct(product: ProductDto): boolean {
            if (!this.canProductBeQuickOrdered(product)) {
                return false;
            }

            product.qtyOrdered = Math.max(this.product.qtyOrdered || 1, product.minimumOrderQty || 1);
            this.product = product;
            this.errorMessage = "";
            return true;
        }

        protected addProduct(product: ProductDto): void {
            if (!this.canProductBeQuickOrdered(product)) {
                return;
            }

            this.product.qtyOrdered = parseFloat(this.product.qtyOrdered.toString());
            let productExists = false;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.unitOfMeasure) {
                    this.products[i].qtyOrdered = parseFloat(this.products[i].qtyOrdered.toString()) + this.product.qtyOrdered;
                    productExists = true;
                    if (this.settings.realTimePricing) {
                        this.showPriceSpinner(this.products[i]);
                        this.getRealtimePrices(this.products[i]);
                    } else {
                        this.productService.getProductPrice(this.products[i]).then(
                            (productPrice: ProductPriceModel) => { this.getProductPriceCompleted(productPrice); },
                            (error: any) => { this.getProductPriceFailed(error); });
                    }

                    break;
                }
            }

            this.searchTerm = "";
            this.errorMessage = "";

            angular.element("#qo-search-view").data("kendoAutoComplete").close(); // close autocomplete

            if (productExists) {
                this.product = { qtyOrdered: 1 } as ProductDto;
                return;
            }

            (product as any).uuid = guidHelper.generateGuid(); // tack on a guid to use as an id for the quantity break pricing tooltip

            if (!this.settings.realTimeInventory && !this.settings.realTimePricing) {
                if (this.canProductBeQuickOrdered(product)) {
                    this.productService.getProductPrice(product);
                    this.products.unshift(product);
                    this.product = { qtyOrdered: 1 } as ProductDto;
                }

                return;
            }

            if (this.settings.realTimePricing) {
                this.getRealtimePrices(product);
            }

            if (this.canProductBeQuickOrdered(product)) {
                this.products.unshift(product);
                this.product = { qtyOrdered: 1 } as ProductDto;
            }
        }

        protected getRealtimePrices(product: ProductDto): void {
            if (product.quoteRequired) {
                return;
            }

            if (!this.settings.realTimePricing) {
                return;
            }

            this.productService.getProductRealTimePrices([product]).then(
                (realTimePricing: RealTimePricingModel) => { this.getProductRealTimePricesCompleted(realTimePricing, product); },
                (error: any) => { this.getProductRealTimePricesFailed(error, product); });
        }

        protected canProductBeQuickOrdered(product: ProductDto): boolean {
            if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                this.errorMessage = angular.element("#messageConfigurableProduct").val();
                return false;
            }
            if (product.isStyleProductParent) {
                this.selectVariantProductPopupService.display(product);
                return false;
            }
            if (!product.canAddToCart) {
                if (product.isDiscontinued && product.replacementProductId) {
                    this.lookupAndAddProductById(product.replacementProductId.toString());
                } else {
                    this.errorMessage = angular.element("#messageUnavailable").val();
                }
                return false;
            }
            return true;
        }

        changeUnitOfMeasureInList(product: ProductDto): void {
            if (!product.productUnitOfMeasures) {
                return;
            }

            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.selectedUnitOfMeasure) {
                    product.qtyOrdered = parseFloat(product.qtyOrdered.toString()) + parseFloat(this.products[i].qtyOrdered.toString());
                    (this.products as any).splice(i, 1);
                    break;
                }
            }

            // this calls to get a new price and updates the product which updates the ui
            this.productService.changeUnitOfMeasure(product).then(
                (productResult: ProductDto) => { this.changeUnitOfMeasureInListCompleted(productResult); },
                (error: any) => { this.changeUnitOfMeasureInListFailed(error); });
        }

        protected changeUnitOfMeasureInListCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureInListFailed(error: any): void {
        }

        changeUnitOfMeasure(product: ProductDto): void {
            if (!product.productUnitOfMeasures) {
                return;
            }

            product.selectedUnitOfMeasure = this.selectedUnitOfMeasure;

            // this calls to get a new price and updates the product which updates the ui
            this.productService.changeUnitOfMeasure(product).then(
                (productResult: ProductDto) => { this.changeUnitOfMeasureCompleted(productResult); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        quantityInput(product: ProductDto): void {
            if (this.settings.realTimePricing) {
                this.showPriceSpinner(product);
                this.getRealtimePrices(product);
            } else {
                this.productService.getProductPrice(product).then(
                    (productPrice: ProductPriceModel) => { this.getProductPriceCompleted(productPrice); },
                    (error: any) => { this.getProductPriceFailed(error); });
            }
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel, product: ProductDto): void {
        }

        protected getProductRealTimePricesFailed(error: any, product?: ProductDto): void {
            this.products.forEach(p => (p.pricing as any).failedToGetRealTimePrices = true);
        }

        protected getProductPriceCompleted(productPrice: ProductPriceModel): void {
        }

        protected getProductPriceFailed(error: any): void {
        }

        protected showPriceSpinner(product: ProductDto): void {
            if (product.pricing === null) {
                product.pricing = {
                    requiresRealTimePrice: true
                } as ProductPriceDto;
            }
            else {
                product.pricing.requiresRealTimePrice = true;
            }
        }

        addAllToCart(redirectUrl: string): void {
            this.cartService.addLineCollectionFromProducts(this.products.slice().reverse(), true).then(
                (cartLines: CartLineCollectionModel) => { this.addAllToCartCompleted(cartLines, redirectUrl); },
                (error: any) => { this.addAllToCartFailed(error); });
        }

        protected addAllToCartCompleted(cartLines: CartLineCollectionModel, redirectUrl: string): void {
            this.coreService.redirectToPath(redirectUrl);
        }

        protected addAllToCartFailed(error: any): void {
        }

        allQtysIsValid(): boolean {
            return this.products.every((product: ProductDto) => {
                return product.qtyOrdered && parseFloat(product.qtyOrdered.toString()) > 0;
            });
        }

        removeProduct(product: ProductDto): void {
            this.products.splice(this.products.indexOf(product), 1);
        }

        protected getTotal(): number {
            let total = 0;
            angular.forEach(this.products, product => {
                if (!product.quoteRequired) {
                    total += product.pricing.extendedUnitNetPrice;
                }
            });

            return total;
        }

        protected getCurrencySymbol(): string {
            let currencySymbol = "";

            const productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false });
            if (productsWithPricing.length) {
                currencySymbol = productsWithPricing[0].currencySymbol;
            }

            return currencySymbol;
        }

        protected getDecimalSymbol(): string {
            let decimalSymbol = ".";

            const productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null }});
            if (productsWithPricing.length) {
                const productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                decimalSymbol = productPriceDisplay[productPriceDisplay.length - 3];
            }

            return decimalSymbol;
        }

        protected getDelimiterSymbol(): string {
            let delimiterSymbol = ".";

            const productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null }});
            if (productsWithPricing.length) {
                const productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                let matches = productPriceDisplay.substring(1, productPriceDisplay.length - 3).match(/[\D]/g);
                if (matches && matches.length > 0) {
                    delimiterSymbol = matches[0] !== String.fromCharCode(160) ? matches[0] : " ";
                }
            }

            return delimiterSymbol;
        }

        // returns the grand total of all lines prices, in the same currency format
        grandTotal(): string {
            const total = this.getTotal();
            const currencySymbol = this.getCurrencySymbol();
            const decimalSymbol = this.getDecimalSymbol();
            const delimiterSymbol = this.getDelimiterSymbol();

            let formattedTotal = currencySymbol + total.toFixed(2);

            if (decimalSymbol === ".") {
                formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\.)/g, delimiterSymbol !== " " ? "$1," : "$1 ");
            } else {
                formattedTotal = formattedTotal.replace(".", ",");
                formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\,)/g, delimiterSymbol !== " " ? "$1." : "$1 ");
            }

            return formattedTotal;
        }

        showUnitOfMeasureLabel(product: ProductDto): boolean {
            return product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !product.quoteRequired;
        }

        openWishListPopup(product: ProductDto): void {
            this.addToWishlistPopupService.display([product]);
        }

        quantityKeyPress(keyEvent: KeyboardEvent, product: ProductDto): void {
            if (keyEvent.which === 13) {
                (keyEvent.target as any).blur();
            }
        }

        protected getRealTimeInventory(product: ProductDto): ng.IPromise<void> {
            const deferred = this.$q.defer<void>();

            if (this.settings.realTimeInventory) {
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
    }

    angular
        .module("insite")
        .controller("QuickOrderPageController", QuickOrderPageController);
}