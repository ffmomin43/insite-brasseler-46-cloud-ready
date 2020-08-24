module insite.rfq {
    "use strict";

    angular
        .module("insite")
        .directive("iscRequiresQuote", () => ({
            restrict: "E",
            replace: true,
            scope: false,
            templateUrl: "/PartialViews/Rfq-RequiresQuote"
        }))
        .directive("iscRequestedDetailsGrid", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RequestedDetailsGrid",
            scope: {
                quote: "="
            }
        }))
        .directive("iscProposedDetailsGrid", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-ProposedDetailsGrid",
            scope: {
                quote: "="
            },
            controller: "QuoteProposedDetailsController",
            controllerAs: "vm",
            bindToController: true
        }))
        .directive("iscRecentQuotes", () => ({
            restrict: "E",
            replace: true,
            scope: {
                isSalesPerson: "="
            },
            templateUrl: "/PartialViews/Rfq-RecentQuotes",
            controller: "RecentQuotesController",
            controllerAs: "vm",
            bindToController: true
        }))
        .directive("iscRfqMessages", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RfqMessages",
            scope: {
                quote: "="
            },
            controller: "QuoteMessagesController",
            controllerAs: "vm"
        }))
        .directive("iscRfqMessageList", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RfqMessageList"
        }))
        .directive("iscQuoteDetailHeader", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-QuoteDetailHeader",
            scope: {
                quote: "="
            },
            controller: "QuoteHeaderDetailsController",
            controllerAs: "vm",
            bindToController: true
        }))
        .directive("iscScrollBottom", ["$timeout", ($timeout) => ({
            link: ($scope, element) => {
                $scope.$on("messagesloaded", () => {
                    $timeout(() => {
                        element.scrollTop(element[0].scrollHeight);
                    }, 0, false);
                });
            }
        })])
        .directive("iscQuoteLineCalculatorPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-QuoteLineCalculator",
            scope: {
                quote: "="
            },
            controller: "QuoteLineCalculatorPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}