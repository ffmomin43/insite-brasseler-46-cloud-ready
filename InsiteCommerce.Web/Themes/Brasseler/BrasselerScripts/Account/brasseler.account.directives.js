var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        angular
            .module("insite")
            .directive("iscCreateAccountView", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/Account-CreateAccountView",
                    controller: "CreateAccountController",
                    controllerAs: "vm"
                };
            }])
            .directive("iscMyAccountAddressDisplay", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/Account-MyAccountAddressDisplay",
                    scope: {
                        prefix: "@",
                        showEmail: "@",
                        address: "=",
                        countries: "="
                    }
                };
            }])
            .directive("brasselerAddressField", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/Account-AddressField",
                    scope: {
                        fieldLabel: "@",
                        fieldName: "@",
                        isEmail: "@",
                        isPhone: "@",
                        //BUSA - 1231 Added Iscity and ispostal to restrict white space
                        isCity: "@",
                        isPostal: "@",
                        isFirstname: "@",
                        isLastname: "@",
                        isCompanyname: "@",
                        //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
                        isAddress1: "@",
                        //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field
                        fieldValue: "=",
                        validation: "=",
                        isReadOnly: "=",
                        helperText: "@"
                    }
                };
            }])
            .directive("brasselerAddressFieldValidate", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/Account-AddressFieldValidate",
                    controller: "BrasselerAddressValidateController",
                    controllerAs: "vm",
                    scope: {
                        fieldLabel: "@",
                        fieldName: "@",
                        isEmail: "@",
                        isPhone: "@",
                        //BUSA-292 start : Shipping Address Accepts PO Box in Address 1 Field
                        isAddress1: "@",
                        //BUSA-292 end : Shipping Address Accepts PO Box in Address 1 Field
                        fieldValue: "=",
                        validation: "=",
                        isReadOnly: "=",
                        helperText: "@"
                    }
                };
            }])
            .directive("brasselerAddressEdit", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddressEdit",
            scope: {
                prefix: "@",
                address: "=",
                countries: "=",
                setStateRequiredRule: "&",
                isReadOnly: "=",
                addressFields: "=",
                showEmail: "@"
            }
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.account.directives.js.map