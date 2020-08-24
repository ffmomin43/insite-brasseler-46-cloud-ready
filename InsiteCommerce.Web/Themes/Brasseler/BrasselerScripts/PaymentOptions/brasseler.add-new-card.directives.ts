 
module insite.paymentoptions{
    "use strict";
    angular
        .module("insite")
        .directive("iscAddNewCardPopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl:"/PartialViews/PaymentOptions-AddNewCardView",
                controller: "AddNewCardController",
                controllerAs: "vm",
                scope: {
                    productId: "@"
                },
                bindToController: true
            };
        }])
}