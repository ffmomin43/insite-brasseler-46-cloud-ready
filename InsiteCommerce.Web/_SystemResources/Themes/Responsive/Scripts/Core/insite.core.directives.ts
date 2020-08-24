module insite.core {
    "use strict";

    angular
        .module("insite")
        // isc-enter calls a function when enter is hit on an element with isc-enter="functionname()"
        .directive("iscEnter", () => ({
            link: (scope, element, attrs: any) => {
                element.bind("keydown keypress", event => {
                    if (event.which === 13) {
                        scope.$apply(() => {
                            scope.$eval(attrs.iscEnter);
                        });

                        event.preventDefault();
                    }
                });
            }
        }))
        // isc-no-element renders contents without a containing element
        .directive("iscNoElement", () => ({
            restrict: "E",
            replace: true,
            template: ""
        }))
        // isc-compare-to compares the value of one element to another
        .directive("iscCompareTo", () => ({
            restrict: "A",
            scope: true,
            require: "ngModel",
            link: (scope, elem, attrs: any, control) => {
                const checker = () => {
                    const e1 = scope.$eval(attrs.ngModel);
                    const e2 = scope.$eval(attrs.iscCompareTo);
                    // models can become undefined when other validation fails and give a false positive
                    return !e1 || !e2 || e1 === e2;
                };
                scope.$watch(checker, (n) => {
                    control.$setValidity("compareTo", n);
                });
            }
        }))
        // isc-valid-email overrides the default email validation to be the same as our server side email validation
        .directive("iscValidEmail", () => ({
            require: "ngModel",
            restrict: "",
            link: (scope, elm, attrs, ctrl) => {
                // only apply the validator if ngModel is present and Angular has added the email validator
                if (ctrl && ctrl.$validators.email) {
                    // this will overwrite the default Angular email validator
                    ctrl.$validators.email = (modelValue) => {
                        return ctrl.$isEmpty(modelValue) || /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i.test(modelValue);
                    };
                }
            }
        }))
        // isc-limit-number-of-characters prevents from entering more than specified limit
        .directive("iscLimitNumberOfCharacters", () => ({
            require: "ngModel",
            link: (scope, element, attrs: any, ngModel) => {
                // backspace, arrows and delete
                const keyCodes = [8, 37, 38, 39, 40, 46];
                element.bind("keypress", event => {
                    if (ngModel.$viewValue && ngModel.$viewValue.length >= attrs.iscLimitNumberOfCharacters && keyCodes.indexOf(event.keyCode) === -1) {
                        event.preventDefault();
                    }
                });
            }
        }))
        .directive("iscSpinner", () => ({
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
        }))
        .directive("iscDateDisplay", () => ({
            link: (scope, element, attrs: any) => {
                scope.dateTime = new Date(attrs.dateTime);
            },
            template: "{{dateTime | date:'shortDate'}}"
        }))
        .directive("iscCookiePrivacyPolicyPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Core-CookiePrivacyPolicyPopup",
            controller: "CookiePrivacyPolicyPopupController",
            controllerAs: "ctrl"
        }));
}