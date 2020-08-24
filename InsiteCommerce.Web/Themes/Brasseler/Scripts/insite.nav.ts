declare let Modernizr: any;

(insite as any).nav = (($) => {
    "use strict";

    const that: any = {};

    that.uncheckBoxes = (nav) => {
        const navarray = document.getElementsByName(nav);
        for (let i = 0; i < navarray.length; i++) {
            (navarray[i] as any).checked = false;
        }
        $("body").removeClass("sidebar-main");
        $(".isc-primary-nav-back").addClass("isc-hidden");
    };

    that.hideMenu = () => {
        $("#sub-cat").addClass("hide-item");
        if (Modernizr.touch) {
            $(".isc-primary-nav ul.touch-active-nav").removeClass("touch-active-nav");
        }
    };

    that.activatePanel = () => {
        if (!$("body").hasClass("sidebar-main")) {
            $("body").addClass("sidebar-main");
            $(".isc-primary-nav ul:first").addClass("active-nav");
        }
    };

    that.goToSubnav = (navArrow) => {
        $(".isc-primary-nav ul li .hide-item").removeClass("hide-item");
        const $activeNav = $(".isc-primary-nav ul.active-nav");
        $activeNav.scrollTop(0);

        $(".isc-primary-nav ul").removeClass("active-nav");

        const self = $(navArrow);
        if (Modernizr.touch) {
            const parent = self.parents(".touch-active-nav").eq(0);
            if (parent.length > 0) {
                parent.find(".touch-active-nav").removeClass("touch-active-nav");
            } else {
                $(".isc-primary-nav ul.touch-active-nav").removeClass("touch-active-nav");
            }

            self.closest("li").find("ul.subnav:first").addClass("touch-active-nav");
        }

        self.closest("li").find("ul.subnav:first").addClass("active-nav");

        $(".isc-primary-nav-back").removeClass("isc-hidden");
    };

    that.goBack = () => {
        const $activeNav = $(".isc-primary-nav ul.active-nav");

        $activeNav.closest("li").find(".subnav-check:first").click();

        $activeNav.removeClass("active-nav");
        $activeNav.closest("li").closest("ul").addClass("active-nav");

        if (!$(".isc-primary-nav ul.active-nav").hasClass("subnav")) {
            $(".isc-primary-nav-back").addClass("isc-hidden");
        }
    };

    that.closePanel = () => {
        $("body").removePrefixedClasses("topbar-");
        $("[role='top-panel']").removeAttr("style");
    };

    that.hideSubNav = () => {
        $(".isc-primary-nav ul li:hover > ul").addClass("hide-item");
    };

    that.setup = () => {
        const events = "click.fndtn";
        const $body = $("body");

        // Watch for clicks to close panels
        $(".ex, .ui-lock").on(events, (e) => {
            e.preventDefault();
            that.closePanel();
        });

        if (Modernizr.touch) {
            $body.on(events,
                (e) => {
                    const parent = $(e.target).parents(".isc-primary-nav ul li").eq(0);
                    if (parent.length === 0) {
                        $(".isc-primary-nav ul.touch-active-nav").removeClass("touch-active-nav");
                    }
                });
        }

        let resizeTimer;
        let $windowWidth;
        // Watch the grid and indicate small or large grid
        $(window).resize(() => {
            $windowWidth = $(window).width();
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if ($body.hasClass("topbar-search")) {
                    $("[role='top-panel']").attr("style", `max-height:${$("#searchPanel").outerHeight()}px`);

                    // hide topbar search area and remove max-height for top-panel on desktop
                    if ($windowWidth > 767) {
                        $body.removeClass("topbar-search");
                        $("[role='top-panel']").removeAttr("style");
                    }
                } else if ($body.hasClass("topbar-user")) {
                    $("[role='top-panel']").attr("style", `max-height:${$("#userPanel").outerHeight()}px`);
                } else if ($body.hasClass("topbar-isettings")) {
                    $("[role='top-panel']").attr("style", `max-height:${$("#isettingsPanel").outerHeight()}px`);

                    // hide topbar search area and remove max-height for top-panel on desktop
                    if ($windowWidth > 767) {
                        $body.removeClass("topbar-isettings");
                        $("[role='top-panel']").removeAttr("style");
                    }
                }
                delayOnHover();

                $(".isc-primary-nav ul li ul li ul").removeAttr("style");
            }, 250);

        });

        const attachShowTopbarEvent = ($button, topbarClass) => {
            $button.on(events, (e) => {
                e.preventDefault();
                $body.removePrefixedClasses("topbar-");
                $body.addClass(`topbar-${topbarClass}`);
                const panelHeight = $(`#${topbarClass}Panel`).outerHeight();
                $("[role='top-panel']").attr("style", `max-height:${panelHeight}px`);
            });
        };

        attachShowTopbarEvent($("#searchButton"), "search");
        attachShowTopbarEvent($(".isettings"), "isettings");
        attachShowTopbarEvent($(".user-button"), "user");

        // Switch panels for the paneled nav on mobile
        $("#switchPanels dd").on(events, function (e) {
            e.preventDefault();
            const $this = $(this);
            const $switchToPanel = $($this.children("a").attr("href"));
            $this.toggleClass("active").siblings().removeClass("active");
            $switchToPanel.parent().css("left", `${$switchToPanel.index() * (-100)}%`);
        });

        $("#nav li a").on(events, function (e) {
            e.preventDefault();
            const $target = $($(this).attr("href"));
            $("html, body").animate({ scrollTop: $target.offset().top }, 300);
        });

        const ua = navigator.userAgent.toLowerCase();
        const isAndroid = ua.indexOf("android") > -1;
        if (isAndroid) {
            $("*").removeClass("use-fastclick");
        }

        $("#slider").attr("style", "visibility:visible");
        $(".ui-lock").addClass("use-fastclick");

        $(".nav-slide-outer li a").click(() => {
            $(".nav-slide-outer").scrollTop(0);
            if ($(window).scrollTop() > $("[role='primary-nav']").offset().top) {
                $("body,html").scrollTop($("[role='primary-nav']").offset().top);
            }
        });

        const navTimeoutDelay = 250;
        (() => {
            $(".isc-primary-nav.prevent-li-below-window ul li ul li").on("mouseover touchstart", function () {
                const $this = $(this);
                const $childUl = $this.children("ul");

                // this makes it only fire once on hover, so you can scroll if needed
                if (!$this.hasClass("currently-hovered")) {
                    // Preserve the tree so you can scroll and it wont reposition, but if you come back to the element it will reposition
                    $(".currently-hovered").not($this.parents()).removeClass("currently-hovered");
                    $this.addClass("currently-hovered");
                    // if not mobile, delay for hover delay
                    if (!Modernizr.touch) {
                        setTimeout($.proxy(() => {
                            positionChildUl($this, $childUl);
                        }, this), (navTimeoutDelay + 2));
                    } else {
                        positionChildUl($this, $childUl);
                    }
                }
            });
        })();

        // function used to reposition menu items.
        const positionChildUl = ($thisEl, $childUlEl) => {
            // if has children and is not mobile
            if ($childUlEl.length > 0 && $(window).width() > 767) {
                $childUlEl.removeAttr("style");

                const childUlHeight = $childUlEl.height();
                const windowHeight = $(window).height();
                const topNavHeight = $(".top-nav-container:first").height();
                const topOffset = $(document).scrollTop() < topNavHeight ? topNavHeight - $(document).scrollTop() : 0;

                // calculate distance from top of window to the child ul
                const childUlOffset = $childUlEl.offset().top - $(document).scrollTop();

                // calculate how much of the nav is below the window (height of menu plus its offset from top of the window, minus the height of the window)
                let belowWindow = (childUlHeight + childUlOffset) - windowHeight;

                if (belowWindow > childUlOffset) {
                    belowWindow = childUlOffset - 10;
                    if ($(".top-nav-container:first").length > 0) {
                        belowWindow -= topOffset;
                    }
                }

                // if its less than 10 px  from the bottom of the page, place it 10 px from the bottom
                if (belowWindow > -10) {
                    $childUlEl.css({
                        "position": "absolute",
                        "top": `${-(belowWindow + 10)}px`
                    });
                }
            }
        };

        const delayOnHover = () => {
            if (!Modernizr.touch && $(window).width() > 767) {
                // only if the browser doesn't support touch events, so hover will perform normally
                let tOut;
                $(".isc-primary-nav ul li").hover(
                    function () {
                        $(this).children("ul").addClass("hide-item");
                        tOut = setTimeout($.proxy(function () {
                            $(this).children("ul").removeClass("hide-item");
                        }, this), navTimeoutDelay);
                    },
                    function () {
                        clearTimeout(tOut);
                        $(this).children("ul").addClass("hide-item");
                    }
                );
            }
        };
        delayOnHover();

        // move header nav links to main nav, only to display them on mobile.
        // Doing this action once so it doesn't need to fire and manipulate dom on resize
        const $list = $(".header-zone.rt .widget-linklist.list-horizontal");
        if ($list.length > 0) {
            $(".isc-primary-nav > ul").append(`<li class="header-secondary-menu">${$list.html()}</li>`);
        }
    };

    return that;
})(jQuery);