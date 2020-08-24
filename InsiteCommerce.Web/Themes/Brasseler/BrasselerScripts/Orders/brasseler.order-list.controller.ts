module insite.order {
    "use strict";

    export class BrasselerOrderListController extends OrderListController {
        shipTo: ShipToModel;
        searchFilter: OrderSearchFilter;
        rmaLabel: any;
        rmaGraphicLabel: any;
        requestSubmitted: boolean;
        order: OrderModel;
        rmaNotes: string;
        rmaDate: Date;

        static $inject = [
            "orderService",
            "customerService",
            "coreService",
            "paginationService",
            "settingsService",
            "spinnerService",
            "searchService"
        ];

        constructor(
            protected orderService: order.IOrderService,
            protected customerService: customers.ICustomerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService,
            protected spinnerService: core.ISpinnerService,
            protected searchService: catalog.ISearchService) {
            super(orderService, customerService, coreService, paginationService, settingsService, searchService);
            //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders - twice service calls made
            //this.init();
        }

        init() {
            //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders - comments the super call
            //super.init();
            this.customerService.getShipTo("").then(data => {
                this.shipTo = data;
                this.searchFilter.customerSequence = this.shipTo.customerSequence;
                this.searchFilter.sort = "OrderDate DESC";
                this.searchFilter.toDate = "";
                this.searchFilter.fromDate = "";
                this.searchFilter.ponumber = "";
                this.searchFilter.ordernumber = "";
                this.searchFilter.ordertotaloperator = "";
                this.searchFilter.ordertotal = "";
                this.searchFilter.status = [];
                this.prepareSearchFilter();

                if (this.shipTo.label == "Use Billing Address") {
                    this.customerService.getBillTo("").then(data => {
                        this.shipTo.label = data.label;
                        this.shipTo.label = this.shipTo.label.substr(1, this.shipTo.label.length);
                    });
                }

                this.shipTo.label = this.shipTo.label.substr(1, this.shipTo.label.length);
                this.getOrders();
                //BUSA-1129: BillTo or ShipTo OrderHistory/RecentOrders
                super.$onInit();
            });
        }

        getOrders() {
            this.appliedSearchFilter.sort = this.searchFilter.sort;
            this.orderService.getOrders(this.appliedSearchFilter, this.pagination).then(data => {
                this.orderHistory = data;
                this.pagination = data.pagination;
            });
        }

        clear() {
            this.pagination.currentPage = 1;
            this.searchFilter.customerSequence = this.shipTo.customerSequence;
            this.searchFilter.sort = "OrderDate DESC";
            this.searchFilter.toDate = "";
            this.searchFilter.fromDate = "";
            this.searchFilter.ponumber = "";
            this.searchFilter.ordernumber = "";
            this.searchFilter.ordertotaloperator = "";
            this.searchFilter.ordertotal = "";
            this.searchFilter.status = [];
            this.prepareSearchFilter();
            this.getOrders();
        }

        getRmaStatus(webOrderNumber: any): void {
            this.spinnerService.show();
            this.orderService.getOrder(webOrderNumber, "orderlines").then(
                (order: OrderModel) => { this.rmaGetOrderCompleted(order); },
                (error: any) => { this.rmaGetOrderFailed(error); });
        }

        protected rmaGetOrderCompleted(order: OrderModel): void {
            this.spinnerService.hide();
            
            order.orderLines.forEach(o => {
                if (o.properties["returnRequest"] != undefined) {
                    var returnResult = JSON.parse(o.properties["returnRequest"]);
                    o.properties["QtyToReturn"] = returnResult.QtyToReturn;
                    o.properties["ReturnReason"] = returnResult.ReturnReason;
                    if (returnResult.RmaNotes != "")
                        this.rmaNotes = returnResult.RmaNotes;
                    this.rmaDate = returnResult.ReturnDate;
                }
            });
            this.order = order;
            if (order.properties["rmaStatusHtmlImage"] != undefined) {
                this.requestSubmitted = true;

                this.rmaLabel = window.atob(order.properties["rmaStatusHtmlImage"]);
                this.rmaLabel = this.rmaLabel.replace(/ï¿½/g, '');
                this.rmaLabel = this.rmaLabel.replace(/Â/g, '');

                $("#rmaStatusLabel").html(this.rmaLabel);
                var imgObj = $("#rmaStatusLabel").find("img");
                imgObj[0].setAttribute('src', "data:image/jpg;base64," + order.properties["rmaStatusGraphicImage"]);

                this.rmaLabel = angular.element("#rmaStatusLabel").html();
                this.coreService.displayModal(angular.element("#popup-rma"));
            }
        }

        protected rmaGetOrderFailed(error: any): void {
        }

        printRmaLabel(): void {
            var printLabel = window.open();
            printLabel.document.write($('#print-rma-label').html());
            printLabel.print();
        }

        closePopup($event): void {
            $event.preventDefault();
            this.coreService.closeModal("#popup-rma");
        }
    }
    angular
        .module("insite")
        .controller("OrderListController", BrasselerOrderListController);
}