module insite.catalog {
    "use strict";

    export class BrasselerCompareProductsController extends CompareProductsController {

        ready = false;
        productsToCompare: ProductDto[]; // products being compared
        relevantAttributeTypes: AttributeTypeDto[]; // list of all attribute types belonging to the products
        productSettings: ProductSettingsModel;
        sampleErrorMessage: string;

        public static $inject = [            
            "cartService",
            "coreService",
            "productService",
            "compareProductsService",
            "addToWishlistPopupService",
            "settingsService",            
            "$localStorage",
            "$rootScope",
            "$scope",
            "$window",
        ];

        constructor(
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected productService: catalog.IProductService,
            protected compareProductsService: ICompareProductsService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $localStorage: common.IWindowStorage,
            protected $rootScope: ng.IRootScopeService,
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService) {
            super(cartService, coreService, productService, compareProductsService, addToWishlistPopupService, settingsService, $localStorage);
            this.init();
        }

        init(): void {
            super.$onInit();
        }

        addToCart(product: ProductDto) {
            if (this.isAuthenticated()) {
                this.cartService.addLineFromProduct(product, null, null, true).then(
                    (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                    (error: any) => { this.addToCartFailed(error); }
                );
            }
            else {
                this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
            }
        }

        protected addToCartFailed(error: any): void { //BUSA-1170
            this.addingToCart = false;
            this.sampleErrorMessage = error.message;
        }

        isAuthenticated(): boolean {
            return this.$localStorage.get("accessToken", null) !== null;
        }
    }

    angular.module("insite")
        .controller("CompareProductsController", BrasselerCompareProductsController);
}
