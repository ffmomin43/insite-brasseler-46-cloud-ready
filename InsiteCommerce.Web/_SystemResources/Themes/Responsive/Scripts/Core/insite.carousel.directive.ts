module insite.core {
    "use strict";

    angular
        .module("insite")
        // isc-carousel sets up the carousel widget
        .directive("iscCarousel", () => ({
            restrict: "A",
            link: (scope, elem, attrs: any) => {
                const animationSpeed = attrs.animationSpeed;
                const animation = attrs.animation;
                const slideshowSpeed = attrs.timerSpeed;
                const directionNav = attrs.navigationArrows.toString().toLowerCase() === "true";
                const controlNav = attrs.bullets.toString().toLowerCase() === "true";
                const showNumbers = attrs.slideNumber.toString().toLowerCase() !== "false";

                elem.flexslider({
                    animationSpeed: animationSpeed,
                    animation: animation,
                    slideshowSpeed: slideshowSpeed,
                    directionNav: directionNav,
                    controlNav: controlNav,
                    start: (slider) => {
                        // images are hidden then shown to prevent a flash of unstyled content before script loads
                        $(".flexslider li img").css("display", "block");
                        $(".slideshow-wrapper .preloader").hide();

                        if (showNumbers) {
                            slider.append(`<div class="flex-slide-number"><span>${(slider.currentSlide + 1)}</span> of <span>${slider.count}</span></div>`);
                        }
                    },
                    after: (slider) => {
                        if (showNumbers) {
                            slider.find(".flex-slide-number").html(`<span>${(slider.currentSlide + 1)}</span> of <span>${slider.count}</span>`);
                        }
                    }
                });
            }
        }));
}