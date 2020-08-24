import PromotionModel = Insite.Promotions.WebApi.V1.ApiModels.PromotionModel;
import PromotionCollectionModel = Insite.Promotions.WebApi.V1.ApiModels.PromotionCollectionModel;

module insite.promotions {
    "use strict";

    export interface IPromotionService {
        getCartPromotions(cartId: string): ng.IPromise<PromotionCollectionModel>;
        applyCartPromotion(cartId: string, promotionCode: string): ng.IPromise<PromotionModel>;
    }

    export class PromotionService implements IPromotionService {
        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getCartPromotions(cartId: string): ng.IPromise<PromotionCollectionModel> {
            const promotionsUri = `/api/v1/carts/${cartId}/promotions`;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(promotionsUri),
                this.getCartPromotionCompleted,
                this.getCartPromotionFailed
            );
        }

        protected getCartPromotionCompleted(response: ng.IHttpPromiseCallbackArg<PromotionModel>): void {
        }

        protected getCartPromotionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        applyCartPromotion(cartId: string, promotionCode: string): ng.IPromise<PromotionModel> {
            const promotionsUri = `/api/v1/carts/${cartId}/promotions`;
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(promotionsUri, { promotionCode: promotionCode }),
                this.applyCartPromotionCompleted,
                this.applyCartPromotionFailed
            );
        }

        protected applyCartPromotionCompleted(response: ng.IHttpPromiseCallbackArg<PromotionModel>): void {
        }

        protected applyCartPromotionFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("promotionService", PromotionService);
}