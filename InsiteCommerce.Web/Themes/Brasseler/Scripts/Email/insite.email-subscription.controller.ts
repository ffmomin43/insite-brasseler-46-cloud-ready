module insite.email {
    "use strict";

    export class EmailSubscriptionController {
        submitted = false;
        $form: JQuery;

        static $inject = ["$element", "$scope"];

        constructor(
            protected $element: ng.IRootElementService,
            protected $scope: ng.IScope) {
        }

        $onInit(): void {
            this.$form = this.$element.find("form");
            this.$form.removeData("validator");
            this.$form.removeData("unobtrusiveValidation");
            $.validator.unobtrusive.parse(this.$form);
        }

        submit($event): boolean {
            $event.preventDefault();
            if (!this.$form.valid()) {
                return false;
            }

            (this.$form as any).ajaxPost(() => {
                this.submitted = true;
                this.$scope.$apply();
            });

            return false;
        }
    }

    angular
        .module("insite")
        .controller("EmailSubscriptionController", EmailSubscriptionController);
}