var insite;
(function (insite) {
    var dashboard;
    (function (dashboard) {
        "use strict";
        var DashboardViewController = /** @class */ (function () {
            function DashboardViewController($scope, wishListService, sessionService, dashboardService, $attrs, cartService) {
                this.$scope = $scope;
                this.wishListService = wishListService;
                this.sessionService = sessionService;
                this.dashboardService = dashboardService;
                this.$attrs = $attrs;
                this.cartService = cartService;
                this.wishListCollection = [];
            }
            DashboardViewController.prototype.$onInit = function () {
                var _this = this;
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                var cart = this.cartService.getLoadedCurrentCart();
                if (cart) {
                    this.onCartLoaded(cart);
                }
                else {
                    this.$scope.$on("cartLoaded", function (event, newCart) {
                        _this.onCartLoaded(newCart);
                    });
                }
                var pagination = { pageSize: 25 };
                this.wishListService.getWishLists(null, null, null, pagination).then(function (wishListCollection) { _this.getWishListCollectionCompleted(wishListCollection); }, function (error) { _this.getWishListCollectionFailed(error); });
                this.dashboardService.getDashboardPanels().then(function (dashboardPanelCollection) { _this.getDashboardPanelsCompleted(dashboardPanelCollection); }, function (error) { _this.getDashboardPanelsFailed(error); });
            };
            DashboardViewController.prototype.onCartLoaded = function (cart) {
                this.canRequestQuote = cart.canRequestQuote;
            };
            DashboardViewController.prototype.getSessionCompleted = function (session) {
                this.isSalesPerson = session.isSalesPerson;
                this.canViewOrders = !session.userRoles || session.userRoles.indexOf("Requisitioner") === -1;
                this.setDashboardIsHomepage(session);
            };
            DashboardViewController.prototype.getSessionFailed = function (error) {
            };
            DashboardViewController.prototype.getWishListCollectionCompleted = function (wishListCollection) {
                var wishListCount = wishListCollection.wishListCollection.length;
                if (wishListCount > 0) {
                    this.wishListCollection = wishListCollection.wishListCollection;
                }
            };
            DashboardViewController.prototype.getWishListCollectionFailed = function (error) {
            };
            DashboardViewController.prototype.getDashboardPanelsCompleted = function (dashboardPanelCollection) {
                this.links = dashboardPanelCollection.dashboardPanels.filter(function (x) { return !x.isPanel; });
                this.panels = dashboardPanelCollection.dashboardPanels.filter(function (x) { return x.isPanel; });
                this.quickLinks = dashboardPanelCollection.dashboardPanels.filter(function (x) { return x.isQuickLink; });
            };
            DashboardViewController.prototype.getDashboardPanelsFailed = function (error) {
            };
            DashboardViewController.prototype.changeDashboardHomepage = function ($event) {
                var _this = this;
                var checkbox = $event.target;
                var session = {};
                session.dashboardIsHomepage = checkbox.checked;
                this.sessionService.updateSession(session).then(function (updatedSession) { _this.changeDashboardHomepageCompleted(updatedSession); }, function (error) { _this.changeDashboardHomepageFailed(error); });
            };
            DashboardViewController.prototype.setDashboardIsHomepage = function (session) {
                this.dashboardIsHomepage = session.dashboardIsHomepage;
            };
            DashboardViewController.prototype.changeDashboardHomepageCompleted = function (session) {
                this.setDashboardIsHomepage(session);
            };
            DashboardViewController.prototype.changeDashboardHomepageFailed = function (error) {
            };
            DashboardViewController.prototype.getCssClass = function (panelType) {
                if (panelType === this.$attrs.orderPanelType) {
                    return "db-li-oapp";
                }
                if (panelType === this.$attrs.requisitionPanelType) {
                    return "db-li-req";
                }
                if (panelType === this.$attrs.quotePanelType) {
                    return "db-li-quotes";
                }
                return "";
            };
            DashboardViewController.$inject = ["$scope", "wishListService", "sessionService", "dashboardService", "$attrs", "cartService"];
            return DashboardViewController;
        }());
        dashboard.DashboardViewController = DashboardViewController;
        angular
            .module("insite")
            .controller("DashboardViewController", DashboardViewController);
    })(dashboard = insite.dashboard || (insite.dashboard = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dashboard-view.controller.js.map