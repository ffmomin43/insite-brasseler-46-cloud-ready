var insite;
(function (insite) {
    var paymentoptions;
    (function (paymentoptions) {
        "use strict";
        angular
            .module("insite")
            .directive("iscAddNewCardPopup", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    templateUrl: "/PartialViews/PaymentOptions-AddNewCardView",
                    controller: "AddNewCardController",
                    controllerAs: "vm",
                    scope: {
                        productId: "@"
                    },
                    bindToController: true
                };
            }]);
    })(paymentoptions = insite.paymentoptions || (insite.paymentoptions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.add-new-card.directives.js.map