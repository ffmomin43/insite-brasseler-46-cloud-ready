import BreakPriceDto = Insite.Core.Plugins.Pricing.BreakPriceDto;

module insite.catalog {
    "use strict";

    export interface IProductPriceService {
        getUnitNetPrice(product: ProductDto): IPriceModel;
        getUnitListPrice(product: ProductDto): IPriceModel;
    }

    export interface IPriceModel {
        price: number;
        priceDisplay: string;
    }

    export class ProductPriceService implements IProductPriceService {
        getUnitNetPrice(product: ProductDto): IPriceModel {
            if (product.pricing.requiresRealTimePrice) {
                return { price: 0, priceDisplay: `${product.currencySymbol ? product.currencySymbol : ""}<span class='price-loading-spinner'></span>` };
            }

            if (product.isConfigured || product.isFixedConfiguration) {
                const price = this.getPrice(null, product.pricing.unitNetPrice, product.pricing.unitNetPriceDisplay, product.qtyOrdered);
                return { price: price.price, priceDisplay: price.priceDisplay } as IPriceModel;
            }

            const price = this.getPrice(product.pricing.unitRegularBreakPrices, product.pricing.unitNetPrice, product.pricing.unitNetPriceDisplay, product.qtyOrdered);
            return { price: price.price, priceDisplay: price.priceDisplay } as IPriceModel;
        }

        getUnitListPrice(product: ProductDto): IPriceModel {
            const price = this.getPrice(product.pricing.unitListBreakPrices, product.pricing.unitListPrice, product.pricing.unitListPriceDisplay, product.qtyOrdered);
            return { price: price.price, priceDisplay: price.priceDisplay } as IPriceModel;
        }

        protected getPrice(breaks: BreakPriceDto[], price: number, priceToDisplay: string, qty: any): IPriceModel {
            qty = !qty || qty === "0" ? 1 : qty;
            if (this.conditionBreakPrice(breaks, qty)) {
                return { price: price, priceDisplay: priceToDisplay } as IPriceModel;
            }

            const breakPrice = this.getBreakPrice(breaks, qty);
            if (breakPrice && (price < breakPrice.breakPrice)) {
                return { price: price, priceDisplay: priceToDisplay } as IPriceModel;
            }

            return { price: breakPrice.breakPrice, priceDisplay: breakPrice.breakPriceDisplay } as IPriceModel;
        }

        protected conditionBreakPrice(breaks: BreakPriceDto[], count: number): boolean {
            return !breaks || breaks.length === 0 || count === 0;
        }

        protected getBreakPrice(breaks: BreakPriceDto[], count: number): BreakPriceDto {
            if (!breaks) {
                return null;
            }

            const copyBreaks = breaks.slice();
            copyBreaks.sort((a, b) => { return b.breakQty - a.breakQty; });
            for (let i = 0; i < copyBreaks.length; i++) {
                if (copyBreaks[i].breakQty <= count) {
                    return copyBreaks[i];
                }
            }

            return copyBreaks[copyBreaks.length - 1];
        }
    }

    angular
        .module("insite")
        .service("productPriceService", ProductPriceService);
}