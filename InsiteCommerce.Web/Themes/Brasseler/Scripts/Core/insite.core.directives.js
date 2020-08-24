var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            // isc-enter calls a function when enter is hit on an element with isc-enter="functionname()"
            .directive("iscEnter", function () { return ({
            link: function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        scope.$apply(function () {
                            scope.$eval(attrs.iscEnter);
                        });
                        event.preventDefault();
                    }
                });
            }
        }); })
            // isc-no-element renders contents without a containing element
            .directive("iscNoElement", function () { return ({
            restrict: "E",
            replace: true,
            template: ""
        }); })
            // isc-compare-to compares the value of one element to another
            .directive("iscCompareTo", function () { return ({
            restrict: "A",
            scope: true,
            require: "ngModel",
            link: function (scope, elem, attrs, control) {
                var checker = function () {
                    var e1 = scope.$eval(attrs.ngModel);
                    var e2 = scope.$eval(attrs.iscCompareTo);
                    // models can become undefined when other validation fails and give a false positive
                    return !e1 || !e2 || e1 === e2;
                };
                scope.$watch(checker, function (n) {
                    control.$setValidity("compareTo", n);
                });
            }
        }); })
            // isc-valid-email overrides the default email validation to be the same as our server side email validation
            .directive("iscValidEmail", function () { return ({
            require: "ngModel",
            restrict: "",
            link: function (scope, elm, attrs, ctrl) {
                // only apply the validator if ngModel is present and Angular has added the email validator
                if (ctrl && ctrl.$validators.email) {
                    // this will overwrite the default Angular email validator
                    ctrl.$validators.email = function (modelValue) {
                        return ctrl.$isEmpty(modelValue) || /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i.test(modelValue);
                    };
                }
            }
        }); })
            // isc-limit-number-of-characters prevents from entering more than specified limit
            .directive("iscLimitNumberOfCharacters", function () { return ({
            require: "ngModel",
            link: function (scope, element, attrs, ngModel) {
                // backspace, arrows and delete
                var keyCodes = [8, 37, 38, 39, 40, 46];
                element.bind("keypress", function (event) {
                    if (ngModel.$viewValue && ngModel.$viewValue.length >= attrs.iscLimitNumberOfCharacters && keyCodes.indexOf(event.keyCode) === -1) {
                        event.preventDefault();
                    }
                });
            }
        }); })
            .directive("iscSpinner", function () { return ({
            restrict: "E",
            replace: true,
            transclude: true,
            scope: {
                name: "@?",
                group: "@?",
                show: "@?",
                size: "@?",
                replace: "@?",
                register: "@?"
            },
            templateUrl: "/PartialViews/Core-Spinner",
            controller: "SpinnerController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscDateDisplay", function () { return ({
            link: function (scope, element, attrs) {
                scope.dateTime = new Date(attrs.dateTime);
            },
            template: "{{dateTime | date:'shortDate'}}"
        }); })
            .directive("iscCookiePrivacyPolicyPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Core-CookiePrivacyPolicyPopup",
            controller: "CookiePrivacyPolicyPopupController",
            controllerAs: "ctrl"
        }); });
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.core.directives.js.map