module insite.outstandinginvoices {
    "use strict";

    export class OutstandingInvoicesListController {
        outstandingInvoices: OpenInvoice[] = [];
        allOutstandingInvoices: OpenInvoice[] = [];
        creditInvoices: any[] = [];
        debitInvoices: any[] = [];
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-OutstandingInvoiceList";
        searchFilter: outstandinginvoices.ISearchFilter;
        customFilter: outstandinginvoices.CustomUIFilter;
        shipTos: ShipToModel[];
        validationMessage: string;
        shipTo: ShipToModel;
        getOutstandingInvoicesDto: GetOutstandingInvoicesDto;
        outstandingBalance: number;
        aRSummary: any;
        paymentError: string;
        selectAllInvoices: boolean;
        AmountFilter: any;
        InvoiceDateFilter: any;
        currencySymbol: string;
        PoNumber: any = "";
        PoFilter: any;
        InvoiceAgeFrom: number;
        InvoiceAgeTo: number;
        InvoiceAgeFilter: any;
        orderNumberERP: string;
        OrderNumberFilter: any;
        DueAmountFrom: number;
        DueAmountTo: number;
        invoicesSelected: boolean = true;
        displayBalanceRefresh: boolean = false;
        debitInvoice: OpenInvoice;
        creditInvoice: OpenInvoice;
        creditSubmitting: boolean;
        fixedCredit: boolean = true;
        payCredit: number = 0;
        payOtherCredit: number = 0;
        creditCart: CartModel;
        cartId: string;
        creditErrorMessage: string;
        creditInvoiceList: OpenInvoice[] = [];

        static $inject = ["$scope", "$rootScope", "outstandingInvoicesService", "customerService", "cartService", "coreService", "paginationService", "settingsService", "$window", "sessionService", "spinnerService", "$filter"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IScope,
            protected outstandingInvoicesService: insite.outstandinginvoices.IOutstandingInvoicesService,
            protected customerService: customers.ICustomerService,
            protected cartService: cart.ICartService,
            protected coreService: core.ICoreService,
            protected paginationService: core.IPaginationService,
            protected settingsService: core.ISettingsService,
            protected $window: ng.IWindowService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected $filter: ng.IFilterService) {
            this.init();
        }

        init(): void {
            this.spinnerService.show("mainLayout");
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.customerService.getShipTo("").then(data => {
                this.shipTo = data;
                this.searchFilter = this.getDefaultSearchFilter();
                this.getOutstandingInvoicesDto = {

                    companyNumber: "1",
                    customerNumber: this.shipTo.customerNumber.substr(1),
                    invoiceNumberInq: "1",
                    toInvoiceNumber: "",
                    maxInvoices: "500",
                    invoiceType: "",
                    flag: "",
                    fromInvDate: "",
                    toInvDate: "",
                    fromAgeDate: "",
                    toAgeDate: "",
                    fromInvAmount: "",
                    toInvAmount: ""
                };
                this.getOutstandingBalance();
                this.getOutstandingInvoices();
            });
            this.sessionService.getSession().then(
                (session: SessionModel) => {
                    this.getSessionCompleted(session);
                },
                (error: any) => {
                    this.getSessionFailed(error);
                });
        }

        protected getShipTosFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.currencySymbol = session.currency.currencySymbol;
            this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
            this.cartService.getCart(this.cartId).then(cart => {
                this.creditCart = cart;
            });
        }

        protected getSessionFailed(error: any): void {
        }

        protected clear(): void {
            if (this.customFilter != undefined) {
                this.customFilter.invoiceNumberFrm = "";
                this.customFilter.invoiceNumberTo = "";
                this.customFilter.invoiceAmtFrm = "";
                this.customFilter.invoiceAmtTo = "";
            }
            this.PoNumber = "";
            this.orderNumberERP = "";
            this.InvoiceAgeFrom = null;
            this.InvoiceAgeTo = null;
            this.DueAmountTo = null;
            this.DueAmountTo = null;
            this.init();
        }

