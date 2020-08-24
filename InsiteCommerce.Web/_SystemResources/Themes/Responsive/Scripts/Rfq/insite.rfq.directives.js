var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        angular
            .module("insite")
            .directive("iscRequiresQuote", function () { return ({
            restrict: "E",
            replace: true,
            scope: false,
            templateUrl: "/PartialViews/Rfq-RequiresQuote"
        }); })
            .directive("iscRequestedDetailsGrid", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RequestedDetailsGrid",
            scope: {
                quote: "="
            }
        }); })
            .directive("iscProposedDetailsGrid", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-ProposedDetailsGrid",
            scope: {
                quote: "="
            },
            controller: "QuoteProposedDetailsController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscRecentQuotes", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                isSalesPerson: "="
            },
            templateUrl: "/PartialViews/Rfq-RecentQuotes",
            controller: "RecentQuotesController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscRfqMessages", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RfqMessages",
            scope: {
                quote: "="
            },
            controller: "QuoteMessagesController",
            controllerAs: "vm"
        }); })
            .directive("iscRfqMessageList", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-RfqMessageList"
        }); })
            .directive("iscQuoteDetailHeader", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-QuoteDetailHeader",
            scope: {
                quote: "="
            },
            controller: "QuoteHeaderDetailsController",
            controllerAs: "vm",
            bindToController: true
        }); })
            .directive("iscScrollBottom", ["$timeout", function ($timeout) { return ({
                link: function ($scope, element) {
                    $scope.$on("messagesloaded", function () {
                        $timeout(function () {
                            element.scrollTop(element[0].scrollHeight);
                        }, 0, false);
                    });
                }
            }); }])
            .directive("iscQuoteLineCalculatorPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Rfq-QuoteLineCalculator",
            scope: {
                quote: "="
            },
            controller: "QuoteLineCalculatorPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.rfq.directives.js.map