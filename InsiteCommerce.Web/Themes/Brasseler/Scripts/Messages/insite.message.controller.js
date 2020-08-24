var insite;
(function (insite) {
    var message;
    (function (message_1) {
        "use strict";
        var MessageController = /** @class */ (function () {
            function MessageController(messageService) {
                this.messageService = messageService;
                this.readCount = 0;
                this.unreadCount = 0;
                this.showRead = true;
            }
            MessageController.prototype.$onInit = function () {
                this.getMessages();
            };
            MessageController.prototype.isBlank = function (text) {
                return !text || text.trim() === "";
            };
            MessageController.prototype.getMessages = function () {
                var _this = this;
                this.messageService.getMessages().then(function (messageCollection) { _this.getMessagesCompleted(messageCollection); }, function (error) { _this.getMessagesFailed(error); });
            };
            MessageController.prototype.getMessagesCompleted = function (messageCollection) {
                var _this = this;
                this.messages = messageCollection.messages;
                this.messages.forEach(function (message) {
                    if (message.isRead) {
                        _this.readCount++;
                    }
                    else {
                        _this.unreadCount++;
                    }
                });
            };
            MessageController.prototype.getMessagesFailed = function (error) {
            };
            MessageController.prototype.switchMessageStatus = function ($event, message) {
                message.isRead = !message.isRead;
                if (message.isRead) {
                    this.readCount++;
                    this.unreadCount--;
                }
                else {
                    this.readCount--;
                    this.unreadCount++;
                }
                this.updateMessage(message);
            };
            MessageController.prototype.updateMessage = function (message) {
                var _this = this;
                this.messageService.updateMessage(message).then(function (messageResult) { _this.updateMessageCompleted(messageResult); }, function (error) { _this.updateMessageFailed(error); });
            };
            MessageController.prototype.updateMessageCompleted = function (message) {
            };
            MessageController.prototype.updateMessageFailed = function (error) {
            };
            MessageController.prototype.switchShowRead = function () {
                this.showRead = !this.showRead;
            };
            MessageController.prototype.expand = function ($event, message) {
                message.isExpand = !message.isExpand;
            };
            MessageController.$inject = ["messageService"];
            return MessageController;
        }());
        message_1.MessageController = MessageController;
        angular
            .module("insite")
            .controller("MessageController", MessageController);
    })(message = insite.message || (insite.message = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.message.controller.js.map