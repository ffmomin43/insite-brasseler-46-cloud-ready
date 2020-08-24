import ConfigSectionDto = Insite.Catalog.Services.Dtos.ConfigSectionDto;
import ConfigSectionOptionDto = Insite.Catalog.Services.Dtos.ConfigSectionOptionDto;
import StyleTraitDto = Insite.Catalog.Services.Dtos.StyleTraitDto;
import StyledProductDto = Insite.Catalog.Services.Dtos.StyledProductDto;
import StyleValueDto = Insite.Catalog.Services.Dtos.StyleValueDto;
import BreadCrumbModel = Insite.Catalog.WebApi.V1.ApiModels.BreadCrumbModel;

module insite.catalog {
    "use strict";

    export class ProductDetailController {
        product: ProductDto;
        category: CategoryModel;
        breadCrumbs: BreadCrumbModel[];
        settings: ProductSettingsModel;
        configurationSelection: ConfigSectionOptionDto[] = [];
        configurationCompleted = false;
        styleSelection: StyleValueDto[] = [];
        styleSelectionCompleted = false;
        parentProduct: ProductDto = null;
        initialStyleTraits: StyleTraitDto[] = [];
        initialStyledProducts: StyledProductDto[] = [];
        styleTraitFiltered: StyleTraitDto[] = [];
        showUnitError = false;
        failedToGetRealTimePrices = false;
        failedToGetRealTimeInventory = false;
        productSubscription: ProductSubscriptionDto;
        addingToCart = false;
        languageId: System.Guid;
        enableWarehousePickup: boolean;
        session: SessionModel;
        initResolvePageCalled: boolean;
        configuration: string[] = [];

        static $inject = [
            "$scope",
            "coreService",
            "cartService",
            "productService",
            "addToWishlistPopupService",
            "productSubscriptionPopupService",
            "settingsService",
            "$stateParams",
            "sessionService",
            "spinnerService",
            "queryString",
            "tellAFriendPopupService"
            ];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected productSubscriptionPopupService: catalog.ProductSubscriptionPopupService,
            protected settingsService: core.ISettingsService,
            protected $stateParams: IContentPageStateParams,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected queryString: common.IQueryStringService,
            protected tellAFriendPopupService: catalog.ITellAFriendPopupService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("updateProductSubscription", (event: ng.IAngularEvent, productSubscription: ProductSubscriptionDto, product: ProductDto, cartLine: CartLineModel) => {
                this.onUpdateProductSubscription(event, productSubscription, product, cartLine);
            });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            this.$scope.$on("sessionUpdated", (event: ng.IAngularEvent, session: SessionModel) => {
                this.onSessionUpdated(session);
            });

