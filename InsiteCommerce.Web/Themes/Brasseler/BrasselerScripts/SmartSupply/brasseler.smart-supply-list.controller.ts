module insite.smartsupply {
    "use strict";

    export class SmartSupplyListController {
        pagination: PaginationModel;
        smartSupplyCarts: CartModel[];
        smartSupplyCartsList: CartModel[] = [];
        paginationStorageKey = "DefaultPagination-SubscriptionOrderList";
        searchFilter: cart.IQueryStringFilter = {
            status: "SubscriptionOrder",
            sort: "OrderDate DESC",
            shipToId: null
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
            this.init();
        }

        init() {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.getSmartSupplyCarts();
        }

        getSmartSupplyCarts() {
            this.smartSupplyCartsList = [];
            this.cartService.getCarts(this.searchFilter, this.pagination).then(result => {
                this.spinnerService.show();
                this.smartSupplyCarts = result.carts;
                this.smartSupplyCarts.forEach(x => {
                    this.smartSupplyService.expand = "cartLines";
                    this.smartSupplyService.getSmartSupplyCart(x.id).then(y => {
                        this.smartSupplyCartsList.push(y);
                        if (y.properties["subscriptionFrequency"] != null) {
                            this.frequencyMap = JSON.parse(y.properties["subscriptionFrequency"]);
                        }
                    })
                })
                this.pagination = result.pagination;
            });
        }
    }

    angular
        .module("insite")
        .controller("SmartSupplyListController", SmartSupplyListController);
}