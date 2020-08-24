module insite.multisite{
    "use strict";
    angular
        .module("insite")
        .directive("iscLanguagePreference", ["coreService", function (coreService) {
            return {
                restrict: "E",
                replace: true,
                controller: MultiSiteController,
                controllerAs: "vm",
                templateUrl: "LanguagePreference-LanguagePreferenceView",                
            };
        }]);
        
}