var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            .directive("iscRedirectToSignIn", ["coreService", function (coreService) { return ({
                restrict: "A",
                link: function (scope, elm, attrs) {
                    attrs.$set("href", coreService.getSignInUrl());
                    if (attrs.returnToUrl) {
                        elm.on("click", function (e) {
                            e.preventDefault();
                            coreService.redirectToSignIn(true);
                            scope.$apply();
                        });
                    }
                }
            }); }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.redirect-to-sign-in.directive.js.map