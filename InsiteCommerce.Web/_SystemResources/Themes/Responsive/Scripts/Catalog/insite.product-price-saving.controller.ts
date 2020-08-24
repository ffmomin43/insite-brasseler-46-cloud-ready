module insite.catalog {
    "use strict";

    export class ProductPriceSavingController {
        unitNetPrice: number;
        unitNetPriceDisplay: string;
        unitListPrice: number;
        unitListPriceDisplay: string;
        showSavingsAmount: boolean;
        showSavingsPercent: boolean;

        static $inject = [ "productPriceService", "settingsService" ];

        constructor(
            protected productPriceService: IProductPriceService,
            protected settingsService: core.ISettingsService) {
        }

        $onInit(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.showSavingsAmount = settingsCollection.productSettings.showSavingsAmount;
            this.showSavingsPercent = settingsCollection.productSettings.showSavingsPercent;
        }

        protected getSettingsFailed(error: any): void {
        }

        showPriceSaving(product: ProductDto): boolean {
            const unitNetPrice = this.productPriceService.getUnitNetPrice(product);
            this.unitNetPrice = unitNetPrice.price;
            this.unitNetPriceDisplay = unitNetPrice.priceDisplay;

            const unitListPrice = this.productPriceService.getUnitListPrice(product);
            this.unitListPrice = unitListPrice.price;
            this.unitListPriceDisplay = unitListPrice.priceDisplay;

            return this.unitNetPrice < this.unitListPrice;
        }

        showPriceSavingForOrderHistory(orderLine: OrderLineModel): boolean {
            if (orderLine === null) return false;

            this.unitNetPrice = orderLine.unitNetPrice;
            this.unitNetPriceDisplay = orderLine.unitNetPriceDisplay;
            this.unitListPrice = orderLine.unitListPrice;
            this.unitListPriceDisplay = orderLine.unitListPriceDisplay;

            return this.unitNetPrice < this.unitListPrice;
        }

        getSavingsAmount(): number {
            return this.unitListPrice - this.unitNetPrice;
        }

        getSavingsPercent(): number {
            return Math.round((this.unitListPrice - this.unitNetPrice) / this.unitListPrice * 100);
        }
    };

    angular
        .module("insite")
        .controller("ProductPriceSavingController", ProductPriceSavingController);
}