        protected changeSort(sort: string): void {
            this.spinnerService.show("mainLayout");
            if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                this.searchFilter.sort = `${sort} DESC`;
            } else {
                this.searchFilter.sort = sort;
            }

            this.getOutstandingInvoices();
        }

        search(): void {
            const valid = $("#searchOutstandingInvoiceForm").validate().form();
            if (!valid) {
                return;
            }
            this.spinnerService.show("invoice");
            if (this.pagination) {
                this.pagination.page = 1;
            }
            this.outstandingInvoices = [];
            if (this.customFilter == undefined && (this.PoNumber == undefined || this.PoNumber == "") && (this.orderNumberERP == undefined || this.orderNumberERP == "")
                && (this.DueAmountFrom == null || this.DueAmountFrom == undefined) && (this.DueAmountTo == null || this.DueAmountTo == undefined)
                && (this.InvoiceAgeFrom == null || this.InvoiceAgeFrom == undefined) && (this.InvoiceAgeTo == null || this.InvoiceAgeTo == undefined)) {
                this.init();
                return;
            }

            if (this.customFilter != undefined) {
                this.getOutstandingInvoicesDto = {

                    companyNumber: "1",
                    customerNumber: this.shipTo.customerNumber.substr(1),
                    invoiceNumberInq: this.customFilter.invoiceNumberFrm,
                    toInvoiceNumber: this.customFilter.invoiceNumberTo,
                    maxInvoices: "500",
                    invoiceType: "",
                    flag: "",
                    fromInvDate: this.customFilter.fromDate,
                    toInvDate: this.customFilter.toDate,
                    fromAgeDate: this.customFilter.fromDateage,
                    toAgeDate: this.customFilter.toDateage,
                    fromInvAmount: "",
                    toInvAmount: ""
                };
            }
            this.getOutstandingInvoices();
            this.spinnerService.hide();
        }

        getOutstandingInvoices(): void {
            this.searchFilter.transactionName = "AROpenInvoices";
            this.outstandingInvoicesService.getOutstandingInvoices(this.searchFilter, this.pagination, this.getOutstandingInvoicesDto).then(
                (invoiceCollection) => { this.getOutstandingInvoicesCompleted(invoiceCollection); },
                (error: any) => { this.getOutstandingInvoicesFailed(error); });
        }

        protected getOutstandingInvoicesCompleted(invoiceCollection: ArOpenInvoicesResult): void {
            this.outstandingInvoices = invoiceCollection.pagedOpenInvoices.invoice;
            this.allOutstandingInvoices = invoiceCollection.arOpenInvoices.invoice;
            this.pagination = invoiceCollection.pagination;
            let disablePayAccCount = 0;
            this.creditInvoices = [];
            this.outstandingInvoices.forEach(invoice => {
                var pattern = /(\d{4})(\d{2})(\d{2})/;
                var temp_invoicedate = "00" + invoice.invoiceDate;
                invoice.invoiceDate = new Date((temp_invoicedate).replace(pattern, '$1-$2-$3'));
                if (invoice.invoiceBalance < 0 && disablePayAccCount < 1) {

                    disablePayAccCount++;
                }
            });
            if ((this.DueAmountFrom != null && this.DueAmountFrom != undefined && this.DueAmountFrom.toString() != "") &&
                (this.DueAmountTo != null && this.DueAmountTo != undefined && this.DueAmountTo.toString() != "")) {
                this.AmountFilter = this.outstandingInvoices.filter(amt => {
                    return amt.invoiceBalance >= this.DueAmountFrom && amt.invoiceBalance <= this.DueAmountTo;
                });
                this.outstandingInvoices = this.AmountFilter;
            }
            if (this.PoNumber != "" && this.PoNumber != undefined) {
                this.PoFilter = this.outstandingInvoices.filter(po => {
                    return po.customerPO == this.PoNumber;
                });
                this.outstandingInvoices = this.PoFilter;
            }
            if (this.InvoiceAgeFrom != undefined && this.InvoiceAgeFrom != null && this.InvoiceAgeFrom.toString() != "" && this.InvoiceAgeTo != undefined && this.InvoiceAgeTo != null && this.InvoiceAgeTo.toString() != "") {
                this.InvoiceAgeFilter = this.outstandingInvoices.filter(age => {
                    return age.payDays >= this.InvoiceAgeFrom && age.payDays <= this.InvoiceAgeTo;
                });
                this.outstandingInvoices = this.InvoiceAgeFilter;
            }
            if (this.orderNumberERP != "" && this.orderNumberERP != undefined) {
                this.OrderNumberFilter = this.outstandingInvoices.filter(ERPnumber => {
                    return ERPnumber.orderNumber.toLowerCase() == this.orderNumberERP.toLowerCase();
                });
                this.outstandingInvoices = this.OrderNumberFilter;
            }
            if (this.selectAllInvoices) {
                this.outstandingInvoices.forEach(invoice => { ((invoice.invoiceBalance > 0) && this.selectAllInvoices) ? invoice.checked = true : invoice.checked = false; });
            }
            this.debitInvoices = this.allOutstandingInvoices.filter(invoice => invoice.invoiceBalance < 0).map(dbt => (
                {
                    "InvoiceLabels": "Invoice#: " + dbt.invoiceNumber + " | Balance: " + this.currencySymbol + this.$filter("number")(dbt.invoiceBalance, 2),
                    "Invoice" : dbt
                })); // invoices for Apply Credit logic
            this.creditInvoices = this.allOutstandingInvoices.filter(invoice => invoice.invoiceBalance > 0).map(cdt => (
                {
                    "InvoiceLabels": "Invoice#: " + cdt.invoiceNumber + " | Balance: " + this.currencySymbol + this.$filter("number")(cdt.invoiceBalance, 2),
                    "Invoice": cdt
                }));
            var popup = this.$window.localStorage.getItem("popup");
            if (popup == "true") {
                if (this.creditInvoice != undefined && this.creditInvoice != null) {
                    var creditnotReflectedPopup = this.creditInvoices.some(p => p.Invoice.invoiceNumber == this.creditInvoice.invoiceNumber && p.Invoice.invoiceBalance == this.creditInvoice.invoiceBalance);
                }
                $("#applyCreditInvoiceForm").trigger("reset");
                
                this.payCredit = 0;
                this.fixedCredit = true;
                this.payOtherCredit = 0;    //balancerefreshpopup after applying credit logic
                this.creditInvoice = null;
                if (creditnotReflectedPopup) {
                    (<any>angular.element("#balancePopup")).foundation('reveal', 'open');
                }
                this.$window.localStorage.setItem("popup", "false");
            }
            this.spinnerService.hideAll();
        }

        protected getOutstandingInvoicesFailed(error: any): void {
            this.validationMessage = error.exceptionMessage || error.message;
        }

        getOutstandingBalance(): any {
            this.outstandingInvoicesService.getOutstandingBalance(this.searchFilter, this.getOutstandingInvoicesDto).then(
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
                if (popup == "true" && totalOutstandingBalanceNum == this.outstandingBalance && !this.creditInvoice) {
                    (<any>angular.element("#balancePopup")).foundation('reveal', 'open');
                    this.$window.localStorage.setItem("popup", "false");
                } else {
                    this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                }
            } else {
                this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
            }

            this.$rootScope.$broadcast("outstandingBalance", this.outstandingBalance);
        }

        protected getOutstandingBalanceFailed(error: any): void {
            this.validationMessage = error.exceptionMessage || error.message;
        }

        protected getDefaultSearchFilter(): outstandinginvoices.ISearchFilter {
            return {
                outputType: "0",
                inputType: "1",
                transactionName: "ARSummary",
                sort: "invoiceDate"
            };
        }

        protected openPopUp(): void {
            $("#OutstandingInvoicesPaymentPopUp").attr("style", "display: block; opacity: 1; visibility: visible;");
            $("#OutstandingInvoicesPaymentPopUp").addClass("open");  //displaying popup in mobile devices
        }

        protected makeCurrentPayement(): void {
            this.$rootScope.$broadcast("outstandingBalance", this.outstandingBalance);
            var selectedInvoices = this.allOutstandingInvoices.map(y => ({
                "InvoiceNo": y.invoiceNumber,
                "PaymentAmount": y.invoiceBalance
            }));
            this.$rootScope.$broadcast("allInvoices", selectedInvoices);
            (<any>angular.element("#OutstandingInvoicesPaymentPopUp")).foundation('reveal', 'open');
        }

        protected enablePayInvoice(): void {
            this.invoicesSelected = this.outstandingInvoices.filter(value => { return value.checked; }).length <= 0;
        }

        protected makeSelectedInvoicePayement(): void {
            this.paymentError = "";
            var selectedInvoices = this.outstandingInvoices.filter(value => { return value.checked; }).map(y => ({
                "InvoiceNo": y.invoiceNumber,
                "PaymentAmount": y.invoiceBalance
            }));

            if (selectedInvoices.length > 0) {
                this.$rootScope.$broadcast("selectedInvoices", selectedInvoices);
                (<any>angular.element("#OutstandingInvoicesPaymentPopUp")).foundation('reveal', 'open');
            } else {
                this.paymentError = "Select invoices you wish to pay";
            }
        }

        protected selectAll(): void {
            this.outstandingInvoices.forEach(invoice => { ((invoice.invoiceBalance > 0) && this.selectAllInvoices) ? invoice.checked = true : invoice.checked = false; });
            this.enablePayInvoice();
        }

        pushBalance(balance: string): void {
            this.$window.localStorage.setItem("currentBalance", balance);
        }

        protected applyCredit(signInUri: string): void {
            this.creditSubmitting = true;
            var valid = $("#applyCreditInvoiceForm").validate().form();
            if (!valid) {
                this.creditSubmitting = false;
                return;
            }
            this.creditCart.properties['creditAmount'] = this.payCredit.toString();
            if (!this.fixedCredit) {
                this.creditCart.properties['creditAmount'] = this.payOtherCredit.toString();
            }
            this.creditInvoiceList.push(this.debitInvoice);
            this.creditInvoiceList.push(this.creditInvoice);
            var creditInvoiceList = this.creditInvoiceList.map(credit => ({
                "InvoiceNo": credit.invoiceNumber,
                "PaymentAmount": credit.invoiceBalance
            }));

            this.creditCart.properties['creditInvoiceList'] = JSON.stringify(creditInvoiceList);
            this.sessionService.getIsAuthenticated()
                .then((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        this.creditCart.status = "PayCredit";
                        this.spinnerService.show("invoice");
                        this.cartService.updateCart(this.creditCart, true).then(result => {
                            this.creditInvoiceList = [];
                            var $popup = angular.element("#paymentPopup");
                            this.coreService.displayModal($popup);
                            $('#collapseOne').removeClass('in');
                            this.$window.localStorage.setItem("popup", "true");
                            this.init();
                        }).catch(error => {
                            this.creditSubmitting = false;
                            this.creditErrorMessage = error.message;
                            this.creditInvoiceList = [];
                            this.spinnerService.hideAll();
                        });
                    } else {
                        this.$window.location.href = signInUri + "?returnUrl=" + this.$window.location.href;
                    }
                });
        }

        protected calculateCredit(): void {
            var validator = $("#applyCreditInvoiceForm").validate();
            validator.resetForm();
            if (this.debitInvoice != undefined && this.creditInvoice != undefined) {
                this.payCredit = Math.abs(this.debitInvoice.invoiceBalance) < Math.abs(this.creditInvoice.invoiceBalance) ? Math.abs(this.debitInvoice.invoiceBalance) : Math.abs(this.creditInvoice.invoiceBalance);
            } else {
                this.payCredit = 0;
            }
        }

        protected resetForm(): void {
            $("#applyCreditInvoiceForm").trigger("reset");
            this.payOtherCredit = 0;
            this.payCredit = 0;
            this.fixedCredit = true;
        }
    }

    angular
        .module("insite")
        .controller("OutstandingInvoicesListController", OutstandingInvoicesListController);
}