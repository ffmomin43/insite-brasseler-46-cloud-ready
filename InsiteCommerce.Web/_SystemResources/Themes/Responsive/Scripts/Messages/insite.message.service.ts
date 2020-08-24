import MessageCollectionModel = Insite.Message.WebApi.V1.ApiModels.MessageCollectionModel;
import MessageModel = Insite.Message.WebApi.V1.ApiModels.MessageModel;

module insite.message {
    "use strict";

    export interface IMessageService {
        getMessages(): ng.IPromise<MessageCollectionModel>;
        updateMessage(message: MessageModel): ng.IPromise<MessageModel>;
    }

    export class MessageService implements IMessageService {
        messageServiceUri = "/api/v1/messages/";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getMessages(): ng.IPromise<MessageCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.get(this.messageServiceUri),
                this.getMessagesCompleted,
                this.getMessagesFailed);
        }

        protected getMessagesCompleted(response: ng.IHttpPromiseCallbackArg<MessageCollectionModel>): void {
        }

        protected getMessagesFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateMessage(message: MessageModel): ng.IPromise<MessageModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: message.uri, data: message }),
                this.updateMessageCompleted,
                this.updateMessageFailed);
        }

        protected updateMessageCompleted(response: ng.IHttpPromiseCallbackArg<MessageModel>): void {
        }

        protected updateMessageFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("messageService", MessageService);
}