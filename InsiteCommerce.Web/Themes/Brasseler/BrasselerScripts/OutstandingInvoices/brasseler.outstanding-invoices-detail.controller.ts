module insite.outstandinginvoices {
    "use strict";

    export class OutstandingInvoicesDetailController {
        outstandingInvoice: any;
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-InvoiceList1";
        searchFilter: outstandinginvoices.ISearchFilter;
        validationMessage: string;
        shipTo: ShipToModel;
        getOutstandingInvoicesDto: GetOutstandingInvoicesDto;
        getOutstandingOrderDto: GetOutstandingOrderDto;
        outstandingOrder: OutstandingOrder;
        orderHeader: OrderHeaderModel;
        btFormat: string;
        stFormat: string;
        invoice: InvoiceModel;
        orderNumber: string;
        invoiceNumber: string;
        dueAmount: string;
        hidePayment: boolean = false;
        currencySymbol: string;
        aRSummary: any;
        outstandingBalance: number;

        static $inject = ["$scope", "$rootScope", "outstandingInvoicesService", "invoiceService", "customerService", "coreService", "paginationService", "settingsService", "queryString", "$window", "sessionService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IScope,
            protected outstandingInvoicesService: insite.outstandinginvoices.IOutstandingInvoicesService,
            protected invoiceService: invoice.IInvoiceService,
            protected customerService: customers.ICustomerService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected $window: ng.IWindowService,
            protected sessionService: account.ISessionService) {
            this.init();
        }

        init(): void {
            this.customerService.getShipTo("").then(data => {
                this.shipTo = data;
                this.searchFilter = this.getDefaultSearchFilter();
                this.getOutstandingInvoice();
                this.getOutstandingBalance(); 
            });

            this.sessionService.getSession().then(
                (session: SessionModel) => {
                    this.getSessionCompleted(session);
                },
                (error: any) => {
                    this.getSessionFailed(error);
                });
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.currencySymbol = session.currency.currencySymbol;
        }

        protected getSessionFailed(error: any): void {
        }
      
        getOutstandingInvoice(): void {
            var invoiceId = this.queryString.get("openinvoices");

            this.getOutstandingInvoicesDto = {
                companyNumber: "1",
                customerNumber: this.shipTo.customerNumber.substr(1),
                invoiceNumberInq: invoiceId,
                toInvoiceNumber: "",
                maxInvoices: "10",
                invoiceType: "",
                flag: "O",
                fromInvDate: "",
                toInvDate: "",
                fromAgeDate: "",
                toAgeDate: "",
                fromInvAmount: "",
                toInvAmount: "",
            };

            this.outstandingInvoicesService.getOutstandingInvoices(this.searchFilter, this.pagination, this.getOutstandingInvoicesDto).then(
                (invoiceCollection: any) => { this.getOutstandingInvoiceCompleted(invoiceCollection); },
                (error: any) => { this.getOutstandingInvoiceFailed(error); });
        }

        protected getOutstandingInvoiceCompleted(invoiceCollection: any): void {
            var jsonResult = angular.fromJson(invoiceCollection);
            var arInvoiceDetail = jsonResult;
            var lines = [];
            if (!Array.isArray(arInvoiceDetail.line)) {
                lines.push(arInvoiceDetail.line);
            }
            else {
                lines = arInvoiceDetail.line;
            }
            arInvoiceDetail.line = lines;
            this.outstandingInvoice = arInvoiceDetail;
            for (let i = 0; i < this.outstandingInvoice.line.length; i++) {
                var pattern = /(\d{4})(\d{2})(\d{2})/;
                var temp_invoicedate = "00" + this.outstandingInvoice.line[i].transactionDate;
                this.outstandingInvoice.line[i].transactionDate = new Date((temp_invoicedate).replace(pattern, '$1-$2-$3'));

            }
            this.getOutstandingOrder();
        }

        protected getOutstandingInvoiceFailed(error: any): void {
            this.validationMessage = error.exceptionMessage || error.message;
        }

        getOutstandingOrder(): void {
            this.searchFilter.transactionName = "GetOrder"
            this.getOutstandingOrderDto = {
                getOrderInfo: "Y",
                companyNumber: "1",
                customerNumber: this.shipTo.customerNumber.substr(1),
                lookupType: "H",
                orderNumber: this.outstandingInvoice.line[0] ? this.outstandingInvoice.line[0].orderNumber : this.outstandingInvoice.line.orderNumber,
                orderGenerationNumber: this.outstandingInvoice.line[0] ? this.outstandingInvoice.line[0].orderGeneration : this.outstandingInvoice.line.orderGeneration,
                guestFlag: "N",
                historySequenceNumber: this.outstandingInvoice.line[0] ? this.outstandingInvoice.line[0].historySequenceNumber : this.outstandingInvoice.line.historySequenceNumber,
                includeHistory: "Y",
            }

            this.outstandingInvoicesService.getOutstandingOrder(this.searchFilter, this.getOutstandingOrderDto).then(
                (response: OutstandingOrderModel) => { this.getOutstandingOrderCompleted(response); },
                (error: any) => { this.getOutstandingOrderFailed(error); });

        }

        protected getOutstandingOrderCompleted(response: OutstandingOrderModel): void {

            this.outstandingOrder = response.order;
            this.orderHeader = this.outstandingOrder.orderHeader;
            this.btFormat = this.formatCityCommaStateZip(this.orderHeader.billToCity, this.orderHeader.billToStateProvince, this.orderHeader.billToZipCode);
            this.stFormat = this.formatCityCommaStateZip(this.orderHeader.shipToCity, this.orderHeader.shipToStateProvince, this.orderHeader.billToZipCode);

            this.getInvoice();

        }

        protected getOutstandingOrderFailed(error: any): void {
            this.validationMessage = error.exceptionMessage || error.message;
        }

        protected getDefaultSearchFilter(): outstandinginvoices.ISearchFilter {
            return {
                outputType: "0",
                inputType: "1",
                transactionName: "ARInvoiceDetail",
                sort:""
            };
        }

        protected formatCityCommaStateZip(city: string, state: string, zip: string): string {
            let formattedString = "";
            if (city) {
                formattedString = city;
                if (state) {
                    formattedString += `, ${state} ${zip}`;
                }
            }

            return formattedString;
        }


        getInvoice(): void {
            this.invoiceNumber = this.orderHeader.invoiceNumber + "-" + this.orderHeader.historySequenceNumber;
            this.$rootScope.$broadcast("invoiceNumber", this.invoiceNumber)
            this.invoiceService.getInvoice(this.invoiceNumber, "invoicelines,shipments").then(
                (invoice: InvoiceModel) => { this.getInvoiceCompleted(invoice); },
                (error: any) => { this.getInvoiceFailed(error); });
        }

        protected getInvoiceCompleted(invoice: InvoiceModel): void {
            this.invoice = invoice;
            this.btFormat = this.formatCityCommaStateZip(this.invoice.billToCity, this.invoice.billToState, this.invoice.billToPostalCode);
            this.stFormat = this.formatCityCommaStateZip(this.invoice.shipToCity, this.invoice.shipToState, this.invoice.shipToPostalCode);
            this.orderNumber = this.getOutstandingOrderDto.orderNumber + "-" + this.getOutstandingOrderDto.orderGenerationNumber;
            this.dueAmount = this.$window.localStorage.getItem("currentBalance");
            if (parseFloat(this.dueAmount) <= 0) {
                this.hidePayment = true;
            }
            //this.setStatus(this.dueAmount);


            var selectedInvoices = [{
                "InvoiceNo": this.orderHeader.invoiceNumber,
                "PaymentAmount": this.invoice.invoiceTotal
            }];

            this.$rootScope.$broadcast("selectedInvoices", selectedInvoices);
            this.$rootScope.$broadcast("invoiceBalance", this.dueAmount);
        }

        protected getInvoiceFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        protected showShareModal(entityId: string): void {
            this.coreService.displayModal(`#shareEntityPopupContainer_${entityId}`);
        }
        protected seePaymentScroll(): void {
            let seePayment: any = document.getElementById('payment-history-block');
            seePayment.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        //setStatus(balance: string): void {
        //    var bal = parseFloat(balance);
        //    if (bal == 0) {
        //        this.invoice.status = "Paid";
        //    }
        //    else if (bal < this.invoice.invoiceTotal) {
        //        this.invoice.status = "Partial Paid";
        //    }
        //    this.invoice.status = "Open";
        //}

        getOutstandingBalance(): any {
            var balFilter = {
                outputType: "0",
                inputType: "1",
                transactionName: "ARSummary",
                sort: "invoiceDate"
            }
            this.outstandingInvoicesService.getOutstandingBalance(balFilter, this.getOutstandingInvoicesDto).then(
                (result: any) => { this.getOutstandingBalanceCompleted(result); },
                (error: any) => { this.getOutstandingBalanceFailed(error); });
        }

        protected getOutstandingBalanceCompleted(result: any): void {
            var jsonResult = angular.fromJson(result);

            this.aRSummary = jsonResult;
            this.outstandingBalance = this.aRSummary.tradeAmountDue;
            var totalOutstandingBalance = this.$window.localStorage.getItem("TotalOutstandingBalance");

            if (totalOutstandingBalance != undefined || totalOutstandingBalance != null) {
                var totalOutstandingBalanceNum = parseFloat(totalOutstandingBalance);

                var popup = this.$window.localStorage.getItem("popup");
                if (popup == "true" && totalOutstandingBalanceNum == this.outstandingBalance) {
                    (<any>angular.element("#balancePopup")).foundation('reveal', 'open');
                } else {
                    this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                }
            } else {
                this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
            }
            this.$window.localStorage.setItem("popup", "false");
        }

        protected getOutstandingBalanceFailed(error: any): void {
            this.validationMessage = error.exceptionMessage || error.message;
        }
        protected makePayment(): void {
            (<any>angular.element("#OutstandingInvoicesPaymentPopUp")).foundation('reveal', 'open');
        }
    }

    angular
        .module("insite")
        .controller("OutstandingInvoicesDetailController", OutstandingInvoicesDetailController);
}