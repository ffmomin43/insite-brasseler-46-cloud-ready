var insite;
(function (insite) {
    var budget;
    (function (budget) {
        "use strict";
        angular
            .module("insite")
            .directive("iscTab", function () { return ({
            restrict: "A",
            link: function (scope, elm) {
                elm.on("click", function () {
                    $(".active[data-isc-tab]").removeClass("active");
                    $(this).addClass("active");
                    $("[data-isc-tab-body]").hide();
                    $("#" + $(this).data("isc-tab") + "Container").show();
                });
            }
        }); })
            .directive("iscBudgetFilter", function () { return ({
            restrict: "E",
            templateUrl: "budgetPage_budgetFilter",
            scope: {
                accounts: "=",
                shipToList: "=",
                enforcementLevel: "=",
                user: "=",
                shipTo: "=",
                year: "=",
                viewBudget: "&",
                switchFilterInput: "&",
                budgetYears: "="
            }
        }); });
    })(budget = insite.budget || (insite.budget = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.budget.directives.js.map