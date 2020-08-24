

module insite.catalog {
    "use strict";

    export class BrasselerProductDetailController extends ProductDetailController {
        errorMessage: string;
        session: any;
        replacementProduct: ProductDto;
        VDGRelatedProducts: any;
        volumeGrpDescription: string;
        cartPopupTimeout = 5000;
        localStorage: common.IWindowStorage;
        newWebShopperCustomerNumber = "1055357";

        public static $inject = [
            "$scope",
            "coreService",
            "cartService",
            "productService",
            "addToWishlistPopupService",
            "productSubscriptionPopupService",
            "settingsService",
            "$stateParams",
            "sessionService",
            "$rootScope",
            "brasslerProductService",
            "brasselerCartService",
            "$localStorage",
            "ipCookie",
            "AddToExistingSmartSupplyService",
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
            protected $rootScope: ng.IRootScopeService,
            protected brasslerProductService: IBrasselerProductService,
            protected brasselerCartService: cart.IBrasselerCartService,
            protected $localStorage: common.IWindowStorage,
            protected ipCookie: any,
            protected addToExistingSmartSupplyService: smartsupply.AddToExistingSmartSupplyService,
            protected spinnerService: core.ISpinnerService,
            protected queryString: common.IQueryStringService,
            protected tellAFriendPopupService: catalog.ITellAFriendPopupService) {
            super(
                $scope,
                coreService,
                cartService,
                productService,
                addToWishlistPopupService,
                productSubscriptionPopupService,
                settingsService,
                $stateParams,
                sessionService,
                spinnerService,
                queryString,
                tellAFriendPopupService);

            this.spinnerService.show();
            super.$onInit();
            this.init();
            this.spinnerService.hide();
            this.localStorage = $localStorage;
        }

        init() {
            this.sessionService.getSession().then((session: SessionModel) => {
                this.session = session;
            });

            this.$scope.$on("addToCartList", (event, data) => {
                this.showAddToCartPopup();
            });
        }

        getProductData(productId: string) {
            var expandParameter = ["documents", "specifications", "styledproducts", "htmlcontent", "attributes", "crosssells", "pricing"];
            var showPopUp = false;
            this.spinnerService.show();
            this.productService.getProduct(this.category != null ? this.category.id.toString() : null, productId, expandParameter).then(
                (result: ProductModel) => {
                    this.product = result.product;
                    if (this.session != null && this.session != undefined && this.session.billTo) {
                        if (String(this.session.billTo.customerNumber).includes(this.newWebShopperCustomerNumber)) {
                            this.product.properties['isNewUser'] = "true";
                        }
                    }
                    if (result.properties["vdgRelatedProducts"] != null && result.product.modelNumber != null) {
                        this.VDGRelatedProducts = JSON.parse(result.properties["vdgRelatedProducts"]);
                        this.volumeGrpDescription = result.product.modelNumber;
                    }


                    if (result.product.replacementProductId != null) {
                        this.getReplacementProductData(result.product.replacementProductId.toString().toUpperCase());
                    }
                    this.product.qtyOrdered = 1;

                    if (this.product.isConfigured && this.product.configurationDto && this.product.configurationDto.sections)
                        this.initConfigurationSelection(this.product.configurationDto.sections);

                    if (this.product.styleTraits.length > 0) {
                        this.initialStyledProducts = this.product.styledProducts.slice();
                        this.styleTraitFiltered = this.product.styleTraits.slice();
                        this.initialStyleTraits = this.product.styleTraits.slice();
                        if (this.product.isStyleProductParent) {
                            this.parentProduct = angular.copy(this.product);
                        }
                        this.initStyleSelection(this.product.styleTraits);
                    };

                    setTimeout(() => {
                        (<any>$(".easy-resp-tabs")).easyResponsiveTabs();
                    }, 10);

                    this.cartService.cartLoadCalled = false;
                    this.cartService.getCart();
                    // BUSA-573
                    //*********Google Tag Manager measuring product detail view *****************
                    var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
                    dataLayer.push({
                        'ecommerce': {
                            'detail': {
                                'actionField': { 'list': 'Product List' },
                                'products': [{
                                    "id": this.product.sku,
                                    "name": this.product.shortDescription,
                                    "price": this.product.pricing.actualPriceDisplay,
                                    "category": this.category ? this.category.name : this.product.modelNumber,
                                    "variant": this.product.unitOfMeasure,
                                    "brand": "Brasseler"
                                }]
                            }
                        }
                    });
                    //*********Google Tag Manager measuring product clicks *****************
                    dataLayer.push({
                        'event': 'productClick',
                        'ecommerce': {
                            'click': {
                                'actionField': { 'list': 'Product List' },      // Optional list property.
                                'products': [{
                                    "id": this.product.sku,
                                    "name": this.product.shortDescription,
                                    "price": this.product.pricing.actualPriceDisplay,
                                    "category": this.category ? this.category.name : this.product.modelNumber,
                                    "position": this.product.sortOrder,
                                    "variant": this.product.unitOfMeasure,
                                    "brand": "Brasseler"
                                }]
                            }
                        },
                        //'eventCallback': function () {
                        //    document.location = this.product.productDetailUrl
                        //}
                    });
                },
                (error) => {
                }).then(() => {
                    this.spinnerService.hide();
                });
        }

