// using namespace because of this issue http://stackoverflow.com/questions/35226754/inherited-class-from-another-module-in-typescript
var base;
(function (base) {
    "use strict";
    var BasePopupService = /** @class */ (function () {
        function BasePopupService($rootScope, $compile, spinnerService) {
            this.$rootScope = $rootScope;
            this.$compile = $compile;
            this.spinnerService = spinnerService;
            this.element = null;
            this.displayOnRegister = false;
            this.dataToDisplayOnRegister = null;
            this.init();
        }
        BasePopupService.prototype.init = function () {
        };
        BasePopupService.prototype.display = function (data) {
            if (this.element === null) {
                this.spinnerService.show();
                this.displayOnRegister = true;
                this.dataToDisplayOnRegister = data;
                this.element = angular.element(this.getDirectiveHtml());
                $("body").append(this.element);
                this.$compile(this.element)(this.$rootScope.$new());
            }
            else if (this.displayFunction) {
                this.displayFunction(data);
            }
        };
        BasePopupService.prototype.registerDisplayFunction = function (displayFunction) {
            this.displayFunction = displayFunction;
            if (this.displayOnRegister) {
                this.spinnerService.hide();
                this.displayFunction(this.dataToDisplayOnRegister);
                this.displayOnRegister = false;
                this.dataToDisplayOnRegister = null;
            }
        };
        BasePopupService.$inject = ["$rootScope", "$compile", "spinnerService"];
        return BasePopupService;
    }());
    base.BasePopupService = BasePopupService;
})(base || (base = {}));
//# sourceMappingURL=insite.base-popup.service.js.map