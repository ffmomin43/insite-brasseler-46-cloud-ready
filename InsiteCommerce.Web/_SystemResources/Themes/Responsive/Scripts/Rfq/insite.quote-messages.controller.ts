module insite.rfq {
    "use strict";
    import MessageParameter = Insite.Message.WebApi.V1.ApiModels.MessageParameter;
    import QuoteModel = Insite.Rfq.WebApi.V1.ApiModels.QuoteModel;

    export class QuoteMessagesController {
        quote: QuoteModel;
        rfqMessage: string;

        static $inject = ["$scope", "rfqService", "queryString"];

        constructor(
            protected $scope: ng.IScope,
            protected rfqService: rfq.IRfqService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
        }

        sendMessage(): any {
            const parameter = {
                customerOrderId: (<any>this.$scope).quote.id as System.Guid,
                message: this.rfqMessage,
                toUserProfileName: (this.$scope as any).quote.initiatedByUserName,
                subject: `Quote ${(this.$scope as any).quote.orderNumber} communication`,
                process: "RFQ"
            } as MessageParameter;

            this.rfqService.submitRfqMessage(parameter).then(
                (rfqMessage: MessageModel) => { this.submitRfqMessageCompleted(rfqMessage); },
                (error: any) => { this.submitRfqMessageFailed(error); });
        }

        protected submitRfqMessageCompleted(rfqMessage: MessageModel): void {
            (this.$scope as any).quote.messageCollection.push(rfqMessage);
            this.$scope.$broadcast("messagesloaded");
            this.rfqMessage = "";
        }

        protected submitRfqMessageFailed(error: any): void {
        }
    }

    angular
        .module("insite")
        .controller("QuoteMessagesController", QuoteMessagesController);
}