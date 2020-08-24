var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        angular
            .module("insite")
            // isc-carousel sets up the carousel widget
            .directive("iscCarousel", function () { return ({
            restrict: "A",
            link: function (scope, elem, attrs) {
                var animationSpeed = attrs.animationSpeed;
                var animation = attrs.animation;
                var slideshowSpeed = attrs.timerSpeed;
                var directionNav = attrs.navigationArrows.toString().toLowerCase() === "true";
                var controlNav = attrs.bullets.toString().toLowerCase() === "true";
                var showNumbers = attrs.slideNumber.toString().toLowerCase() !== "false";
                elem.flexslider({
                    animationSpeed: animationSpeed,
                    animation: animation,
                    slideshowSpeed: slideshowSpeed,
                    directionNav: directionNav,
                    controlNav: controlNav,
                    start: function (slider) {
                        // images are hidden then shown to prevent a flash of unstyled content before script loads
                        $(".flexslider li img").css("display", "block");
                        $(".slideshow-wrapper .preloader").hide();
                        if (showNumbers) {
                            slider.append("<div class=\"flex-slide-number\"><span>" + (slider.currentSlide + 1) + "</span> of <span>" + slider.count + "</span></div>");
                        }
                    },
                    after: function (slider) {
                        if (showNumbers) {
                            slider.find(".flex-slide-number").html("<span>" + (slider.currentSlide + 1) + "</span> of <span>" + slider.count + "</span>");
                        }
                    }
                });
            }
        }); });
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.carousel.directive.js.map