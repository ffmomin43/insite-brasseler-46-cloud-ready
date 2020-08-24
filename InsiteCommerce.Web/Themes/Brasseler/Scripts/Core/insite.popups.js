var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            .directive("iscPopupTemplate", function () { return ({
            replace: true,
            restrict: "E",
            scope: {
                containerId: "@",
                title: "@"
            },
            transclude: true,
            template: "<div id=\"{{containerId}}\" class=\"reveal-modal pop-allpurpose\" data-reveal data-reveal-init>\n                    <div class=\"modal-wrap \">\n                        <h4>{{title}}</h4>\n                        <div ng-transclude></div>\n                        <a id=\"genericPopupCloseButton\" class=\"close-reveal-modal\">&#215;</a>\n                    </div>\n                </div>"
        }); });
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.popups.js.map