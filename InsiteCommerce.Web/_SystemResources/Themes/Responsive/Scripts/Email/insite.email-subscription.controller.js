var insite;
(function (insite) {
    var email;
    (function (email) {
        "use strict";
        var EmailSubscriptionController = /** @class */ (function () {
            function EmailSubscriptionController($element, $scope) {
                this.$element = $element;
                this.$scope = $scope;
                this.submitted = false;
            }
            EmailSubscriptionController.prototype.$onInit = function () {
                this.$form = this.$element.find("form");
                this.$form.removeData("validator");
                this.$form.removeData("unobtrusiveValidation");
                $.validator.unobtrusive.parse(this.$form);
            };
            EmailSubscriptionController.prototype.submit = function ($event) {
                var _this = this;
                $event.preventDefault();
                if (!this.$form.valid()) {
                    return false;
                }
                this.$form.ajaxPost(function () {
                    _this.submitted = true;
                    _this.$scope.$apply();
                });
                return false;
            };
            EmailSubscriptionController.$inject = ["$element", "$scope"];
            return EmailSubscriptionController;
        }());
        email.EmailSubscriptionController = EmailSubscriptionController;
        angular
            .module("insite")
            .controller("EmailSubscriptionController", EmailSubscriptionController);
    })(email = insite.email || (insite.email = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.email-subscription.controller.js.map