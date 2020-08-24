module insite.paymentoptions {
    "use strict";
    angular
        .module("insite")
        .directive("iscPaymentOptions", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/PaymentOptions-PaymentOptionsView",
                controller: "PaymentOptionsController",
                controllerAs: "vm",
                scope: {
                    productId: "@"
                },
                bindToController: true
            };
        }])
        .directive("iscRemoveCardErrorPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/PaymentOptions-RemoveCardErrorPopup",
                scope: {
                },
                bindToController: false
            }
        }])
        .directive("iscUpdateCardPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                controller: "PaymentOptionsController",
                controllerAs: "cm",
                templateUrl: "/PartialViews/PaymentOptions-UpdateCardPopup",//BUSA-1122 new directive for update card
                scope: {
                    userpaymentprofileid: "="
                },
                bindToController: false
            }
        }])
}