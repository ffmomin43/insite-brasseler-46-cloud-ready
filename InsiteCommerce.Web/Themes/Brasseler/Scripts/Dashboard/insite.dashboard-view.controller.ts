module insite.dashboard {
    "use strict";

    export interface IDashboardViewAttributes extends ng.IAttributes {
        orderPanelType: string;
        requisitionPanelType: string;
        quotePanelType: string;
    }

    export class DashboardViewController {
        dashboardIsHomepage: boolean;
        isSalesPerson: boolean;
        canRequestQuote: boolean;
        canViewOrders: boolean;
        wishListCollection: WishListModel[] = [];
        quickLinks: DashboardPanelModel[];
        links: DashboardPanelModel[];
        panels: DashboardPanelModel[];

        static $inject = ["$scope", "wishListService", "sessionService", "dashboardService", "$attrs", "cartService"];

        constructor(
            protected $scope: ng.IScope,
            protected wishListService: wishlist.WishListService,
            protected sessionService: account.ISessionService,
            protected dashboardService: IDashboardService,
            protected $attrs: IDashboardViewAttributes,
            protected cartService: cart.ICartService) {
        }

        $onInit(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); }
            );

            const cart = this.cartService.getLoadedCurrentCart();
            if (cart) {
                this.onCartLoaded(cart);
            } else {
                this.$scope.$on("cartLoaded", (event, newCart: CartModel) => {
                    this.onCartLoaded(newCart);
                });
            }

            const pagination = { pageSize: 25 } as PaginationModel;
            this.wishListService.getWishLists(null, null, null, pagination).then(
                (wishListCollection: WishListCollectionModel) => { this.getWishListCollectionCompleted(wishListCollection); },
                (error: any) => { this.getWishListCollectionFailed(error); });

            this.dashboardService.getDashboardPanels().then(
                (dashboardPanelCollection: DashboardPanelCollectionModel) => { this.getDashboardPanelsCompleted(dashboardPanelCollection); },
                (error: any) => { this.getDashboardPanelsFailed(error); });
        }

        protected onCartLoaded(cart: CartModel): void {
            this.canRequestQuote = cart.canRequestQuote;
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.isSalesPerson = session.isSalesPerson;
            this.canViewOrders = !session.userRoles || session.userRoles.indexOf("Requisitioner") === -1;
            this.setDashboardIsHomepage(session);
        }

        protected getSessionFailed(error: any): void {
        }

        protected getWishListCollectionCompleted(wishListCollection: WishListCollectionModel): void {
            const wishListCount = wishListCollection.wishListCollection.length;
            if (wishListCount > 0) {
                this.wishListCollection = wishListCollection.wishListCollection;
            }
        }

        protected getWishListCollectionFailed(error: any): void {
        }

        protected getDashboardPanelsCompleted(dashboardPanelCollection: DashboardPanelCollectionModel): void {
            this.links = dashboardPanelCollection.dashboardPanels.filter((x) => { return !x.isPanel; });
            this.panels = dashboardPanelCollection.dashboardPanels.filter((x) => { return x.isPanel; });
            this.quickLinks = dashboardPanelCollection.dashboardPanels.filter((x) => { return x.isQuickLink; });
        }

        protected getDashboardPanelsFailed(error: any): void {
        }

        changeDashboardHomepage($event): void {
            const checkbox = $event.target;
            const session = {} as SessionModel;
            session.dashboardIsHomepage = checkbox.checked;
            this.sessionService.updateSession(session).then(
                (updatedSession: SessionModel) => { this.changeDashboardHomepageCompleted(updatedSession); },
                (error: any) => { this.changeDashboardHomepageFailed(error); });
        }

        protected setDashboardIsHomepage(session: SessionModel): void {
            this.dashboardIsHomepage = session.dashboardIsHomepage;
        }

        protected changeDashboardHomepageCompleted(session: SessionModel): void {
            this.setDashboardIsHomepage(session);
        }

        protected changeDashboardHomepageFailed(error: any): void {
        }

        getCssClass(panelType: string): string {
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
        }
    }

    angular
        .module("insite")
        .controller("DashboardViewController", DashboardViewController);
}