import CartModel = Insite.Cart.WebApi.V1.ApiModels.CartModel;

module insite.cart {
    export interface ICartScope extends ng.IScope {
        cart: CartModel;
        promotionCode: string;
        promotions: any;
        addressForm: ng.IFormController;
    }

    export interface IQueryStringFilter {
        status?: string;
        shipToId?: string;
        sort?: string;
    }
}