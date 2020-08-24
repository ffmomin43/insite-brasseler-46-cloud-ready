declare let enquire: any;

(insite as any).responsive = (($) => {
    "use strict";

    const that: any = {};

    that.setup = () => {
        $("body").on("click", ".panel-trigger:not([data-cartnotes])", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if ($(this).parent().find(".item-actions").hasClass("open")) {
                $(".item-actions:not([data-cartnotes])").removeClass("open");
            } else {
                $(".item-actions:not([data-cartnotes])").removeClass("open");
                $(this).parent().find(".item-actions").addClass("open");
            }
        });
    };

    const moveNavToNarrow = () => {
        const $wideNav = $("#wideNav");
        if ($wideNav.length > 0 && $wideNav.html().trim()) {
            $("#narrowNav").html($wideNav.html());
            $wideNav.html("");
        }
    };

    const moveNavToWide = () => {
        const $narrowNav = $("#narrowNav");
        if ($narrowNav.length > 0 && $narrowNav.html().trim()) {
            $("#wideNav").html($narrowNav.html());
            $narrowNav.html("");
        }
    };

    enquire.register("screen and (max-width:767px)", {
        match() {
            moveNavToNarrow();
        },
        unmatch() {
            moveNavToWide();
            if ($("body").hasClass("sidebar-main")) {
                $("body").removeClass("sidebar-main");
            }
        },
        deferSetup: true
    });

    return that;
})(jQuery);