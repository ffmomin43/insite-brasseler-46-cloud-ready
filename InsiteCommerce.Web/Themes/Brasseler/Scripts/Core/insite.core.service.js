var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var CoreService = /** @class */ (function () {
            function CoreService($rootScope, $http, $filter, $window, $location, $sessionStorage, $timeout, $templateCache, ipCookie, $state, $stateParams) {
                this.$rootScope = $rootScope;
                this.$http = $http;
                this.$filter = $filter;
                this.$window = $window;
                this.$location = $location;
                this.$sessionStorage = $sessionStorage;
                this.$timeout = $timeout;
                this.$templateCache = $templateCache;
                this.ipCookie = ipCookie;
                this.$state = $state;
                this.$stateParams = $stateParams;
                this.webApiRoot = null;
                this.settingsUri = "/api/v1/settings";
                this.init();
            }
            CoreService.prototype.init = function () {
                var _this = this;
                this.$rootScope.$on("$stateChangeSuccess", function (event, to, toParams, from, fromParams) {
                    _this.onStateChangeSuccess(event, to, toParams, from, fromParams);
                });
                // handle server side 401 redirects to sign in
                this.$rootScope.$on("$stateChangeError", function (event, to, toParams, from, fromParams, error) {
                    _this.onStateChangeError(event, to, toParams, from, fromParams, error);
                });
                this.$rootScope.$on("$locationChangeStart", function (event, newUrl, prevUrl) {
                    _this.onLocationChangeStart(event, newUrl, prevUrl);
                });
                this.$rootScope.$on("$viewContentLoaded", function (event) {
                    _this.onViewContentLoaded(event);
                });
                this.contextPersonaIds = this.ipCookie("SetContextPersonaIds");
                // Since UI Router relies on $state's defaultErrorHandler instead of the $onStateChangeError event,
                // the HTTP 401 handling must be rewritten all over using UI Router best practices.
                this.$state.defaultErrorHandler(function (rejection) {
                    if (rejection.detail.message.indexOf("p1=401") > -1) { // There could be a better way to do it, very weak check
                        var signIn = _this.getSignInUrl() + "?returnUrl=" + encodeURIComponent(_this.$location.url());
                        _this.redirectToPath(signIn);
                    }
                });
            };
            // beginning of scroll lock methods, a highly stripped down version of https://github.com/willmcpo/body-scroll-lock
            // without iOS specific fixes, see ISC-13116
            CoreService.prototype.setOverflowHidden = function () {
                var _this = this;
                setTimeout(function () {
                    if (_this.previousBodyPaddingRight === undefined) {
                        var scrollBarGap = _this.$window.innerWidth - _this.$window.document.documentElement.clientWidth;
                        if (scrollBarGap > 0) {
                            _this.previousBodyPaddingRight = _this.$window.document.body.style.paddingRight;
                            _this.$window.document.body.style.paddingRight = scrollBarGap + "px";
                        }
                    }
                    if (_this.previousBodyOverflowSetting === undefined) {
                        _this.previousBodyOverflowSetting = _this.$window.document.body.style.overflow;
                        _this.$window.document.body.style.overflow = 'hidden';
                    }
                });
            };
            ;
            CoreService.prototype.restoreOverflowSetting = function () {
                var _this = this;
                setTimeout(function () {
                    if (_this.previousBodyPaddingRight !== undefined) {
                        _this.$window.document.body.style.paddingRight = _this.previousBodyPaddingRight;
                        _this.previousBodyPaddingRight = undefined;
                    }
                    if (_this.previousBodyOverflowSetting !== undefined) {
                        _this.$window.document.body.style.overflow = _this.previousBodyOverflowSetting;
                        _this.previousBodyOverflowSetting = undefined;
                    }
                });
            };
            ;
            // end of Scroll lock members
            CoreService.prototype.onStateChangeSuccess = function (event, to, toParams, from, fromParams) {
                if (this.isSafari()) {
                    if (toParams.path !== this.previousPath) {
                        if (this.saveState) {
                            this.saveState = false;
                        }
                        else {
                            this.$window.safariBackUrl = null;
                            this.$window.safariBackState = null;
                        }
                    }
                    this.previousPath = fromParams.path;
                }
            };
            CoreService.prototype.onStateChangeError = function (event, to, toParams, from, fromParams, error) {
                var _a, _b;
                event.preventDefault();
                if (((_b = (_a = error === null || error === void 0 ? void 0 : error.detail) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.toLowerCase().indexOf("p1=401")) > -1) {
                    var signIn = this.getSignInUrl() + "?returnUrl=" + encodeURIComponent(toParams.path);
                    // The SignInController relies on a full page redirect (not a SPA redirect)
                    // in order to register a listener for the "cartLoaded" event on the Angular scope.
                    // The listener ensures that the correct cart data is available after a
                    // user successfully signs into the application.
                    this.$window.location.replace(signIn);
                }
            };
            CoreService.prototype.onLocationChangeStart = function (event, newUrl, prevUrl) {
                if (newUrl === prevUrl) {
                    return;
                }
                this.setReferringPath(prevUrl);
                this.hideNavMenuOnTouchDevices();
                this.closeAllModals();
                this.retainScrollPosition(newUrl, prevUrl);
                var contextPersonaIds = this.ipCookie("SetContextPersonaIds");
                if (this.contextPersonaIds !== contextPersonaIds) {
                    this.contextPersonaIds = contextPersonaIds;
                    this.$templateCache.removeAll();
                }
            };
            CoreService.prototype.setReferringPath = function (prevUrl) {
                this.referringPath = prevUrl.substring(prevUrl.toLowerCase().indexOf(window.location.hostname.toLowerCase()) + window.location.hostname.length);
            };
            CoreService.prototype.retainScrollPosition = function (newUrl, prevUrl) {
                var scrollPositions = {};
                var scrollPos = this.$sessionStorage.getObject("scrollPositions");
                if (scrollPos && scrollPos[newUrl]) {
                    scrollPositions[newUrl] = scrollPos[newUrl];
                }
                scrollPositions[prevUrl] = this.$window.scrollY;
                this.$sessionStorage.setObject("scrollPositions", scrollPositions);
            };
            CoreService.prototype.onViewContentLoaded = function (event) {
                this.restoreScrollPosition();
            };
            CoreService.prototype.restoreScrollPosition = function () {
                var _this = this;
                var scrollPositions = this.$sessionStorage.getObject("scrollPositions");
                if (!scrollPositions || !scrollPositions[this.$location.absUrl()]) {
                    this.$window.scrollTo(0, 0);
                    return;
                }
                this.$timeout(function () { _this.waitForRenderAndScroll(); });
            };
            CoreService.prototype.waitForRenderAndScroll = function () {
                var _this = this;
                if (this.$http.pendingRequests.length > 0) {
                    this.$timeout(function () { _this.waitForRenderAndScroll(); }, 100);
                }
                else {
                    var scrollPositions = this.$sessionStorage.getObject("scrollPositions");
                    this.$window.scrollTo(0, scrollPositions[this.$location.absUrl()]);
                }
            };
            // example: coreService.getObjectByPropertyValue(section.options, { selected: "true" })
            CoreService.prototype.getObjectByPropertyValue = function (values, expr) {
                var filteredFields = this.$filter("filter")(values, expr, true);
                return filteredFields ? filteredFields[0] : null;
            };
            CoreService.prototype.openWishListPopup = function (products) {
                this.$rootScope.$broadcast("addToWishList", { products: products });
            };
            CoreService.prototype.closeModal = function (selector) {
                var modal = angular.element(selector + ":visible");
                if (typeof (modal) !== "undefined" && modal !== null && modal.length > 0) {
                    modal.foundation("reveal", "close");
                }
            };
            CoreService.prototype.displayModal = function (html, onClose) {
                var _this = this;
                var $html = $(html);
                this.setOverflowHidden();
                if ($html.parents("body").length === 0) {
                    $html.appendTo($("body"));
                }
                $html.foundation("reveal", "open");
                $(document).on("closed", $html, function () {
                    _this.restoreOverflowSetting();
                    if (typeof onClose === "function") {
                        onClose();
                    }
                });
            };
            CoreService.prototype.refreshUiBindings = function () {
                $(document).foundation({ bindings: "events" });
            };
            CoreService.prototype.getReferringPath = function () {
                return this.referringPath;
            };
            CoreService.prototype.getCurrentPath = function () {
                return this.$location.url();
            };
            // do a smooth redirect - storefront spa must use this instead of $window.location.href
            CoreService.prototype.redirectToPath = function (path) {
                this.$location.url(path);
            };
            CoreService.prototype.redirectToPathAndRefreshPage = function (path) {
                this.$window.location.href = path;
            };
            CoreService.prototype.redirectToSignIn = function (returnToUrl) {
                if (returnToUrl === void 0) { returnToUrl = true; }
                var signInUrl = this.getSignInUrl();
                if (this.$window.location.pathname === signInUrl) {
                    return;
                }
                var currentUrl = this.$window.location.pathname + this.$window.location.search;
                if (returnToUrl && currentUrl !== "/") {
                    signInUrl += "?returnUrl=" + encodeURIComponent(currentUrl) + "&clientRedirect=true";
                }
                this.redirectToPath(signInUrl);
            };
            CoreService.prototype.getSignInUrl = function () {
                return core.signInUrl;
            };
            CoreService.prototype.isSafari = function () {
                return navigator.vendor && navigator.vendor.indexOf("Apple") > -1 &&
                    navigator.userAgent && !navigator.userAgent.match("CriOS");
            };
            // history.replaceState has back button issues on Safari so this replaces it there
            CoreService.prototype.replaceState = function (state) {
                if (this.isSafari()) {
                    this.saveState = true;
                    this.$window.safariBackUrl = this.$location.path();
                    this.$window.safariBackState = state;
                }
                else {
                    this.$window.history.replaceState(state, "any");
                }
            };
            // history.pushState has back button issues on Safari so this replaces it there
            CoreService.prototype.pushState = function (state) {
                if (this.isSafari()) {
                    this.saveState = true;
                    this.$window.safariBackUrl = this.$location.path();
                    this.$window.safariBackState = state;
                }
                else {
                    this.$window.history.pushState(state, "any");
                }
            };
            CoreService.prototype.getHistoryState = function () {
                if (this.isSafari()) {
                    return this.$location.path() === this.$window.safariBackUrl ? this.$window.safariBackState : null;
                }
                else {
                    return this.$window.history.state;
                }
            };
            CoreService.prototype.hideNavMenuOnTouchDevices = function () {
                insite.nav.uncheckBoxes("nav");
                insite.nav.closePanel();
                insite.nav.hideSubNav();
            };
            CoreService.prototype.closeAllModals = function () {
                $("[data-reveal]:visible").each(function () {
                    $(this).foundation("reveal", "close");
                });
            };
            CoreService.$inject = ["$rootScope", "$http", "$filter", "$window", "$location", "$sessionStorage", "$timeout", "$templateCache", "ipCookie", "$state", "$stateParams"];
            return CoreService;
        }());
        core.CoreService = CoreService;
        angular
            .module("insite")
            .service("coreService", CoreService)
            .filter("trusted", ["$sce", function ($sce) { return function (val) { return $sce.trustAsHtml(val); }; }])
            .filter("escape", ["$window", function ($window) { return $window.encodeURIComponent; }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.core.service.js.map