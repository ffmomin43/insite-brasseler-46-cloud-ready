import TellAFriendModel = Insite.Email.WebApi.V1.ApiModels.TellAFriendModel;
import ShareEntityModel = Insite.Email.WebApi.V1.ApiModels.ShareEntityModel;

module insite.email {
    "use strict";

    export interface IEmailService {
        tellAFriend(tellAFriendModel: TellAFriendModel): ng.IPromise<TellAFriendModel>;
        shareEntity(shareEntityModel: ShareEntityModel, url: string): ng.IPromise<ShareEntityModel>;
    }

    export class EmailService implements IEmailService {
        expand: string;
        serviceUri = "/api/v1/email";

        static $inject = ["$http", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        tellAFriend(tellAFriendModel: TellAFriendModel): ng.IPromise<TellAFriendModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(`${this.serviceUri}/tellafriend`, tellAFriendModel),
                this.tellAFriendCompleted,
                this.tellAFriendFailed
            );
        }

        protected tellAFriendCompleted(response: ng.IHttpPromiseCallbackArg<TellAFriendModel>): void {
        }

        protected tellAFriendFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        shareEntity(shareEntityModel: ShareEntityModel, url: string): ng.IPromise<ShareEntityModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(url, shareEntityModel),
                this.shareEntityCompleted,
                this.shareEntityFailed
            );
        }

        protected shareEntityCompleted(response: ng.IHttpPromiseCallbackArg<ShareEntityModel>): void {
        }

        protected shareEntityFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("emailService", EmailService);
}