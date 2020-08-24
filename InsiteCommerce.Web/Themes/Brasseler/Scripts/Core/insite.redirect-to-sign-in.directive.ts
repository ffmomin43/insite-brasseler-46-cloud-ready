module insite.core {
    "use strict";

    angular
        .module("insite")
        .directive("iscRedirectToSignIn", ["coreService", (coreService: ICoreService) => ({
            restrict: "A",
            link: (scope, elm, attrs) => {
                attrs.$set("href", coreService.getSignInUrl());
                if (attrs.returnToUrl) {
                    elm.on("click", (e) => {
                        e.preventDefault();
                        coreService.redirectToSignIn(true);
                        scope.$apply();
                    });
                }
            }
        })]);
}