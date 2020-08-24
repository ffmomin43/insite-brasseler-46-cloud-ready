var insite;
(function (insite) {
    var contactus;
    (function (contactus) {
        "use strict";
        var ContactUsController = /** @class */ (function () {
            function ContactUsController($element, $scope) {
                this.$element = $element;
                this.$scope = $scope;
                this.submitted = false;
            }
            ContactUsController.prototype.$onInit = function () {
                this.$form = this.$element.find("form");
                this.$form.removeData("validator");
                this.$form.removeData("unobtrusiveValidation");
                $.validator.unobtrusive.parse(this.$form);
            };
            ContactUsController.prototype.submit = function ($event) {
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
            ContactUsController.$inject = ["$element", "$scope"];
            return ContactUsController;
        }());
        contactus.ContactUsController = ContactUsController;
        angular
            .module("insite")
            .controller("ContactUsController", ContactUsController);
    })(contactus = insite.contactus || (insite.contactus = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.contact-us.controller.js.map