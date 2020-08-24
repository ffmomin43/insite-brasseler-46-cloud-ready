module insite.message {
    "use strict";

    export class MessageController {
        messages: MessageModel[];
        readCount = 0;
        unreadCount = 0;
        showRead = true;

        static $inject = ["messageService"];

        constructor(protected messageService: message.IMessageService) {
        }

        $onInit(): void {
            this.getMessages();
        }

        isBlank(text: string): boolean {
            return !text || text.trim() === "";
        }

        protected getMessages(): void {
            this.messageService.getMessages().then(
                (messageCollection: MessageCollectionModel) => { this.getMessagesCompleted(messageCollection); },
                (error: any) => { this.getMessagesFailed(error); });
        }

        protected getMessagesCompleted(messageCollection: MessageCollectionModel): void {
            this.messages = messageCollection.messages;

            this.messages.forEach((message: MessageModel) => {
                if (message.isRead) {
                    this.readCount++;
                } else {
                    this.unreadCount++;
                }
            });
        }

        protected getMessagesFailed(error: any): void {
        }

        switchMessageStatus($event, message: MessageModel): void {
            message.isRead = !message.isRead;

            if (message.isRead) {
                this.readCount++;
                this.unreadCount--;
            } else {
                this.readCount--;
                this.unreadCount++;
            }

            this.updateMessage(message);
        }

        protected updateMessage(message: MessageModel): void {
            this.messageService.updateMessage(message).then(
                (messageResult: MessageModel) => { this.updateMessageCompleted(messageResult); },
                (error: any) => { this.updateMessageFailed(error); });
        }

        protected updateMessageCompleted(message: MessageModel): void {
        }

        protected updateMessageFailed(error: any): void {
        }

        switchShowRead(): void {
            this.showRead = !this.showRead;
        }

        expand($event, message): void {
            message.isExpand = !message.isExpand;
        }
    }

    angular
        .module("insite")
        .controller("MessageController", MessageController);
}