// A directive wrapper for pickadate.js
// value gets set to a iso formatted non localized date or null, which webapi will derserialize correctly.
// usage:  <input type="text" value="" class="datepicker txt" pick-a-date="vm.fromDate" min-date="vm.mindate" update="vm.updateCallback()"  />

module insite.core {
    "use strict";

    export interface IPickADateScope extends ng.IScope {
        iscPickADate: string;
        minDate: Date;
        maxDate: Date;
        pickADateOptions: {};
        update: () => void;
        innerDate: Date;
    }

    export interface IPickADateElement extends ng.IAugmentedJQuery {
        pickadate: (name: string) => any;
    }

    angular
        .module("insite")
        .directive("iscPickADate", ["$filter", ($filter: ng.IFilterService) => ({
            restrict: "A",
            scope: {
                iscPickADate: "=", // iso formatted date string returned to the parent scope
                minDate: "=",
                maxDate: "=",
                pickADateOptions: "=", // options to pass through to the pick-a-date control
                update: "&" // set this attribute to call a parent scope method when the date is updated
            },
            link: (scope: IPickADateScope, element: IPickADateElement) => {
                let pad = (n: number) => {
                    return (n < 10) ? (`0${n}`) : n;
                };
                const options = $.extend(scope.pickADateOptions || {}, {
                    onSet: e => {
                        if (scope.$$phase || scope.$root.$$phase) { // we are coming from $watch or link setup
                            return;
                        }
                        const select = element.pickadate("picker").get("select"); // selected date
                        scope.$apply(() => {
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
                                scope.iscPickADate = `${select.obj.getFullYear()}-${pad(select.obj.getMonth() + 1)}-${pad(select.obj.getDate())}`;
                                element.prop("value", $filter("date")(select.obj, "shortDate"));
                            }
                        });
                    },
                    onClose: () => {
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
                const calendarIcon = $("<i class='icon-calendar'></i>");
                element.wrap("<div class='date-picker-calendar'></div>");
                element.before(calendarIcon);

                // this watch is needed to update the UI when the scope variable pickADate is updated external (initial values and clearing)
                // override the default pickadate formatting with a regular angular filtered date
                scope.$watch("iscPickADate", (newValue: string, oldValue, currentScope) => {
                    if (!newValue) {
                        element.prop("value", "");
                    } else {
                        if (newValue.indexOf("T") === -1 && newValue.indexOf("AM") === -1 && newValue.indexOf("PM") === -1) {
                            newValue += "T00:00:00";
                        }

                        // allow set up initial date from parent scope
                        const date = new Date(currentScope.innerDate || newValue);
                        element.pickadate("picker").set("select", date);
                        element.prop("value", $filter("date")(date, "shortDate"));
                    }
                }, true);

                scope.$watch("minDate", (newValue: string) => {
                    element.pickadate("picker").set("min", newValue ? newValue : false);
                }, true);

                scope.$watch("maxDate", (newValue: string) => {
                    element.pickadate("picker").set("max", newValue ? newValue : false);
                }, true);
            }
        })]);
}