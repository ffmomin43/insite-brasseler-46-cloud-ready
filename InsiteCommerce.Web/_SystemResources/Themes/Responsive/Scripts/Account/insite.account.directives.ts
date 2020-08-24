module insite.account {
    "use strict";

    angular
        .module("insite")
        .directive("iscAddressField", () => ({
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
        }))
        .directive("iscAddressEdit", () => ({
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
        }))
        .directive("iscAddressDisplay", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-AddressDisplay",
            scope: {
                showEmail: "@",
                address: "="
            }
        }))
        .directive("iscFullAddressDisplay", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-FullAddressDisplay",
            scope: {
                address: "="
            }
        }))
        .directive("iscSelectDefaultCustomer", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-SelectDefaultCustomer",
            controller: "SelectDefaultCustomerController",
            controllerAs: "vm",
            scope: {
                account: "="
            },
            bindToController: true
        }))
        .directive("iscWarehouseInfo", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-WarehouseInfo",
            scope: {
                warehouse: "="
            }
        }));
}