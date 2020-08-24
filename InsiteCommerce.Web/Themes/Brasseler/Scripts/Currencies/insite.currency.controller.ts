module insite.currency {
    "use strict";

    export class CurrencyController {
        session: any;
        currencies: any[];
        showCurrenciesMenu: boolean;
        currencyButton: any;

        static $inject = ["$scope", "$window", "$timeout", "sessionService", "websiteService"];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected $timeout: ng.ITimeoutService,
            protected sessionService: account.ISessionService,
            protected websiteService: websites.IWebsiteService) {
        }

        $onInit(): void {
            angular.element(window.document).bind("click", event => {
                if (this.currencyButton && this.currencyButton !== event.target && this.currencyButton.find(event.target).length === 0) {
                    this.showCurrenciesMenu = false;
                    this.$scope.$apply();
                }
            });

            this.getSession();
        }

        protected getSession(): void {
            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.getWebsite("currencies");
        }

        protected getSessionFailed(error: any): void {
        }

        protected getWebsite(expand: string): void {
            this.websiteService.getWebsite(expand).then(
                (website: WebsiteModel) => { this.getWebsiteCompleted(website); },
                (error: any) => { this.getWebsitedFailed(error); });
        }

        protected getWebsiteCompleted(website: WebsiteModel): void {
            this.currencies = website.currencies.currencies;

            angular.forEach(this.currencies, (currency: any) => {
                if (currency.id === this.session.currency.id) {
                    this.session.currency = currency;
                }
            });
        }

        protected getWebsitedFailed(error: any): void {
        }

        setCurrency(currencyId: string): void {
            currencyId = currencyId ? currencyId : this.session.currency.id;

            this.sessionService.setCurrency(currencyId).then(
                (session: SessionModel) => { this.setCurrencyCompleted(session); },
                (error: any) => { this.setCurrencyFailed(error); });
        }

        protected setCurrencyCompleted(session: SessionModel): void {
            this.$window.location.reload();
        }

        protected setCurrencyFailed(error: any): void {
        }

        protected openCurrenciesMenu(event: any): void {
            this.showCurrenciesMenu = !this.showCurrenciesMenu;
            this.$timeout(() => {
                this.currencyButton = angular.element(event.currentTarget);
                const currenciesMenu = angular.element(event.currentTarget).children(".currencies-menu");
                const eOffset = this.currencyButton.offset();
                let top = eOffset.top;

                angular.element("body").append(currenciesMenu.detach());

                if (top > currenciesMenu.height()) {
                    top = top - currenciesMenu.height();
                } else {
                    top = top + this.currencyButton.height();
                }

                currenciesMenu.css({ "top": top, "left": eOffset.left, "visibility": "visible" });
            });
        }
    }

    angular
        .module("insite")
        .controller("CurrencyController", CurrencyController);
}