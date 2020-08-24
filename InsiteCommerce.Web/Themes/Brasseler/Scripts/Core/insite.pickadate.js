// A directive wrapper for pickadate.js
// value gets set to a iso formatted non localized date or null, which webapi will derserialize correctly.
// usage:  <input type="text" value="" class="datepicker txt" pick-a-date="vm.fromDate" min-date="vm.mindate" update="vm.updateCallback()"  />
var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            .directive("iscPickADate", ["$filter", function ($filter) { return ({
                restrict: "A",
                scope: {
                    iscPickADate: "=",
                    minDate: "=",
                    maxDate: "=",
                    pickADateOptions: "=",
                    update: "&" // set this attribute to call a parent scope method when the date is updated
                },
                link: function (scope, element) {
                    var pad = function (n) {
                        return (n < 10) ? ("0" + n) : n;
                    };
                    var options = $.extend(scope.pickADateOptions || {}, {
                        onSet: function (e) {
                            if (scope.$$phase || scope.$root.$$phase) { // we are coming from $watch or link setup
                                return;
                            }
                            var select = element.pickadate("picker").get("select"); // selected date
                            scope.$apply(function () {
                                if (e.hasOwnProperty("clear")) {
                                    scope.innerDate = null;
                                    scope.iscPickADate = "";
                                    if (scope.update) {
                                        scope.update();
                                    }
                                    return;
                                }
                                if (select && select.obj) {
                                    // pass the pick-a-date selection to the scope variable
                                    scope.innerDate = select.obj;
                                    scope.iscPickADate = select.obj.getFullYear() + "-" + pad(select.obj.getMonth() + 1) + "-" + pad(select.obj.getDate());
                                    element.prop("value", $filter("date")(select.obj, "shortDate"));
                                }
                            });
                        },
                        onClose: function () {
                            element.blur();
                            if (scope.update) {
                                scope.update();
                            }
                        },
                        selectYears: true
                    });
                    element.pickadate(options);
                    element.pickadate("picker").set("min", scope.minDate ? scope.minDate : false);
                    element.pickadate("picker").set("max", scope.maxDate ? scope.maxDate : false);
                    // add calendar icon to the datepicker input
                    var calendarIcon = $("<i class='icon-calendar'></i>");
                    element.wrap("<div class='date-picker-calendar'></div>");
                    element.before(calendarIcon);
                    // this watch is needed to update the UI when the scope variable pickADate is updated external (initial values and clearing)
                    // override the default pickadate formatting with a regular angular filtered date
                    scope.$watch("iscPickADate", function (newValue, oldValue, currentScope) {
                        if (!newValue) {
                            element.prop("value", "");
                        }
                        else {
                            if (newValue.indexOf("T") === -1 && newValue.indexOf("AM") === -1 && newValue.indexOf("PM") === -1) {
                                newValue += "T00:00:00";
                            }
                            // allow set up initial date from parent scope
                            var date = new Date(currentScope.innerDate || newValue);
                            element.pickadate("picker").set("select", date);
                            element.prop("value", $filter("date")(date, "shortDate"));
                        }
                    }, true);
                    scope.$watch("minDate", function (newValue) {
                        element.pickadate("picker").set("min", newValue ? newValue : false);
                    }, true);
                    scope.$watch("maxDate", function (newValue) {
                        element.pickadate("picker").set("max", newValue ? newValue : false);
                    }, true);
                }
            }); }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.pickadate.js.map