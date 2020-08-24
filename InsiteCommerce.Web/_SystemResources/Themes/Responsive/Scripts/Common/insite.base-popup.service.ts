// using namespace because of this issue http://stackoverflow.com/questions/35226754/inherited-class-from-another-module-in-typescript
namespace base {
    "use strict";

    export abstract class BasePopupService<T> {
        protected abstract getDirectiveHtml(): string;
        element: ng.IAugmentedJQuery = null;
        displayFunction: (data: any) => void;
        displayOnRegister = false;
        dataToDisplayOnRegister: any = null;

        static $inject = ["$rootScope", "$compile", "spinnerService"];

        constructor(protected $rootScope: ng.IRootScopeService, protected $compile: ng.ICompileService, protected spinnerService: insite.core.ISpinnerService) {
            this.init();
        }

        init(): void {
        }

        display(data: T): void {
            if (this.element === null) {
                this.spinnerService.show();
                this.displayOnRegister = true;
                this.dataToDisplayOnRegister = data;

                this.element = angular.element(this.getDirectiveHtml());
                $("body").append(this.element);
                this.$compile(this.element)(this.$rootScope.$new());
            } else if (this.displayFunction) {
                this.displayFunction(data);
            }
        }

        registerDisplayFunction(displayFunction: (data: T) => void): void {
            this.displayFunction = displayFunction;
            if (this.displayOnRegister) {
                this.spinnerService.hide();
                this.displayFunction(this.dataToDisplayOnRegister);
                this.displayOnRegister = false;
                this.dataToDisplayOnRegister = null;
            }
        }
    }
}