module insite.account {
    "use strict";

    export class UnsubscribeFromCartRemindersController {
        unsubscribeError: string;

        static $inject = ["queryString", "sessionService"];

        constructor(protected queryString: common.IQueryStringService, protected sessionService: account.ISessionService) {
        }

        $onInit(): void {
            const parameters: ICartRemindersUnsubscribeParameters = {
                username: this.queryString.get("username"),
                unsubscribeToken: this.queryString.get("unsubscribeToken")
            };
            this.sessionService.unsubscribeFromCartReminders(parameters).then(
                (session: SessionModel) => { this.unsubscribeFromCartRemindersCompleted(session); },
                (error: any) => { this.unsubscribeFromCartRemindersFailed(error); });
        }

        protected unsubscribeFromCartRemindersCompleted(session: SessionModel): void {
        }

        protected unsubscribeFromCartRemindersFailed(error: any): void {
            this.unsubscribeError = error.message;
        }
    }

    angular
        .module("insite")
        .controller("UnsubscribeFromCartRemindersController", UnsubscribeFromCartRemindersController);
}