            this.$scope.$on("$locationChangeSuccess", () => {
                if (this.product && this.product.styleTraits) {
                    this.initStyleSelection(this.product.styleTraits);
                }
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.productSettings;
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            const context = this.sessionService.getContext();
            this.languageId = context.languageId;
            this.resolvePageOnInit();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onUpdateProductSubscription(event: ng.IAngularEvent, productSubscription: ProductSubscriptionDto, product: ProductDto, cartLine: CartLineModel): void {
            this.productSubscription = productSubscription;
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.resolvePageOnInit();
        }

        protected getSessionFailed(error: any): void {
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.session = session;
            this.resolvePage();
        }

        protected resolvePageOnInit(): void {
            if (this.session && this.settings && !this.initResolvePageCalled) {
                this.initResolvePageCalled = true;
                this.resolvePage();
            }
        }

        protected resolvePage(): void {
            this.spinnerService.show();
            const path = this.$stateParams.path || window.location.pathname;
            this.productService.getCatalogPage(path).then(
                (catalogPage: CatalogPageModel) => { this.getCatalogPageCompleted(catalogPage); },
                (error: any) => { this.getCatalogPageFailed(error); });
        }

        protected getCatalogPageCompleted(catalogPage: CatalogPageModel): void {
            const productId = catalogPage.productId; // this url is already known to map to a single product so productId should always be non null.
            this.category = catalogPage.category;
            this.breadCrumbs = catalogPage.breadCrumbs;
            this.getProductData(productId.toString());
        }

        protected getCatalogPageFailed(error: any): void {
        }

        protected getProductData(productId: string): void {
            this.spinnerService.show();
            const expand = ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing", "relatedproducts", "brand"];
            let includeAlternateInventory = !this.enableWarehousePickup || this.session.fulfillmentMethod !== "PickUp";
            this.productService.getProduct(null, productId, expand, true, true, "IncludeOnProduct", includeAlternateInventory, this.configuration, false).then(
                (productModel: ProductModel) => { this.getProductCompleted(productModel); },
                (error: any) => { this.getProductFailed(error); });
        }

        protected getProductCompleted(productModel: ProductModel): void {
            const productWasAlreadyLoaded = !!this.product;
            this.product = productModel.product;
            this.product.qtyOrdered = this.product.minimumOrderQty || 1;

            if (!productWasAlreadyLoaded && this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                this.initConfigurationSelection(this.product.configurationDto.sections);
            }

            if (this.product.styleTraits.length > 0) {
                this.initialStyledProducts = this.product.styledProducts.slice();
                this.styleTraitFiltered = this.product.styleTraits.slice();
                this.initialStyleTraits = this.product.styleTraits.slice();
                if (this.product.isStyleProductParent) {
                    this.parentProduct = angular.copy(this.product);
                }

                if (!productWasAlreadyLoaded) {
                    this.initStyleSelection(this.product.styleTraits);
                }
            }

            if (productWasAlreadyLoaded && this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                this.configurationCompleted = false;
                this.configChanged();
            } else {
                this.getRealTimePrices();
                if (!this.settings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            }

            this.setTabs();
        }

        protected setTabs() {
            setTimeout(() => {
                ($(".easy-resp-tabs") as any).easyResponsiveTabs();
            }, 10);
        }

        protected getProductFailed(error: any): void {
        }

        protected getRealTimePrices(): void {
            if (this.product.quoteRequired) {
                return;
            }

            if (this.settings.realTimePricing) {
                const priceProducts = [this.product];
                if (this.product.styledProducts != null && this.product.styledProducts.length > 0) {
                    this.product.styledProducts.forEach((s) => {
                        (s as any).id = s.productId;
                        priceProducts.push(s as any);
                    });
                }

                this.product.pricing.requiresRealTimePrice = true;
                this.productService.getProductRealTimePrices(priceProducts).then(
                    (realTimePrice: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePrice),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getProductRealTimePricesCompleted(realTimePrice: RealTimePricingModel): void {
            // product.pricing is already updated
            if (this.product.isStyleProductParent) {
                this.parentProduct = angular.copy(this.product);
            }

            if (this.settings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;

            if (this.settings.inventoryIncludedWithPricing) {
                this.failedToGetRealTimeInventory = true;
            }
        }

        protected getRealTimeInventory(): void {
            if (this.settings.realTimeInventory) {
                const inventoryProducts = [this.product];
                if (this.product.styledProducts != null && this.product.styledProducts.length > 0) {
                    this.product.styledProducts.forEach((s) => {
                        (s as any).id = s.productId;
                        inventoryProducts.push(s as any);
                    });
                }

                this.productService.getProductRealTimeInventory(inventoryProducts).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            }
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel): void {
            // product inventory is already updated
            if (this.product.isStyleProductParent) {
                this.parentProduct = angular.copy(this.product);
                this.styleChange();
            }

            if (this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections) {
                this.configurationCompleted = this.isConfigurationCompleted();
            }
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
            this.failedToGetRealTimeInventory = true;
        }

        protected initConfigurationSelection(sections: ConfigSectionDto[]): void {
            this.configurationSelection = [];
            angular.forEach(sections, (section: ConfigSectionDto) => {
                const result = this.coreService.getObjectByPropertyValue(section.options, { selected: true });
                this.configurationSelection.push(result);
            });
            this.configurationCompleted = this.isConfigurationCompleted();
        }

        protected initStyleSelection(styleTraits: StyleTraitDto[]): void {
            // from autocomplete we are using option, from search user will be redirected with criteria
            const styledOption = this.queryString.get("option") || this.queryString.get("criteria");
            const styledOptionLowerCase = styledOption ? styledOption.toLowerCase() : "";
            let styledProduct: StyledProductDto;
            if (styledOptionLowerCase && this.product.styledProducts) {
                styledProduct = this.product.styledProducts.filter(o => o.erpNumber.toLowerCase() === styledOptionLowerCase)[0];
            }

            this.styleSelection = [];
            angular.forEach(styleTraits.sort((a, b) => a.sortOrder - b.sortOrder), (styleTrait: StyleTraitDto) => {
                let result: StyleValueDto = null;
                if (styledProduct) {
                    for (let styleValue of styledProduct.styleValues) {
                        result = this.coreService.getObjectByPropertyValue(styleTrait.styleValues,
                            { styleTraitId: styleValue.styleTraitId, styleTraitValueId: styleValue.styleTraitValueId });
                        if (result) {
                            break;
                        }
                    }
                }

                if (!result) {
                    result = this.coreService.getObjectByPropertyValue(styleTrait.styleValues, { isDefault: true });
                }

                this.styleSelection.push(result);
            });

            if (styledProduct) {
                this.product.qtyOrdered = styledProduct.minimumOrderQty || 1;
            }

            this.styleChange();
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            let sectionOptions: ConfigSectionOptionDto[] = null;
            if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                sectionOptions = this.configurationSelection;
            }

            this.cartService.addLineFromProduct(product, sectionOptions, this.productSubscription, true).then(
                (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                (error: any) => { this.addToCartFailed(error); }
            );
        }

        protected addToCartCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
        }

        openWishListPopup(product: ProductDto): void {
            this.addToWishlistPopupService.display([product]);
        }

        openProductSubscriptionPopup(product: ProductDto): void {
            this.productSubscriptionPopupService.display({ product: product, cartLine: null, productSubscription: this.productSubscription });
        }

        openSharePopup(product: ProductDto): void {
            this.tellAFriendPopupService.display({ product: product });
        }

        changeUnitOfMeasure(product: ProductDto): void {
            this.showUnitError = false;
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); }
            );
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
            this.product = product;
            this.productService.updateAvailability(product);
            if (this.parentProduct) {
                this.parentProduct.selectedUnitOfMeasure = product.selectedUnitOfMeasure;
                this.parentProduct.unitOfMeasureDisplay = product.unitOfMeasureDisplay;
            }
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        styleChange(): void {
            this.showUnitError = false;
            let styledProductsFiltered: StyledProductDto[] = [];

            angular.copy(this.initialStyleTraits, this.styleTraitFiltered); // init styleTraitFiltered to display

            // loop trough every trait and compose values
            this.styleTraitFiltered.forEach((styleTrait) => {
                if (styleTrait) {
                    styledProductsFiltered = this.initialStyledProducts.slice();

                    // iteratively filter products for selected traits (except current)
                    this.styleSelection.forEach((styleValue: StyleValueDto) => {
                        if (styleValue && styleValue.styleTraitId !== styleTrait.styleTraitId) { // skip current
                            styledProductsFiltered = this.getProductsByStyleTraitValueId(styledProductsFiltered, styleValue.styleTraitValueId);
                        }
                    });

                    // for current trait get all distinct values in filtered products
                    const filteredValues: StyleValueDto[] = [];
                    styledProductsFiltered.forEach((product: StyledProductDto) => {
                        const currentProduct = this.coreService.getObjectByPropertyValue(product.styleValues, { styleTraitId: styleTrait.styleTraitId }); // get values for current product
                        const isProductInFilteredList = currentProduct && filteredValues.some(item => (item.styleTraitValueId === currentProduct.styleTraitValueId)); // check if value already selected
                        if (currentProduct && !isProductInFilteredList) {
                            filteredValues.push(currentProduct);
                        }
                    });

                    styleTrait.styleValues = filteredValues.slice();
                }
            });

            this.styleSelectionCompleted = this.isStyleSelectionCompleted();

            if (this.styleSelectionCompleted) {
                const selectedProduct = this.getSelectedStyleProduct(styledProductsFiltered);
                if (selectedProduct) {
                    this.selectStyledProduct(selectedProduct);
                    this.product.isStyleProductParent = false;
                }
            } else {
                if (!this.product.isStyleProductParent) {
                    // displaying parent product when style selection is not completed and completed product was displayed
                    if (this.parentProduct.productUnitOfMeasures && this.parentProduct.productUnitOfMeasures.length > 0 && !this.parentProduct.canConfigure) {
                        if (this.parentProduct.productUnitOfMeasures.every(elem => elem.unitOfMeasure !== this.product.selectedUnitOfMeasure)) {
                            this.parentProduct.selectedUnitOfMeasure = this.getDefaultValue(this.parentProduct.productUnitOfMeasures);
                            this.changeUnitOfMeasure(this.parentProduct);
                        }

                        if (!this.settings.realTimePricing) {
                            this.productService.getProductPrice(this.parentProduct).then(
                                (productPrice: ProductPriceModel) => { this.styleChangeGetProductPriceCompleted(productPrice); },
                                (error: any) => { this.styleChangeGetProductPriceFailed(error); });
                        } else {
                            this.product = angular.copy(this.parentProduct);
                            this.setTabs();
                        }

                    } else {
                        this.product = angular.copy(this.parentProduct);
                        this.product.unitOfMeasureDisplay = "";
                        this.setTabs();
                    }
                }
            }
        }

        protected styleChangeGetProductPriceCompleted(productPrice: ProductPriceModel): void {
            this.product = angular.copy(this.parentProduct);
            this.setTabs();
        }

        protected styleChangeGetProductPriceFailed(error: any): void {
        }

        protected getSelectedStyleProduct(styledProducts: StyledProductDto[]): StyledProductDto {
            this.styleSelection.forEach((styleValue: StyleValueDto) => {
                styledProducts = this.getProductsByStyleTraitValueId(styledProducts, styleValue.styleTraitValueId);
            });

            return (styledProducts && styledProducts.length > 0) ? styledProducts[0] : null;
        }

        protected getProductsByStyleTraitValueId(styledProducts: StyledProductDto[], styleTraitValueId: System.Guid): StyledProductDto[] {
            return styledProducts.filter(product => product.styleValues.some(value => value.styleTraitValueId === styleTraitValueId));
        }

        protected selectStyledProduct(styledProduct: StyledProductDto): void {
            this.product.erpNumber = styledProduct.erpNumber;
            this.product.smallImagePath = styledProduct.smallImagePath;
            this.product.mediumImagePath = styledProduct.mediumImagePath;
            this.product.largeImagePath = styledProduct.largeImagePath;
            this.product.name = styledProduct.name;
            this.product.id = styledProduct.productId;
            this.product.qtyOnHand = styledProduct.qtyOnHand;
            this.product.quoteRequired = styledProduct.quoteRequired;
            this.product.shortDescription = styledProduct.shortDescription;
            this.product.availability = styledProduct.availability;
            this.product.productUnitOfMeasures = styledProduct.productUnitOfMeasures;
            this.product.productImages = styledProduct.productImages;
            this.product.trackInventory = styledProduct.trackInventory;
            this.product.minimumOrderQty = styledProduct.minimumOrderQty;
            this.product.productDetailUrl = styledProduct.productDetailUrl;

            if (this.product.qtyOrdered < this.product.minimumOrderQty) {
                this.product.qtyOrdered = this.product.minimumOrderQty;
            }

            if (this.product.productUnitOfMeasures && this.product.productUnitOfMeasures.length > 1) {
                this.productService.getProductPrice(this.product).then(
                    (productPrice: ProductPriceModel) => { this.selectStyleProductGetProductPriceCompleted(productPrice); },
                    (error: any) => { this.selectStyleProductGetProductPriceFailed(error); }
                );

                if (!this.product.selectedUnitOfMeasure) {
                    this.product.selectedUnitOfMeasure = this.getDefaultValue(this.product.productUnitOfMeasures);
                    this.changeUnitOfMeasure(this.product);
                } else if (this.product.productUnitOfMeasures.every(elem => elem.unitOfMeasure !== this.product.selectedUnitOfMeasure)) {
                    this.product.unitOfMeasureDisplay = "";
                    this.showUnitError = true;
                }
            } else {
                if (this.product.productUnitOfMeasures && this.product.productUnitOfMeasures.length === 1) {
                    this.product.selectedUnitOfMeasure = this.getDefaultValue(this.product.productUnitOfMeasures);
                    this.changeUnitOfMeasure(this.product);
                } else {
                    this.product.unitOfMeasureDisplay = "";
                }
                this.product.pricing = styledProduct.pricing;
                this.product.quoteRequired = styledProduct.quoteRequired;
            }
        }

        protected selectStyleProductGetProductPriceCompleted(productPrice: ProductPriceModel): void {
        }

        protected selectStyleProductGetProductPriceFailed(error: any): void {
        }

        protected isStyleSelectionCompleted(): boolean {
            if (!this.product.styleTraits) {
                return true;
            }

            return this.styleSelection.every(item => (item != null));
        }

        protected isConfigurationCompleted(): boolean {
            if (!this.product.isConfigured) {
                return true;
            }

            return this.configurationSelection.every(item => (item != null));
        }

        configChanged(): void {
            this.spinnerService.show();
            this.configuration = [];
            angular.forEach(this.configurationSelection, (selection) => {
                this.configuration.push(selection ? selection.sectionOptionId.toString() : guidHelper.emptyGuid());
            });

            this.getConfigurablePrice(this.product);
            this.getConfigurableAvailability(this.product);
        }

        protected getConfigurablePrice(product: ProductDto): void {
            if (this.settings.realTimePricing) {
                this.productService.getProductRealTimePrice(product, this.configuration).then(
                    (realTimePrice: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePrice),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            } else {
                this.productService.getProductPrice(product, this.configuration).then(
                    (productPrice: ProductPriceModel) => { this.getConfigurablePriceCompleted(productPrice); },
                    (error: any) => { this.getConfigurablePriceFailed(error); }
                );
            }
        }

        protected getConfigurablePriceCompleted(productPrice: ProductPriceModel): void {
        }

        protected getConfigurablePriceFailed(error: any): void {
        }

        protected getConfigurableAvailability(product: ProductDto): void {
            if (this.settings.realTimeInventory) {
                const configurations: { [key: string]: string[] } = {};
                configurations[`${product.id}`] = this.configuration;
                this.productService.getProductRealTimeInventory([product], null, configurations).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            } else {
                this.productService.getProductAvailability(product, this.configuration).then(
                    (productAvailability: ProductAvailabilityModel) => { this.getProductAvailabilityCompleted(productAvailability); },
                    (error: any) => { this.getProductAvailabilityFailed(error); }
                );
            }
        }

        protected getProductAvailabilityCompleted(productAvailability: ProductAvailabilityModel): void {
            this.configurationCompleted = this.isConfigurationCompleted();
        }

        protected getProductAvailabilityFailed(error: any): void {
        }

        protected getDefaultValue(unitOfMeasures: ProductUnitOfMeasureDto[]): string {
            const defaultMeasures = unitOfMeasures.filter(value => {
                return value.isDefault;
            });
            if (defaultMeasures.length > 0) {
                return defaultMeasures[0].unitOfMeasure;
            } else {
                return unitOfMeasures[0].unitOfMeasure;
            }
        }

        protected isAddToCartVisible() {
            return this.product && this.product.allowedAddToCart &&
            (this.product.canAddToCart ||
                ((this.styleSelectionCompleted || this.configurationCompleted)
                    && (this.settings.allowBackOrder || (<any>this.product.availability).messageType !== 2))
                    && !this.product.canConfigure);
        }
    }

    angular
        .module("insite")
        .controller("ProductDetailController", ProductDetailController);
}
