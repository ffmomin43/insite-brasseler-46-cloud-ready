module insite.core {
    "use strict";

    // place this directive on an anchor tag to make it do a full page redirect rather than the default spa ui-view only redirect.
    angular
        .module("insite")
        .directive("iscFullRedirect", ["coreService", (coreService: ICoreService) => ({
            restrict: "A",
            link: (scope, elm, attrs: any) => {
                const path = attrs.href || attrs.ngHref;
                if (path) {
                    elm.on("click", (e) => {
                        e.preventDefault();
                        coreService.redirectToPathAndRefreshPage(path);
                    });
                }
            }
        })]);
}