jQuery.fn.removePrefixedClasses = function (prefix) {
    var $this = $(this);
    var classAttr = $this.attr("class");
    if (classAttr === undefined || classAttr === null) {
        classAttr = "";
    }
    var classNames = classAttr.split(" ");
    var className;
    var newClassNames = [];
    var i;
    for (i = 0; i < classNames.length; i++) {
        className = classNames[i];
        // if prefix not found at the beggining of class name
        if (className.indexOf(prefix) !== 0) {
            newClassNames.push(className);
            continue;
        }
    }
    $this.attr("class", newClassNames.join(" "));
    return this;
};
jQuery.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    jQuery.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || "");
        }
        else {
            o[this.name] = this.value || "";
        }
    });
    return o;
};
jQuery.fn.ajaxRefresh = function (callback) {
    var $this = this;
    jQuery.get(this.attr("data-refreshUrl"), function (html) {
        $this.html(html);
        if (typeof (callback) === "function") {
            callback();
        }
    });
};
jQuery.ajaxPostJson = function (url, json, callback) {
    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(json),
        contentType: "application/json; charset=utf-8",
        success: callback
    });
};
jQuery.fn.ajaxPostJson = function (json, callback) {
    var url = this.attr("action");
    if (url === "" || typeof (url) === "undefined") {
        url = this.attr("href");
    }
    $.ajaxPostJson(url, json, callback);
};
jQuery.fn.ajaxPost = function (callback) {
    jQuery.post(this.attr("action"), this.serialize(), callback);
};
jQuery.fn.ajaxGet = function (callback) {
    jQuery.get(this.attr("action"), this.serialize(), callback);
};
jQuery.loading = (function () {
    var isLoading = false;
    var $loading;
    var $pageOverlay;
    var $window;
    var that = {};
    that.findOverlay = function () {
        $pageOverlay = $("#pageOverlay");
        if ($pageOverlay.length === 0) {
            $("body").append("<div id='pageOverlay'></div>");
            $pageOverlay = $("#pageOverlay");
        }
    };
    that.showOverlay = function (onTop) {
        that.findOverlay();
        $pageOverlay.height(Math.max($("body").height(), $window.height())).width($window.width());
        $pageOverlay.fadeIn("fast");
        if (onTop) {
            $pageOverlay.css("z-index", "10000");
        }
        $pageOverlay.unbind("click").click(function (event) {
            event.stopPropagation();
        });
    };
    that.hideOverlay = function (moveToBackground) {
        that.findOverlay();
        if (moveToBackground && $pageOverlay) {
            $pageOverlay.css("z-index", "");
        }
        if (!moveToBackground && $pageOverlay) {
            $pageOverlay.css("z-index", "");
            $pageOverlay.fadeOut(function () { });
        }
    };
    that.show = function (onTop) {
        if (!isLoading) {
            isLoading = true;
            var html = "<div id='spinner' class='spinner'><div class='bounce1'></div><div class='bounce2'></div><div class='bounce3'></div></div>";
            $("body").append(html);
            $loading = $("#spinner");
            $window = $(window);
            that.showOverlay(onTop);
            $loading.fadeIn("fast");
        }
    };
    that.hide = function (shouldHideOverlay) {
        that.hideOverlay(true);
        shouldHideOverlay = typeof shouldHideOverlay !== "undefined" ? shouldHideOverlay : true;
        if (isLoading) {
            setTimeout(function () {
                isLoading = false;
                if (shouldHideOverlay) {
                    that.hideOverlay(false);
                }
                if (!$loading) {
                    return;
                }
                $loading.fadeOut(function () {
                    $("#spinner").remove();
                    $loading = null;
                });
            }, 300);
        }
    };
    return that;
})();
jQuery.frameSpinner = (function () {
    var frameIsLoading = false;
    var $frameLoading;
    var $frameOverlay;
    var that = {};
    var findOverlay = function () {
        $frameOverlay = $("#frameOverlay");
        if ($frameOverlay.length === 0) {
            $(".siteFrame").append("<div id='frameOverlay'></div>");
            $frameOverlay = $("#frameOverlay");
        }
    };
    var showOverlay = function (onTop) {
        findOverlay();
        $frameOverlay.fadeIn("fast");
        if (onTop) {
            $frameOverlay.css("z-index", "10000");
        }
        $frameOverlay.unbind("click").click(function (event) {
            event.stopPropagation();
        });
    };
    var hideOverlay = function (moveToBackground) {
        findOverlay();
        if (moveToBackground && $frameOverlay) {
            $frameOverlay.css("z-index", "");
        }
        if (!moveToBackground && $frameOverlay) {
            $frameOverlay.css("z-index", "");
            $frameOverlay.fadeOut(function () { });
        }
    };
    that.show = function (onTop) {
        if (!frameIsLoading) {
            frameIsLoading = true;
            var html = "<div id='frameSpinner' class='spinner frameSpinner'><div class='bounce1'></div><div class='bounce2'></div><div class='bounce3'></div></div>";
            $(".siteFrame").append(html);
            $frameLoading = $("#frameSpinner");
            showOverlay(onTop);
            $frameLoading.fadeIn("fast");
        }
    };
    that.hide = function (shouldHideOverlay) {
        hideOverlay(true);
        shouldHideOverlay = typeof shouldHideOverlay !== "undefined" ? shouldHideOverlay : true;
        if (frameIsLoading) {
            setTimeout(function () {
                frameIsLoading = false;
                if (shouldHideOverlay) {
                    hideOverlay(false);
                }
                if (!$frameLoading) {
                    return;
                }
                $frameLoading.fadeOut(function () {
                    $("#frameSpinner").remove();
                    $frameLoading = null;
                });
            }, 300);
        }
    };
    return that;
})();
//# sourceMappingURL=insite.jquery-extensions.js.map