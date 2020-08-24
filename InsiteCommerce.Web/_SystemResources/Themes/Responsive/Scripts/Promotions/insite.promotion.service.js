var insite;
(function (insite) {
    var promotions;
    (function (promotions) {
        "use strict";
        var PromotionService = /** @class */ (function () {
            function PromotionService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
            }
            PromotionService.prototype.getCartPromotions = function (cartId) {
                var promotionsUri = "/api/v1/carts/" + cartId + "/promotions";
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(promotionsUri), this.getCartPromotionCompleted, this.getCartPromotionFailed);
            };
            PromotionService.prototype.getCartPromotionCompleted = function (response) {
            };
            PromotionService.prototype.getCartPromotionFailed = function (error) {
            };
            PromotionService.prototype.applyCartPromotion = function (cartId, promotionCode) {
                var promotionsUri = "/api/v1/carts/" + cartId + "/promotions";
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(promotionsUri, { promotionCode: promotionCode }), this.applyCartPromotionCompleted, this.applyCartPromotionFailed);
            };
            PromotionService.prototype.applyCartPromotionCompleted = function (response) {
            };
            PromotionService.prototype.applyCartPromotionFailed = function (error) {
            };
            PromotionService.$inject = ["$http", "httpWrapperService"];
            return PromotionService;
        }());
        promotions.PromotionService = PromotionService;
        angular
            .module("insite")
            .service("promotionService", PromotionService);
    })(promotions = insite.promotions || (insite.promotions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.promotion.service.js.map