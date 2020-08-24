module insite.outstandinginvoices {
    "use strict";
    angular
        .module("insite")
        .directive("iscOutstandingInvoicesListView", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/OutstandingInvoices-OutstandingInvoicesListView",
                controller: "OutstandingInvoicesListController",
                controllerAs: "cm",
                bindToController: true
            };
        }]).directive("iscOutstandingInvoicesDetailView", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: false,
                controller: "OutstandingInvoicesDetailController",
                controllerAs: "cm",
                templateUrl: "/PartialViews/OutstandingInvoices-OutstandingInvoicesDetailView"
            };
        }]).directive("iscOutstandingInvoicesPayment", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/OutstandingInvoices-OutstandingInvoicesPayment",
                controller: "OutstandingInvoicesPaymentController",
                controllerAs: "vm",
                bindToController: true
            };
        }]).directive("iscPaymentPopup", ["coreService", function (coreService) {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/OutstandingInvoices-PaymentPopup",
            bindToController: true
        }
        }]).directive("iscBalancePopup", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "/PartialViews/OutstandingInvoices-BalancePopup",
                bindToController: true
            }
        }]);
    //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Starts

    //BUSA- 747 : Add product to existing smart supply link should display on PLP and PDP and search result page Ends
}