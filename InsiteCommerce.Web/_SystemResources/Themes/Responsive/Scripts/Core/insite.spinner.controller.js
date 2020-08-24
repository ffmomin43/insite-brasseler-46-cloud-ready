var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var SpinnerController = /** @class */ (function () {
            function SpinnerController(spinnerService, $element) {
                this.spinnerService = spinnerService;
                this.$element = $element;
                this.replace = false;
            }
            SpinnerController.prototype.$onInit = function () {
                var _this = this;
                this.show = this.show && this.show.toString() === "true";
                // Register with the spinner service by default if not specified.
                if (!this.hasOwnProperty("register")) {
                    this.register = true;
                }
                else {
                    this.register = !!this.register;
                }
                if (!this.hasOwnProperty("size")) {
                    this.size = "fullContent";
                }
                // Declare a mini-API to hand off to our service so the service
                // doesn't have a direct reference to this directive's scope.
                var api = {
                    name: this.name,
                    group: this.group,
                    show: function () {
                        _this.show = true;
                        setTimeout(_this.alignSpinner);
                    },
                    hide: function () {
                        _this.show = false;
                    },
                    toggle: function () {
                        _this.show = !_this.show;
                    }
                };
                if (this.register) {
                    this.spinnerService.register(api);
                }
                this.alignSpinner = this.alignSpinner.bind(this);
            };
            SpinnerController.prototype.alignSpinner = function () {
                var bg = this.$element.find(".loader-bg")[0];
                var bgOffset = bg.getBoundingClientRect();
                var loader = this.$element.find(".loader")[0];
                if (bgOffset.top < 0 || bgOffset.bottom > window.innerHeight) {
                    loader.style.top = (window.innerHeight - bgOffset.top) / 2 + "px";
                }
                else {
                    loader.style.top = "calc(50% - " + loader.clientHeight + "px)";
                }
            };
            SpinnerController.$inject = ["spinnerService", "$element"];
            return SpinnerController;
        }());
        core.SpinnerController = SpinnerController;
        angular
            .module("insite")
            .controller("SpinnerController", SpinnerController);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.spinner.controller.js.map