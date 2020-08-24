module insite.quickorder {
    "use strict";

    export class BrasselerQuickOrderPageController extends QuickOrderPageController {
        static $inject = ["$scope", "$filter", "coreService", "cartService", "productService", "searchService", "settingsService", "addToWishlistPopupService", "sessionService", "spinnerService", "selectVariantProductPopupService","$q"];

        isNewUser: boolean = false;
        newWebShopperCustomerNumber = "1055357";
        sampleErrorMessage: string;
        constructor(
            protected $scope: ng.IScope,
            protected $filter: ng.IFilterService,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService,
            protected productService: catalog.IProductService,
            protected searchService: catalog.ISearchService,
            protected settingsService: core.ISettingsService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected selectVariantProductPopupService: SelectVariantProductPopupService,
            protected $q: ng.IQService) {
            super(
                $scope,
                $filter,
                coreService,
                cartService, productService,
                searchService,
                settingsService,
                addToWishlistPopupService,
                selectVariantProductPopupService,
                $q
            )
            console.log('inside custom method');
            //this.init();
        }

        init(): void {
            super.$onInit();
        }

        getProductCompleted(product: ProductModel): void {
            // TODO ISC-4519
            // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
            if (this.sessionService != undefined) {
                this.sessionService.getSession().then(session => {
                    if (session != null && session != undefined && session.billTo) {
                        if (String(session.billTo.customerNumber).includes(this.newWebShopperCustomerNumber)) {
                            this.isNewUser = true;
                            console.log(this.isNewUser);
                        }
                    }
                });
            }
            this.addProduct(product.product);
        }

        addAllToCart(redirectUrl: string): void {
            this.spinnerService.show();
            this.cartService.addLineCollectionFromProducts(this.products, true).then(
                (cartLines: CartLineCollectionModel) => { this.addAllToCartCompleted(cartLines, redirectUrl); this.spinnerService.hide(); },
                (error: any) => {
                    this.addAllToCartFailed(error);
                    this.sampleErrorMessage = error.message;
                    this.spinnerService.hide();
                });
        }
    }
    angular
        .module("insite")
        .controller("QuickOrderPageController", BrasselerQuickOrderPageController);
}