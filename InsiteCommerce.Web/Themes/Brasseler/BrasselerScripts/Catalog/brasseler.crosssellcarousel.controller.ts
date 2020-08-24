module insite.catalog {
    "use strict";

    export class BrasselerCrossSellCarouselController extends CrossSellCarouselController {

        session: any;
        newWebShopperCustomerNumber = "1055357";
        isNewUser: boolean = false;
        sampleErrorMessage: string;

        public static $inject = ["cartService", "productService", "$timeout", "addToWishlistPopupService", "settingsService", "$scope", "$rootScope", "sessionService"];

        constructor(
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected $timeout: ng.ITimeoutService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected sessionService: account.ISessionService) {
            super(cartService, productService, $timeout, addToWishlistPopupService, settingsService, $scope);
            //this.init(); //BUSA-1350: to reduce the multiple api calls
        }

        init() {
            if (this.sessionService != undefined) {
                this.sessionService.getSession().then(session => {
                    this.session = session;
                    if (this.session != null && this.session != undefined && this.session.billTo) {
                        if (String(this.session.billTo.customerNumber).includes(this.newWebShopperCustomerNumber)) {
                            this.isNewUser = true;
                        }
                    }
                });
            }
            super.init();
        }

        addToCart(product: ProductDto) {
            if (this.isAuthenticated()) {
                super.addToCart(product);
            }
            else {
                this.$rootScope.$broadcast("addToCartList");
            }
        }

        addToCartFailed(error: any): void {//BUSA-1170
            this.addingToCart = false;
            this.sampleErrorMessage = error.message;
        }

        isAuthenticated(): boolean {
            return this.session && this.session.isAuthenticated;
        }
    }

    angular.module("insite")
        .controller("CrossSellCarouselController", BrasselerCrossSellCarouselController);
} 