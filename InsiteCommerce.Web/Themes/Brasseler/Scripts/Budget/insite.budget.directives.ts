module insite.budget {
    "use strict";

    angular
        .module("insite")
        .directive("iscTab", () => ({
            restrict: "A",
            link: (scope, elm) => {
                elm.on("click", function () {
                    $(".active[data-isc-tab]").removeClass("active");
                    $(this).addClass("active");
                    $("[data-isc-tab-body]").hide();
                    $(`#${$(this).data("isc-tab")}Container`).show();
                });
            }
        }))
        .directive("iscBudgetFilter", () => ({
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
        }));
}