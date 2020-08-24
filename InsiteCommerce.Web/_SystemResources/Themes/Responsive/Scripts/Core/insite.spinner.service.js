var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var SpinnerService = /** @class */ (function () {
            function SpinnerService() {
            }
            SpinnerService.prototype.register = function (data) {
                if (!data.hasOwnProperty("name")) {
                    throw new Error("Spinner must specify a name when registering with the spinner service.");
                }
                SpinnerService.spinners[data.name] = data;
            };
            SpinnerService.prototype.show = function (name, infinite) {
                if (name === void 0) { name = "mainLayout"; }
                if (infinite === void 0) { infinite = false; }
                var spinner = SpinnerService.spinners[name];
                if (!spinner) {
                    return;
                }
                spinner.infinite = infinite;
                spinner.show();
            };
            SpinnerService.prototype.hide = function (name) {
                if (name === void 0) { name = "mainLayout"; }
                var spinner = SpinnerService.spinners[name];
                if (!spinner) {
                    return;
                }
                spinner.hide();
            };
            SpinnerService.prototype.showGroup = function (group) {
                var groupExists = false;
                for (var name_1 in SpinnerService.spinners) {
                    if (SpinnerService.spinners.hasOwnProperty(name_1)) {
                        var spinner = SpinnerService.spinners[name_1];
                        if (spinner.group === group) {
                            spinner.show();
                            groupExists = true;
                        }
                    }
                }
                if (!groupExists) {
                    return;
                }
            };
            SpinnerService.prototype.hideGroup = function (group) {
                var groupExists = false;
                for (var name_2 in SpinnerService.spinners) {
                    if (SpinnerService.spinners.hasOwnProperty(name_2)) {
                        var spinner = SpinnerService.spinners[name_2];
                        if (spinner.group === group) {
                            spinner.hide();
                            groupExists = true;
                        }
                    }
                }
                if (!groupExists) {
                    return;
                }
            };
            SpinnerService.prototype.showAll = function () {
                for (var name_3 in SpinnerService.spinners) {
                    if (SpinnerService.spinners.hasOwnProperty(name_3)) {
                        SpinnerService.spinners[name_3].show();
                    }
                }
            };
            SpinnerService.prototype.hideAll = function () {
                for (var name_4 in SpinnerService.spinners) {
                    if (SpinnerService.spinners.hasOwnProperty(name_4)) {
                        if (!SpinnerService.spinners[name_4].infinite) {
                            SpinnerService.spinners[name_4].hide();
                        }
                    }
                }
            };
            SpinnerService.spinners = {};
            return SpinnerService;
        }());
        core.SpinnerService = SpinnerService;
        angular
            .module("insite")
            .service("spinnerService", SpinnerService);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.spinner.service.js.map