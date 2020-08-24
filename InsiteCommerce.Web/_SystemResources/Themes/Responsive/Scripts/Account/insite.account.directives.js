var insite;
(function (insite) {
    var account;
    (function (account) {
        "use strict";
        angular
            .module("insite")
            .directive("iscAddressField", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddressField",
            scope: {
                fieldLabel: "@",
                fieldName: "@",
                isEmail: "@",
                isPhone: "@",
                fieldValue: "=",
                validation: "=",
                isReadOnly: "="
            }
        }); })
            .directive("iscAddressEdit", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddressEdit",
            scope: {
                prefix: "@",
                address: "=",
                countries: "=",
                setStateRequiredRule: "&",
                isReadOnly: "=",
                addressFields: "="
            }
        }); })
            .directive("iscAddressDisplay", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddressDisplay",
            scope: {
                showEmail: "@",
                address: "="
            }
        }); })
            .directive("iscFullAddressDisplay", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-FullAddressDisplay",
            scope: {
                address: "="
            }
        }); })
            .directive("iscSelectDefaultCustomer", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-SelectDefaultCustomer",
            controller: "SelectDefaultCustomerController",
            controllerAs: "vm",
            scope: {
                account: "="
            },
            bindToController: true
        }); })
            .directive("iscWarehouseInfo", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-WarehouseInfo",
            scope: {
                warehouse: "="
            }
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.account.directives.js.map