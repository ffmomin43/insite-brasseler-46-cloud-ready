module insite.core {
    "use strict";

    export interface ISpinnerService {
        register(data: any): void;
        show(name?: string, infinite?: boolean): void;
        hide(name?: string): void;
        showGroup(group: string): void;
        hideGroup(group: string): void;
        showAll(): void;
        hideAll(): void;
    }

    export class SpinnerService implements ISpinnerService {
        static spinners = {};

        register(data: any): void {
            if (!data.hasOwnProperty("name")) {
                throw new Error("Spinner must specify a name when registering with the spinner service.");
            }

            SpinnerService.spinners[data.name] = data;
        }

        show(name: string = "mainLayout", infinite: boolean = false): void {
            const spinner = SpinnerService.spinners[name];
            if (!spinner) {
                return;
            }

            spinner.infinite = infinite;
            spinner.show();
        }

        hide(name: string = "mainLayout"): void {
            const spinner = SpinnerService.spinners[name];
            if (!spinner) {
                return;
            }

            spinner.hide();
        }

        showGroup(group: string): void {
            let groupExists = false;
            for (let name in SpinnerService.spinners) {
                if (SpinnerService.spinners.hasOwnProperty(name)) {
                    const spinner = SpinnerService.spinners[name];
                    if (spinner.group === group) {
                        spinner.show();
                        groupExists = true;
                    }
                }
            }

            if (!groupExists) {
                return;
            }
        }

        hideGroup(group: string): void {
            let groupExists = false;
            for (let name in SpinnerService.spinners) {
                if (SpinnerService.spinners.hasOwnProperty(name)) {
                    const spinner = SpinnerService.spinners[name];
                    if (spinner.group === group) {
                        spinner.hide();
                        groupExists = true;
                    }
                }
            }

            if (!groupExists) {
                return;
            }
        }

        showAll(): void {
            for (let name in SpinnerService.spinners) {
                if (SpinnerService.spinners.hasOwnProperty(name)) {
                    SpinnerService.spinners[name].show();
                }
            }
        }

        hideAll(): void {
            for (let name in SpinnerService.spinners) {
                if (SpinnerService.spinners.hasOwnProperty(name)) {
                    if (!SpinnerService.spinners[name].infinite) {
                        SpinnerService.spinners[name].hide();
                    }
                }
            }
        }
    }

    angular
        .module("insite")
        .service("spinnerService", SpinnerService);
}