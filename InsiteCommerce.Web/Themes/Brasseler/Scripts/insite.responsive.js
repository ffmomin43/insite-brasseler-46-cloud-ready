insite.responsive = (function ($) {
    "use strict";
    var that = {};
    that.setup = function () {
        $("body").on("click", ".panel-trigger:not([data-cartnotes])", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if ($(this).parent().find(".item-actions").hasClass("open")) {
                $(".item-actions:not([data-cartnotes])").removeClass("open");
            }
            else {
                $(".item-actions:not([data-cartnotes])").removeClass("open");
                $(this).parent().find(".item-actions").addClass("open");
            }
        });
    };
    var moveNavToNarrow = function () {
        var $wideNav = $("#wideNav");
        if ($wideNav.length > 0 && $wideNav.html().trim()) {
            $("#narrowNav").html($wideNav.html());
            $wideNav.html("");
        }
    };
    var moveNavToWide = function () {
        var $narrowNav = $("#narrowNav");
        if ($narrowNav.length > 0 && $narrowNav.html().trim()) {
            $("#wideNav").html($narrowNav.html());
            $narrowNav.html("");
        }
    };
    enquire.register("screen and (max-width:767px)", {
        match: function () {
            moveNavToNarrow();
        },
        unmatch: function () {
            moveNavToWide();
            if ($("body").hasClass("sidebar-main")) {
                $("body").removeClass("sidebar-main");
            }
        },
        deferSetup: true
    });
    return that;
})(jQuery);
//# sourceMappingURL=insite.responsive.js.map