        getReplacementProductData(productId: string) {
            this.brasslerProductService.getReplacementProductData(productId).then(
                (results: ProductModel) => {
                    this.replacementProduct = results.product;
                },
                (error) => {
                });
        }

        //BUSA- 463 Subscription : add smartsupply product to cart
        addToSmartSupply(product: ProductDto) {
            if (this.isAuthenticated()) {
                var sectionOptions: ConfigSectionOptionDto[] = null;
                if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                    sectionOptions = this.configurationSelection;
                }
                this.brasselerCartService.addSmartSupplyLineFromProduct(product, sectionOptions).then(
                    (cartLine: CartLineModel) => { this.addingToCart = false; },
                    (error: any) => { this.addingToCart = false; }
                );
            }
            else {
                this.$rootScope.$broadcast("addToCartList");
            }
        }

        addToCart(product: ProductDto) {
            if (this.isAuthenticated()) {
                this.addingToCart = true;

                let sectionOptions: ConfigSectionOptionDto[] = null;
                if (this.configurationCompleted && product.configurationDto && product.configurationDto.sections) {
                    sectionOptions = this.configurationSelection;
                }

                this.cartService.addLineFromProduct(product, sectionOptions, this.productSubscription, true).then(
                    (cartLine: CartLineModel) => { this.addingToCart = false; },
                    (error: any) => {
                        this.addingToCart = false;
                        this.errorMessage = error.message;
                    }
                );
            }
            else {
                this.$rootScope.$broadcast("addToCartList");
            }
            // BUSA-573
            //*********Google Tag Manager measuring product add to cart *****************
            var dataLayer = (<any>window).dataLayer = (<any>window).dataLayer || [];
            dataLayer.push({
                'event': 'addToCart',
                'ecommerce': {
                    'currencyCode': 'USD',
                    'add': {
                        'actionField': { 'list': product.shortDescription },
                        'product': [{
                            "id": product.sku,
                            "name": product.shortDescription,
                            "price": product.pricing.actualPriceDisplay,
                            "quantity": product.qtyOrdered,
                            "category": this.category ? this.category.name : this.product.modelNumber,
                            "variant": this.product.unitOfMeasure,
                            "brand": 'Brasseler'
                        }]
                    }
                }
            });
        }

        isAuthenticated(): boolean {
            return this.session && this.session.isAuthenticated;
        }

        //BUSA-747 : Add product to existing smart supply link should display on PLP and PDP and search result page
        openSmartSupplyPopup(product: ProductDto) {
            this.addToExistingSmartSupplyService.display([product]);
        }

        showAddToCartPopup() {
            this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
        }
    }

    angular
        .module("insite")
        .controller("ProductDetailController", BrasselerProductDetailController);
}