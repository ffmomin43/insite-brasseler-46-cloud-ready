module insite.quickorder {
    "use strict";

    export class SelectVariantProductPopupController {
        static $inject = ["coreService", "selectVariantProductPopupService", "$rootScope", "productService", "settingsService"];

        initialStyleTraits: StyleTraitDto[] = [];
        initialStyledProducts: StyledProductDto[] = [];
        styleTraitFiltered: StyleTraitDto[] = [];
        styleSelection: StyleValueDto[] = [];
        product: ProductDto;
        settings: ProductSettingsModel;
        selector = "#popup-select-variant-product";

        constructor(
            protected coreService: core.ICoreService,
            protected selectVariantProductPopupService: ISelectVariantProductPopupService,
            protected $rootScope: ng.IRootScopeService,
            protected productService: catalog.IProductService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.selectVariantProductPopupService.registerDisplayFunction((product: ProductDto) => {
                this.initialStyledProducts = product.styledProducts.slice();
                this.styleTraitFiltered = product.styleTraits.slice();
                this.initialStyleTraits = product.styleTraits.slice();
                this.styleSelection = this.initialStyleTraits.map(p => null);
                this.product = {} as ProductDto;
                this.coreService.displayModal(this.selector);
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.productSettings;
        }

        protected getSettingsFailed(error: any): void {
        }

        styleChange(): void {
            let styledProductsFiltered: StyledProductDto[] = [];

            angular.copy(this.initialStyleTraits, this.styleTraitFiltered);

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

            if (this.isStyleSelectionCompleted()) {
                const selectedProduct = this.getSelectedStyleProduct(styledProductsFiltered);
                if (selectedProduct) {
                    this.selectStyledProduct(selectedProduct);
                }
            } else if (this.product.id) {
                this.product = {} as ProductDto;
            }
        }

        protected isStyleSelectionCompleted(): boolean {
            return this.styleSelection.every(item => (item != null));
        }

        protected getProductsByStyleTraitValueId(styledProducts: StyledProductDto[], styleTraitValueId: System.Guid): StyledProductDto[] {
            return styledProducts.filter(product => product.styleValues.some(value => value.styleTraitValueId === styleTraitValueId));
        }

        protected getSelectedStyleProduct(styledProducts: StyledProductDto[]): StyledProductDto {
            this.styleSelection.forEach((styleValue: StyleValueDto) => {
                styledProducts = this.getProductsByStyleTraitValueId(styledProducts, styleValue.styleTraitValueId);
            });

            return (styledProducts && styledProducts.length > 0) ? styledProducts[0] : null;
        }

        protected selectStyledProduct(styledProduct: StyledProductDto): void {
            this.product.id = styledProduct.productId;
            this.product.erpNumber = styledProduct.erpNumber;
            this.product.pricing = styledProduct.pricing;
            this.product.shortDescription = styledProduct.shortDescription;

            if (this.settings.realTimePricing && this.product.pricing.requiresRealTimePrice) {
                const products = this.initialStyledProducts.map((styledProduct) => {
                    return {
                        id: styledProduct.productId
                    } as ProductDto;
                });

                this.productService.getProductRealTimePrices(products).then(
                    (productPrice: RealTimePricingModel) => {
                        this.selectStyleProductGetProductPriceCompleted(productPrice);
                    },
                    (error: any) => { this.selectStyleProductGetProductPriceFailed(error); }
                );
            }
        }

        protected selectStyleProductGetProductPriceCompleted(productPrice: RealTimePricingModel): void {
            productPrice.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const product = this.initialStyledProducts.find((p: StyledProductDto) => p.productId === productPrice.productId);
                if (product) {
                    product.pricing = productPrice;
                    if (this.product.id === product.productId) {
                        this.product.pricing = product.pricing;
                    }
                }
            });
        }

        protected selectStyleProductGetProductPriceFailed(error: any): void {
        }

        protected addToQuickOrderForm(): void {
            this.$rootScope.$broadcast("addProductToQuickOrderForm", this.product);
            this.coreService.closeModal(this.selector);
        }
    };

    export interface ISelectVariantProductPopupData {
        
    }

    export interface ISelectVariantProductPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class SelectVariantProductPopupService extends base.BasePopupService<any> implements ISelectVariantProductPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-select-variant-product-popup></isc-select-variant-product-popup>";
        }
    }

    angular
        .module("insite")
        .service("selectVariantProductPopupService", SelectVariantProductPopupService)
        .controller("SelectVariantProductPopupController", SelectVariantProductPopupController)
        .directive("iscSelectVariantProductPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/QuickOrder-SelectVariantProductPopup",
            controller: "SelectVariantProductPopupController",
            controllerAs: "vm"
        }));
}