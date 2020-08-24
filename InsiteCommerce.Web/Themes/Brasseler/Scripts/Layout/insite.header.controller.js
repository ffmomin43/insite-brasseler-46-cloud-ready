var insite;
(function (insite) {
    var layout;
    (function (layout) {
        "use strict";
        var HeaderController = /** @class */ (function () {
            function HeaderController($scope, $timeout, cartService, sessionService, $window, settingsService, deliveryMethodPopupService) {
                this.$scope = $scope;
                this.$timeout = $timeout;
                this.cartService = cartService;
                this.sessionService = sessionService;
                this.$window = $window;
                this.settingsService = settingsService;
                this.deliveryMethodPopupService = deliveryMethodPopupService;
                this.isVisibleSearchInput = false;
            }
            HeaderController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("cartLoaded", function (event, cart) {
                    _this.onCartLoaded(cart);
                });
                // use a short timeout to wait for anything else on the page to call to load the cart
                this.$timeout(function () {
                    if (!_this.cartService.cartLoadCalled) {
                        _this.getCart();
                    }
                }, 20);
                this.getSession();
                this.getSettings();
                // set min-width of the Search label
                angular.element(".header-b2c .header-zone.rt .sb-search").css("min-width", angular.element(".search-label").outerWidth());
                angular.element(".header-b2c .mega-nav .top-level-item").hover(function (event) {
                    var target = angular.element(event.target);
                    if (target.hasClass("top-level-item")) {
                        target.addClass("hover");
                    }
                    else {
                        target.parents(".top-level-item").first().addClass("hover");
                    }
                }, function (event) {
                    var target = angular.element(event.target);
                    if (target.hasClass("top-level-item")) {
                        target.removeClass("hover");
                    }
                    else {
                        target.parents(".top-level-item").first().removeClass("hover");
                    }
                });
                angular.element(".header-b2c .mega-nav .sub-item").hover(function (event) {
                    var target = angular.element(event.target);
                    if (target.hasClass("sub-item")) {
                        target.addClass("hover");
                    }
                    else {
                        target.parents(".sub-item").first().addClass("hover");
                    }
                }, function (event) {
                    var target = angular.element(event.target);
                    if (target.hasClass("sub-item") && target.hasClass("hover")) {
                        target.removeClass("hover");
                    }
                    else {
                        target.parents(".sub-item.hover").first().removeClass("hover");
                    }
                });
            };
            HeaderController.prototype.onCartLoaded = function (cart) {
                this.cart = cart;
            };
            HeaderController.prototype.getCart = function () {
                var _this = this;
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            HeaderController.prototype.getCartCompleted = function (cart) {
            };
            HeaderController.prototype.getCartFailed = function (error) {
            };
            HeaderController.prototype.getSession = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
            };
            HeaderController.prototype.getSessionCompleted = function (session) {
                this.session = session;
            };
            HeaderController.prototype.getSessionFailed = function (error) {
            };
            HeaderController.prototype.getSettings = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            HeaderController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.accountSettings = settingsCollection.accountSettings;
            };
            HeaderController.prototype.getSettingsFailed = function (error) {
            };
            HeaderController.prototype.openSearchInput = function () {
                this.isVisibleSearchInput = true;
                this.$timeout(function () {
                    angular.element(".sb-search input#isc-searchAutoComplete-b2c").focus();
                }, 500);
            };
            HeaderController.prototype.signOut = function (returnUrl) {
                var _this = this;
                this.sessionService.signOut().then(function (signOutResult) { _this.signOutCompleted(signOutResult, returnUrl); }, function (error) { _this.signOutFailed(error); });
            };
            HeaderController.prototype.signOutCompleted = function (signOutResult, returnUrl) {
                this.$window.location.href = returnUrl;
            };
            HeaderController.prototype.signOutFailed = function (error) {
            };
            HeaderController.prototype.hideB2CNav = function ($event) {
                var target = angular.element($event.target);
                if (target.hasClass("toggle-sub")) {
                    // For tablets
                    $event.preventDefault();
                    target.mouseover();
                }
                else {
                    target.mouseout();
                }
            };
            HeaderController.prototype.openDeliveryMethodPopup = function () {
                this.deliveryMethodPopupService.display({
                    session: this.session
                });
            };
            HeaderController.$inject = ["$scope", "$timeout", "cartService", "sessionService", "$window", "settingsService", "deliveryMethodPopupService"];
            return HeaderController;
        }());
        layout.HeaderController = HeaderController;
        angular
            .module("insite")
            .controller("HeaderController", HeaderController);
    })(layout = insite.layout || (insite.layout = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.header.controller.js.map