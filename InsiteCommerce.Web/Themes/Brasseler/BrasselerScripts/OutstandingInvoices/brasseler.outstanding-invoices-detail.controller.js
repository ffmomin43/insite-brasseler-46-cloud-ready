var insite;
(function (insite) {
    var outstandinginvoices;
    (function (outstandinginvoices) {
        "use strict";
        var OutstandingInvoicesDetailController = /** @class */ (function () {
            function OutstandingInvoicesDetailController($scope, $rootScope, outstandingInvoicesService, invoiceService, customerService, coreService, paginationService, settingsService, queryString, $window, sessionService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.outstandingInvoicesService = outstandingInvoicesService;
                this.invoiceService = invoiceService;
                this.customerService = customerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.$window = $window;
                this.sessionService = sessionService;
                this.paginationStorageKey = "DefaultPagination-InvoiceList1";
                this.hidePayment = false;
                this.init();
            }
            OutstandingInvoicesDetailController.prototype.init = function () {
                var _this = this;
                this.customerService.getShipTo("").then(function (data) {
                    _this.shipTo = data;
                    _this.searchFilter = _this.getDefaultSearchFilter();
                    _this.getOutstandingInvoice();
                    _this.getOutstandingBalance();
                });
                this.sessionService.getSession().then(function (session) {
                    _this.getSessionCompleted(session);
                }, function (error) {
                    _this.getSessionFailed(error);
                });
            };
            OutstandingInvoicesDetailController.prototype.getSessionCompleted = function (session) {
                this.currencySymbol = session.currency.currencySymbol;
            };
            OutstandingInvoicesDetailController.prototype.getSessionFailed = function (error) {
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingInvoice = function () {
                var _this = this;
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
                this.outstandingInvoicesService.getOutstandingInvoices(this.searchFilter, this.pagination, this.getOutstandingInvoicesDto).then(function (invoiceCollection) { _this.getOutstandingInvoiceCompleted(invoiceCollection); }, function (error) { _this.getOutstandingInvoiceFailed(error); });
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingInvoiceCompleted = function (invoiceCollection) {
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
                for (var i = 0; i < this.outstandingInvoice.line.length; i++) {
                    var pattern = /(\d{4})(\d{2})(\d{2})/;
                    var temp_invoicedate = "00" + this.outstandingInvoice.line[i].transactionDate;
                    this.outstandingInvoice.line[i].transactionDate = new Date((temp_invoicedate).replace(pattern, '$1-$2-$3'));
                }
                this.getOutstandingOrder();
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingInvoiceFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingOrder = function () {
                var _this = this;
                this.searchFilter.transactionName = "GetOrder";
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
                };
                this.outstandingInvoicesService.getOutstandingOrder(this.searchFilter, this.getOutstandingOrderDto).then(function (response) { _this.getOutstandingOrderCompleted(response); }, function (error) { _this.getOutstandingOrderFailed(error); });
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingOrderCompleted = function (response) {
                this.outstandingOrder = response.order;
                this.orderHeader = this.outstandingOrder.orderHeader;
                this.btFormat = this.formatCityCommaStateZip(this.orderHeader.billToCity, this.orderHeader.billToStateProvince, this.orderHeader.billToZipCode);
                this.stFormat = this.formatCityCommaStateZip(this.orderHeader.shipToCity, this.orderHeader.shipToStateProvince, this.orderHeader.billToZipCode);
                this.getInvoice();
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingOrderFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            OutstandingInvoicesDetailController.prototype.getDefaultSearchFilter = function () {
                return {
                    outputType: "0",
                    inputType: "1",
                    transactionName: "ARInvoiceDetail",
                    sort: ""
                };
            };
            OutstandingInvoicesDetailController.prototype.formatCityCommaStateZip = function (city, state, zip) {
                var formattedString = "";
                if (city) {
                    formattedString = city;
                    if (state) {
                        formattedString += ", " + state + " " + zip;
                    }
                }
                return formattedString;
            };
            OutstandingInvoicesDetailController.prototype.getInvoice = function () {
                var _this = this;
                this.invoiceNumber = this.orderHeader.invoiceNumber + "-" + this.orderHeader.historySequenceNumber;
                this.$rootScope.$broadcast("invoiceNumber", this.invoiceNumber);
                this.invoiceService.getInvoice(this.invoiceNumber, "invoicelines,shipments").then(function (invoice) { _this.getInvoiceCompleted(invoice); }, function (error) { _this.getInvoiceFailed(error); });
            };
            OutstandingInvoicesDetailController.prototype.getInvoiceCompleted = function (invoice) {
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
            };
            OutstandingInvoicesDetailController.prototype.getInvoiceFailed = function (error) {
                this.validationMessage = error.message || error;
            };
            OutstandingInvoicesDetailController.prototype.showShareModal = function (entityId) {
                this.coreService.displayModal("#shareEntityPopupContainer_" + entityId);
            };
            OutstandingInvoicesDetailController.prototype.seePaymentScroll = function () {
                var seePayment = document.getElementById('payment-history-block');
                seePayment.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
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
            OutstandingInvoicesDetailController.prototype.getOutstandingBalance = function () {
                var _this = this;
                var balFilter = {
                    outputType: "0",
                    inputType: "1",
                    transactionName: "ARSummary",
                    sort: "invoiceDate"
                };
                this.outstandingInvoicesService.getOutstandingBalance(balFilter, this.getOutstandingInvoicesDto).then(function (result) { _this.getOutstandingBalanceCompleted(result); }, function (error) { _this.getOutstandingBalanceFailed(error); });
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingBalanceCompleted = function (result) {
                var jsonResult = angular.fromJson(result);
                this.aRSummary = jsonResult;
                this.outstandingBalance = this.aRSummary.tradeAmountDue;
                var totalOutstandingBalance = this.$window.localStorage.getItem("TotalOutstandingBalance");
                if (totalOutstandingBalance != undefined || totalOutstandingBalance != null) {
                    var totalOutstandingBalanceNum = parseFloat(totalOutstandingBalance);
                    var popup = this.$window.localStorage.getItem("popup");
                    if (popup == "true" && totalOutstandingBalanceNum == this.outstandingBalance) {
                        angular.element("#balancePopup").foundation('reveal', 'open');
                    }
                    else {
                        this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                    }
                }
                else {
                    this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                }
                this.$window.localStorage.setItem("popup", "false");
            };
            OutstandingInvoicesDetailController.prototype.getOutstandingBalanceFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            OutstandingInvoicesDetailController.prototype.makePayment = function () {
                angular.element("#OutstandingInvoicesPaymentPopUp").foundation('reveal', 'open');
            };
            OutstandingInvoicesDetailController.$inject = ["$scope", "$rootScope", "outstandingInvoicesService", "invoiceService", "customerService", "coreService", "paginationService", "settingsService", "queryString", "$window", "sessionService"];
            return OutstandingInvoicesDetailController;
        }());
        outstandinginvoices.OutstandingInvoicesDetailController = OutstandingInvoicesDetailController;
        angular
            .module("insite")
            .controller("OutstandingInvoicesDetailController", OutstandingInvoicesDetailController);
    })(outstandinginvoices = insite.outstandinginvoices || (insite.outstandinginvoices = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.outstanding-invoices-detail.controller.js.map