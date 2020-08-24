var insite;
(function (insite) {
    var email;
    (function (email) {
        "use strict";
        var BrasselerEmailSubscriptionController = /** @class */ (function () {
            function BrasselerEmailSubscriptionController($element, $scope) {
                this.$element = $element;
                this.$scope = $scope;
                this.submitted = false;
                this.init();
            }
            BrasselerEmailSubscriptionController.prototype.init = function () {
                this.$form = this.$element.find("form");
                this.$form.removeData("validator");
                this.$form.removeData("unobtrusiveValidation");
                $.validator.unobtrusive.parse(this.$form);
            };
            BrasselerEmailSubscriptionController.prototype.submit = function ($event) {
                $event.preventDefault();
                if (this.$form.valid()) {
                    var formElement = this.$form;
                    //(this.$form).ajaxPost();
                    $.ajax({
                        type: 'POST',
                        url: "/Email/SubscribeToList",
                        data: JSON.stringify({ "emailAddress": this.$form.find(".subscribe-box").val() }),
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            formElement.find(".btn-subscribe").hide();
                            formElement.find(".successMessage").show();
                        }
                    });
                }
                else {
                    return false;
                }
                return false;
            };
            BrasselerEmailSubscriptionController.$inject = ["$element", "$scope"];
            return BrasselerEmailSubscriptionController;
        }());
        email.BrasselerEmailSubscriptionController = BrasselerEmailSubscriptionController;
        angular
            .module("insite")
            .controller("BrasselerEmailSubscriptionController", BrasselerEmailSubscriptionController);
    })(email = insite.email || (insite.email = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.email-subscription.controller.js.map