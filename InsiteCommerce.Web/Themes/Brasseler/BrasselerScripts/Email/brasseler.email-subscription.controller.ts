module insite.email {
    "use strict";

    export class BrasselerEmailSubscriptionController {
        submitted = false;
        $form: JQuery;

        static $inject = ["$element", "$scope"];

        constructor(
            protected $element: ng.IRootElementService,
            protected $scope: ng.IScope) {
            this.init();
        }

        init(): void {
            this.$form = this.$element.find("form");
            this.$form.removeData("validator");
            this.$form.removeData("unobtrusiveValidation");
            $.validator.unobtrusive.parse(this.$form);
        }

        submit($event): boolean {
           
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
        }
    }

    angular
        .module("insite")
        .controller("BrasselerEmailSubscriptionController", BrasselerEmailSubscriptionController);
}