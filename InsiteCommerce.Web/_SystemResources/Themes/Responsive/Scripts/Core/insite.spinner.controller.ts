module insite.core {
    "use strict";

    export class SpinnerController {
        name: string;
        group: string;
        show: boolean;
        size: string;
        replace = false;
        register: boolean;

        static $inject = ["spinnerService", "$element"];

        constructor(
            protected spinnerService: core.ISpinnerService,
            protected $element: ng.IRootElementService) {
        }

        $onInit(): void {
            this.show = this.show && this.show.toString() === "true";
            // Register with the spinner service by default if not specified.
            if (!this.hasOwnProperty("register")) {
                this.register = true;
            } else {
                this.register = !!this.register;
            }

            if (!this.hasOwnProperty("size")) {
                this.size = "fullContent";
            }

            // Declare a mini-API to hand off to our service so the service
            // doesn't have a direct reference to this directive's scope.
            const api = {
                name: this.name,
                group: this.group,
                show: () => {
                    this.show = true;
                    setTimeout(this.alignSpinner);
                },
                hide: () => {
                    this.show = false;
                },
                toggle: () => {
                    this.show = !this.show;
                }
            };

            if (this.register) {
                this.spinnerService.register(api);
            }

            this.alignSpinner = this.alignSpinner.bind(this);
        }

        private alignSpinner(): void {
            const bg = this.$element.find(".loader-bg")[0];
            const bgOffset = bg.getBoundingClientRect();
            const loader = this.$element.find(".loader")[0];
            if (bgOffset.top < 0 || bgOffset.bottom > window.innerHeight) {
                loader.style.top = `${(window.innerHeight - bgOffset.top) / 2}px`;
            } else {
                loader.style.top = `calc(50% - ${loader.clientHeight}px)`;
            }
        }
    }

    angular
        .module("insite")
        .controller("SpinnerController", SpinnerController);
}