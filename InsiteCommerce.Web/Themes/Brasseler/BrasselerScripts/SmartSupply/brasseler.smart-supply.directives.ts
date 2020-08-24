module insite.smartsupply {
    "use strict";
    angular
        .module("insite")
        .directive("iscSmartSupplyListView", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/SmartSupply-SmartSupplyListView",
                controller: "SmartSupplyListController",
                controllerAs: "vm",
                scope: {
                    productId: "@"
                },
                bindToController: true
            };
        }])
        .directive("iscSmartSupplyDetailView", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                controller: "SmartSupplyDetailController",
                controllerAs: "vm",
                scope: {
                    cartLine: "=",
                    cartLineId: "="
                },
                templateUrl: "/PartialViews/SmartSupply-SmartSupplyDetailView"
            };
        }])
        .directive("iscChangeSavedPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/Cart-ChangeSavedPopup",
                scope: {
                },
                bindToController: false
            }
        }])
        .directive("iscShipNowPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                controller: "SmartSupplyDetailController",
                controllerAs: "vm",
                templateUrl: "/PartialViews/SmartSupply-ShipNowPopup",
                scope: {
                    cart: "=",
                },
                bindToController: false
            }
        }])
        .directive("iscCancellationPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                controller: "SmartSupplyDetailController",
                controllerAs: "vm",
                templateUrl: "/PartialViews/SmartSupply-CancellationPopup",
               
                bindToController: false
            }
        }]);
    //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts

    //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Ends
}