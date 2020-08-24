var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        // place this directive on an anchor tag to make it do a full page redirect rather than the default spa ui-view only redirect.
        angular
            .module("insite")
            .directive("iscFullRedirect", ["coreService", function (coreService) { return ({
                restrict: "A",
                link: function (scope, elm, attrs) {
                    var path = attrs.href || attrs.ngHref;
                    if (path) {
                        elm.on("click", function (e) {
                            e.preventDefault();
                            coreService.redirectToPathAndRefreshPage(path);
                        });
                    }
                }
            }); }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.full-redirect.directive.js.map