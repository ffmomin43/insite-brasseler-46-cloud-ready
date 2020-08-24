module insite.smartsupply {
    "use strict";

    export class SmartSupplySorting extends SmartSupplyListController {
        searchFilter: cart.IQueryStringFilter = {            
            sort: "subscriptionName DESC, orderNumber DESC"
        };
        
        frequencyMap: any;

        static $inject = [
            "$scope"
            , "$window"
            , "cartService"
            , "sessionService"
            , "spinnerService"
            , "coreService"
            , "paginationService"
            , "smartSupplyService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected $window: ng.IWindowService,
            protected cartService: cart.ICartService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected smartSupplyService: insite.smartsupply.ISmartSupplyService) {
            super($scope, $window, cartService, sessionService, spinnerService, coreService, paginationService, smartSupplyService);
            this.init();
        }

        init() {
            this.getSmartSupplyCarts();
        }

        changeSort(sort: string): void {
            if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                this.searchFilter.sort = sort.split(",").map(o => `${o} DESC`).join(",");
            } else {
                this.searchFilter.sort = sort;
            }

            this.getSmartSupplyCarts();
        }

        getSmartSupplyCarts() {
            this.searchFilter.sort;
        }
    }

    angular
        .module("insite")
        .controller("SmartSupplyListController", SmartSupplyListController);
}