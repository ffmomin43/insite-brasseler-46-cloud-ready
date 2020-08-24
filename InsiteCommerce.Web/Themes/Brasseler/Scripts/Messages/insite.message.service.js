var insite;
(function (insite) {
    var message;
    (function (message_1) {
        "use strict";
        var MessageService = /** @class */ (function () {
            function MessageService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.messageServiceUri = "/api/v1/messages/";
            }
            MessageService.prototype.getMessages = function () {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.messageServiceUri), this.getMessagesCompleted, this.getMessagesFailed);
            };
            MessageService.prototype.getMessagesCompleted = function (response) {
            };
            MessageService.prototype.getMessagesFailed = function (error) {
            };
            MessageService.prototype.updateMessage = function (message) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: message.uri, data: message }), this.updateMessageCompleted, this.updateMessageFailed);
            };
            MessageService.prototype.updateMessageCompleted = function (response) {
            };
            MessageService.prototype.updateMessageFailed = function (error) {
            };
            MessageService.$inject = ["$http", "httpWrapperService"];
            return MessageService;
        }());
        message_1.MessageService = MessageService;
        angular
            .module("insite")
            .service("messageService", MessageService);
    })(message = insite.message || (insite.message = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.message.service.js.map