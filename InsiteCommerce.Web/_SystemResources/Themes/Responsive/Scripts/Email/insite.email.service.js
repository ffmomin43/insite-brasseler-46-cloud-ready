var insite;
(function (insite) {
    var email;
    (function (email) {
        "use strict";
        var EmailService = /** @class */ (function () {
            function EmailService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/email";
            }
            EmailService.prototype.tellAFriend = function (tellAFriendModel) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(this.serviceUri + "/tellafriend", tellAFriendModel), this.tellAFriendCompleted, this.tellAFriendFailed);
            };
            EmailService.prototype.tellAFriendCompleted = function (response) {
            };
            EmailService.prototype.tellAFriendFailed = function (error) {
            };
            EmailService.prototype.shareEntity = function (shareEntityModel, url) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.post(url, shareEntityModel), this.shareEntityCompleted, this.shareEntityFailed);
            };
            EmailService.prototype.shareEntityCompleted = function (response) {
            };
            EmailService.prototype.shareEntityFailed = function (error) {
            };
            EmailService.$inject = ["$http", "httpWrapperService"];
            return EmailService;
        }());
        email.EmailService = EmailService;
        angular
            .module("insite")
            .service("emailService", EmailService);
    })(email = insite.email || (insite.email = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.email.service.js.map