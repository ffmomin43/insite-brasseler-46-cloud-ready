module insite.catalog {
    "use strict";

    export class ProductSubscriptionPopupController {
        product: ProductDto;
        cartLine: CartLineModel;
        currentProductSubscription: ProductSubscriptionDto;
        productSubscription: ProductSubscriptionDto;
        subscriptionCyclePeriodOptions: any;

        static $inject = ["$rootScope", "coreService", "productSubscriptionPopupService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected coreService: core.ICoreService,
            protected productSubscriptionPopupService: ProductSubscriptionPopupService) {
        }

        $onInit(): void {
            this.productSubscriptionPopupService.registerDisplayFunction((data) => {
                this.product = data.product;
                this.cartLine = data.cartLine;
                this.currentProductSubscription = data.productSubscription;
                this.initializeSubscriptionOptions();
                this.initializeProductSubscription();

                setTimeout(() => {
                    this.coreService.displayModal(angular.element("#popup-product-subscription"));
                });
            });
        }

        protected initializeSubscriptionOptions(): void {
            this.subscriptionCyclePeriodOptions = ["Day", "Month"];
        }

        protected initializeProductSubscription(): void {
            const defaultProductSubscription = this.getDefaultProductSubscription();

            this.productSubscription = {
                subscriptionAddToInitialOrder: defaultProductSubscription.subscriptionAddToInitialOrder,
                subscriptionAllMonths: defaultProductSubscription.subscriptionAllMonths,
                subscriptionApril: defaultProductSubscription.subscriptionApril,
                subscriptionAugust: defaultProductSubscription.subscriptionAugust,
                subscriptionCyclePeriod: defaultProductSubscription.subscriptionCyclePeriod || "Month",
                subscriptionDecember: defaultProductSubscription.subscriptionDecember,
                subscriptionFebruary: defaultProductSubscription.subscriptionFebruary,
                subscriptionFixedPrice: defaultProductSubscription.subscriptionFixedPrice,
                subscriptionJanuary: defaultProductSubscription.subscriptionJanuary,
                subscriptionJuly: defaultProductSubscription.subscriptionJuly,
                subscriptionJune: defaultProductSubscription.subscriptionJune,
                subscriptionMarch: defaultProductSubscription.subscriptionMarch,
                subscriptionMay: defaultProductSubscription.subscriptionMay,
                subscriptionNovember: defaultProductSubscription.subscriptionNovember,
                subscriptionOctober: defaultProductSubscription.subscriptionOctober,
                subscriptionPeriodsPerCycle: defaultProductSubscription.subscriptionPeriodsPerCycle,
                subscriptionSeptember: defaultProductSubscription.subscriptionSeptember,
                subscriptionShipViaId: defaultProductSubscription.subscriptionShipViaId,
                subscriptionTotalCycles: defaultProductSubscription.subscriptionTotalCycles
            };
        }

        protected getDefaultProductSubscription(): ProductSubscriptionDto {
            let defaultProductSubscription = null;

            if (this.currentProductSubscription) {
                return this.currentProductSubscription;
            }

            if (this.cartLine) {
                const productSubscriptionCustomPropertyName = "productSubscription";
                const productSubscriptionProperty = this.cartLine.properties[productSubscriptionCustomPropertyName];
                if (productSubscriptionProperty) {
                    defaultProductSubscription = JSON.parse(productSubscriptionProperty);
                }

                if (!defaultProductSubscription) {
                    defaultProductSubscription = this.cartLine.productSubscription;
                }
            }

            if (!defaultProductSubscription) {
                defaultProductSubscription = this.product.productSubscription;
            }

            return defaultProductSubscription;
        }

        saveProductSubscription(): void {
            this.$rootScope.$broadcast("updateProductSubscription", this.productSubscription, this.product, this.cartLine);
            this.coreService.closeModal("#popup-product-subscription");
        }

        cancelProductSubscription(): void {
            this.coreService.closeModal("#popup-product-subscription");
        }
    }

    export interface IProductSubscriptionPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class ProductSubscriptionPopupService extends base.BasePopupService<any> implements IProductSubscriptionPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-product-subscription-popup></isc-product-subscription-popup>";
        }
    }

    angular
        .module("insite")
        .controller("ProductSubscriptionPopupController", ProductSubscriptionPopupController)
        .service("productSubscriptionPopupService", ProductSubscriptionPopupService)
        .directive("iscProductSubscriptionPopup", () => ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/Catalog-ProductSubscriptionPopup",
            controller: "ProductSubscriptionPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}