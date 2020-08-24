var insite;
(function (insite) {
    var multisite;
    (function (multisite) {
        "use strict";
        angular
            .module("insite")
            .directive("iscLanguagePreference", ["coreService", function (coreService) {
                return {
                    restrict: "E",
                    replace: true,
                    controller: multisite.MultiSiteController,
                    controllerAs: "vm",
                    templateUrl: "LanguagePreference-LanguagePreferenceView",
                };
            }]);
    })(multisite = insite.multisite || (insite.multisite = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.multisite.directives.js.map