module insite.core {
    "use strict";

    angular
        .module("insite")
        .directive("iscPopupTemplate", () => ({
            replace: true,
            restrict: "E",
            scope: {
                containerId: "@",
                title: "@"
            },
            transclude: true,
            template:
                `<div id="{{containerId}}" class="reveal-modal pop-allpurpose" data-reveal data-reveal-init>
                    <div class="modal-wrap ">
                        <h4>{{title}}</h4>
                        <div ng-transclude></div>
                        <a id="genericPopupCloseButton" class="close-reveal-modal">&#215;</a>
                    </div>
                </div>`
        }));
}