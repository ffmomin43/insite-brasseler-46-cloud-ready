var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var QuoteMessagesController = /** @class */ (function () {
            function QuoteMessagesController($scope, rfqService, queryString) {
                this.$scope = $scope;
                this.rfqService = rfqService;
                this.queryString = queryString;
            }
            QuoteMessagesController.prototype.$onInit = function () {
            };
            QuoteMessagesController.prototype.sendMessage = function () {
                var _this = this;
                var parameter = {
                    customerOrderId: this.$scope.quote.id,
                    message: this.rfqMessage,
                    toUserProfileName: this.$scope.quote.initiatedByUserName,
                    subject: "Quote " + this.$scope.quote.orderNumber + " communication",
                    process: "RFQ"
                };
                this.rfqService.submitRfqMessage(parameter).then(function (rfqMessage) { _this.submitRfqMessageCompleted(rfqMessage); }, function (error) { _this.submitRfqMessageFailed(error); });
            };
            QuoteMessagesController.prototype.submitRfqMessageCompleted = function (rfqMessage) {
                this.$scope.quote.messageCollection.push(rfqMessage);
                this.$scope.$broadcast("messagesloaded");
                this.rfqMessage = "";
            };
            QuoteMessagesController.prototype.submitRfqMessageFailed = function (error) {
            };
            QuoteMessagesController.$inject = ["$scope", "rfqService", "queryString"];
            return QuoteMessagesController;
        }());
        rfq.QuoteMessagesController = QuoteMessagesController;
        angular
            .module("insite")
            .controller("QuoteMessagesController", QuoteMessagesController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quote-messages.controller.js.map