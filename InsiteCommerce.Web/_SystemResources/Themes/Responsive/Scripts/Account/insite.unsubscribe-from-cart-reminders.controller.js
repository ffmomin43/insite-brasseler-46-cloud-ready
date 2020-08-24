var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        var UnsubscribeFromCartRemindersController = /** @class */ (function () {
            function UnsubscribeFromCartRemindersController(queryString, sessionService) {
                this.queryString = queryString;
                this.sessionService = sessionService;
            }
            UnsubscribeFromCartRemindersController.prototype.$onInit = function () {
                var _this = this;
                var parameters = {
                    username: this.queryString.get("username"),
                    unsubscribeToken: this.queryString.get("unsubscribeToken")
                };
                this.sessionService.unsubscribeFromCartReminders(parameters).then(function (session) { _this.unsubscribeFromCartRemindersCompleted(session); }, function (error) { _this.unsubscribeFromCartRemindersFailed(error); });
            };
            UnsubscribeFromCartRemindersController.prototype.unsubscribeFromCartRemindersCompleted = function (session) {
            };
            UnsubscribeFromCartRemindersController.prototype.unsubscribeFromCartRemindersFailed = function (error) {
                this.unsubscribeError = error.message;
            };
            UnsubscribeFromCartRemindersController.$inject = ["queryString", "sessionService"];
            return UnsubscribeFromCartRemindersController;
        }());
        account.UnsubscribeFromCartRemindersController = UnsubscribeFromCartRemindersController;
        angular
            .module("insite")
            .controller("UnsubscribeFromCartRemindersController", UnsubscribeFromCartRemindersController);
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.unsubscribe-from-cart-reminders.controller.js.map