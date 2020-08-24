var insite;
(function (insite) {
    var outstandinginvoices;
    (function (outstandinginvoices) {
        "use strict";
        var OutstandingInvoicesListController = /** @class */ (function () {
            function OutstandingInvoicesListController($scope, $rootScope, outstandingInvoicesService, customerService, cartService, coreService, paginationService, settingsService, $window, sessionService, spinnerService, $filter) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.outstandingInvoicesService = outstandingInvoicesService;
                this.customerService = customerService;
                this.cartService = cartService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.$window = $window;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.$filter = $filter;
                this.outstandingInvoices = [];
                this.allOutstandingInvoices = [];
                this.creditInvoices = [];
                this.debitInvoices = [];
                this.paginationStorageKey = "DefaultPagination-OutstandingInvoiceList";
                this.PoNumber = "";
                this.invoicesSelected = true;
                this.displayBalanceRefresh = false;
                this.fixedCredit = true;
                this.payCredit = 0;
                this.payOtherCredit = 0;
                this.creditInvoiceList = [];
                this.init();
            }
            OutstandingInvoicesListController.prototype.init = function () {
                var _this = this;
                this.spinnerService.show("mainLayout");
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.customerService.getShipTo("").then(function (data) {
                    _this.shipTo = data;
                    _this.searchFilter = _this.getDefaultSearchFilter();
                    _this.getOutstandingInvoicesDto = {
                        companyNumber: "1",
                        customerNumber: _this.shipTo.customerNumber.substr(1),
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
                    _this.getOutstandingBalance();
                    _this.getOutstandingInvoices();
                });
                this.sessionService.getSession().then(function (session) {
                    _this.getSessionCompleted(session);
                }, function (error) {
                    _this.getSessionFailed(error);
                });
            };
            OutstandingInvoicesListController.prototype.getShipTosFailed = function (error) {
            };
            OutstandingInvoicesListController.prototype.getSessionCompleted = function (session) {
                var _this = this;
                this.currencySymbol = session.currency.currencySymbol;
                this.cartService.expand = "cartlines,shipping,tax,carriers,paymentoptions";
                this.cartService.getCart(this.cartId).then(function (cart) {
                    _this.creditCart = cart;
                });
            };
            OutstandingInvoicesListController.prototype.getSessionFailed = function (error) {
            };
            OutstandingInvoicesListController.prototype.clear = function () {
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
            };
            OutstandingInvoicesListController.prototype.changeSort = function (sort) {
                this.spinnerService.show("mainLayout");
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort + " DESC";
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getOutstandingInvoices();
            };
            OutstandingInvoicesListController.prototype.search = function () {
                var valid = $("#searchOutstandingInvoiceForm").validate().form();
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
            };
            OutstandingInvoicesListController.prototype.getOutstandingInvoices = function () {
                var _this = this;
                this.searchFilter.transactionName = "AROpenInvoices";
                this.outstandingInvoicesService.getOutstandingInvoices(this.searchFilter, this.pagination, this.getOutstandingInvoicesDto).then(function (invoiceCollection) { _this.getOutstandingInvoicesCompleted(invoiceCollection); }, function (error) { _this.getOutstandingInvoicesFailed(error); });
            };
            OutstandingInvoicesListController.prototype.getOutstandingInvoicesCompleted = function (invoiceCollection) {
                var _this = this;
                this.outstandingInvoices = invoiceCollection.pagedOpenInvoices.invoice;
                this.allOutstandingInvoices = invoiceCollection.arOpenInvoices.invoice;
                this.pagination = invoiceCollection.pagination;
                var disablePayAccCount = 0;
                this.creditInvoices = [];
                this.outstandingInvoices.forEach(function (invoice) {
                    var pattern = /(\d{4})(\d{2})(\d{2})/;
                    var temp_invoicedate = "00" + invoice.invoiceDate;
                    invoice.invoiceDate = new Date((temp_invoicedate).replace(pattern, '$1-$2-$3'));
                    if (invoice.invoiceBalance < 0 && disablePayAccCount < 1) {
                        disablePayAccCount++;
                    }
                });
                if ((this.DueAmountFrom != null && this.DueAmountFrom != undefined && this.DueAmountFrom.toString() != "") &&
                    (this.DueAmountTo != null && this.DueAmountTo != undefined && this.DueAmountTo.toString() != "")) {
                    this.AmountFilter = this.outstandingInvoices.filter(function (amt) {
                        return amt.invoiceBalance >= _this.DueAmountFrom && amt.invoiceBalance <= _this.DueAmountTo;
                    });
                    this.outstandingInvoices = this.AmountFilter;
                }
                if (this.PoNumber != "" && this.PoNumber != undefined) {
                    this.PoFilter = this.outstandingInvoices.filter(function (po) {
                        return po.customerPO == _this.PoNumber;
                    });
                    this.outstandingInvoices = this.PoFilter;
                }
                if (this.InvoiceAgeFrom != undefined && this.InvoiceAgeFrom != null && this.InvoiceAgeFrom.toString() != "" && this.InvoiceAgeTo != undefined && this.InvoiceAgeTo != null && this.InvoiceAgeTo.toString() != "") {
                    this.InvoiceAgeFilter = this.outstandingInvoices.filter(function (age) {
                        return age.payDays >= _this.InvoiceAgeFrom && age.payDays <= _this.InvoiceAgeTo;
                    });
                    this.outstandingInvoices = this.InvoiceAgeFilter;
                }
                if (this.orderNumberERP != "" && this.orderNumberERP != undefined) {
                    this.OrderNumberFilter = this.outstandingInvoices.filter(function (ERPnumber) {
                        return ERPnumber.orderNumber.toLowerCase() == _this.orderNumberERP.toLowerCase();
                    });
                    this.outstandingInvoices = this.OrderNumberFilter;
                }
                if (this.selectAllInvoices) {
                    this.outstandingInvoices.forEach(function (invoice) { ((invoice.invoiceBalance > 0) && _this.selectAllInvoices) ? invoice.checked = true : invoice.checked = false; });
                }
                this.debitInvoices = this.allOutstandingInvoices.filter(function (invoice) { return invoice.invoiceBalance < 0; }).map(function (dbt) { return ({
                    "InvoiceLabels": "Invoice#: " + dbt.invoiceNumber + " | Balance: " + _this.currencySymbol + _this.$filter("number")(dbt.invoiceBalance, 2),
                    "Invoice": dbt
                }); }); // invoices for Apply Credit logic
                this.creditInvoices = this.allOutstandingInvoices.filter(function (invoice) { return invoice.invoiceBalance > 0; }).map(function (cdt) { return ({
                    "InvoiceLabels": "Invoice#: " + cdt.invoiceNumber + " | Balance: " + _this.currencySymbol + _this.$filter("number")(cdt.invoiceBalance, 2),
                    "Invoice": cdt
                }); });
                var popup = this.$window.localStorage.getItem("popup");
                if (popup == "true") {
                    if (this.creditInvoice != undefined && this.creditInvoice != null) {
                        var creditnotReflectedPopup = this.creditInvoices.some(function (p) { return p.Invoice.invoiceNumber == _this.creditInvoice.invoiceNumber && p.Invoice.invoiceBalance == _this.creditInvoice.invoiceBalance; });
                    }
                    $("#applyCreditInvoiceForm").trigger("reset");
                    this.payCredit = 0;
                    this.fixedCredit = true;
                    this.payOtherCredit = 0; //balancerefreshpopup after applying credit logic
                    this.creditInvoice = null;
                    if (creditnotReflectedPopup) {
                        angular.element("#balancePopup").foundation('reveal', 'open');
                    }
                    this.$window.localStorage.setItem("popup", "false");
                }
                this.spinnerService.hideAll();
            };
            OutstandingInvoicesListController.prototype.getOutstandingInvoicesFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            OutstandingInvoicesListController.prototype.getOutstandingBalance = function () {
                var _this = this;
                this.outstandingInvoicesService.getOutstandingBalance(this.searchFilter, this.getOutstandingInvoicesDto).then(function (result) { _this.getOutstandingBalanceCompleted(result); }, function (error) { _this.getOutstandingBalanceFailed(error); });
            };
            OutstandingInvoicesListController.prototype.getOutstandingBalanceCompleted = function (result) {
                var jsonResult = angular.fromJson(result);
                this.aRSummary = jsonResult;
                this.outstandingBalance = this.aRSummary.tradeAmountDue;
                var totalOutstandingBalance = this.$window.localStorage.getItem("TotalOutstandingBalance");
                if (totalOutstandingBalance != undefined || totalOutstandingBalance != null) {
                    var totalOutstandingBalanceNum = parseFloat(totalOutstandingBalance);
                    var popup = this.$window.localStorage.getItem("popup");
                    if (popup == "true" && totalOutstandingBalanceNum == this.outstandingBalance && !this.creditInvoice) {
                        angular.element("#balancePopup").foundation('reveal', 'open');
                        this.$window.localStorage.setItem("popup", "false");
                    }
                    else {
                        this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                    }
                }
                else {
                    this.$window.localStorage.setItem("TotalOutstandingBalance", this.aRSummary.tradeAmountDue);
                }
                this.$rootScope.$broadcast("outstandingBalance", this.outstandingBalance);
            };
            OutstandingInvoicesListController.prototype.getOutstandingBalanceFailed = function (error) {
                this.validationMessage = error.exceptionMessage || error.message;
            };
            OutstandingInvoicesListController.prototype.getDefaultSearchFilter = function () {
                return {
                    outputType: "0",
                    inputType: "1",
                    transactionName: "ARSummary",
                    sort: "invoiceDate"
                };
            };
            OutstandingInvoicesListController.prototype.openPopUp = function () {
                $("#OutstandingInvoicesPaymentPopUp").attr("style", "display: block; opacity: 1; visibility: visible;");
                $("#OutstandingInvoicesPaymentPopUp").addClass("open"); //displaying popup in mobile devices
            };
            OutstandingInvoicesListController.prototype.makeCurrentPayement = function () {
                this.$rootScope.$broadcast("outstandingBalance", this.outstandingBalance);
                var selectedInvoices = this.allOutstandingInvoices.map(function (y) { return ({
                    "InvoiceNo": y.invoiceNumber,
                    "PaymentAmount": y.invoiceBalance
                }); });
                this.$rootScope.$broadcast("allInvoices", selectedInvoices);
                angular.element("#OutstandingInvoicesPaymentPopUp").foundation('reveal', 'open');
            };
            OutstandingInvoicesListController.prototype.enablePayInvoice = function () {
                this.invoicesSelected = this.outstandingInvoices.filter(function (value) { return value.checked; }).length <= 0;
            };
            OutstandingInvoicesListController.prototype.makeSelectedInvoicePayement = function () {
                this.paymentError = "";
                var selectedInvoices = this.outstandingInvoices.filter(function (value) { return value.checked; }).map(function (y) { return ({
                    "InvoiceNo": y.invoiceNumber,
                    "PaymentAmount": y.invoiceBalance
                }); });
                if (selectedInvoices.length > 0) {
                    this.$rootScope.$broadcast("selectedInvoices", selectedInvoices);
                    angular.element("#OutstandingInvoicesPaymentPopUp").foundation('reveal', 'open');
                }
                else {
                    this.paymentError = "Select invoices you wish to pay";
                }
            };
            OutstandingInvoicesListController.prototype.selectAll = function () {
                var _this = this;
                this.outstandingInvoices.forEach(function (invoice) { ((invoice.invoiceBalance > 0) && _this.selectAllInvoices) ? invoice.checked = true : invoice.checked = false; });
                this.enablePayInvoice();
            };
            OutstandingInvoicesListController.prototype.pushBalance = function (balance) {
                this.$window.localStorage.setItem("currentBalance", balance);
            };
            OutstandingInvoicesListController.prototype.applyCredit = function (signInUri) {
                var _this = this;
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
                var creditInvoiceList = this.creditInvoiceList.map(function (credit) { return ({
                    "InvoiceNo": credit.invoiceNumber,
                    "PaymentAmount": credit.invoiceBalance
                }); });
                this.creditCart.properties['creditInvoiceList'] = JSON.stringify(creditInvoiceList);
                this.sessionService.getIsAuthenticated()
                    .then(function (isAuthenticated) {
                    if (isAuthenticated) {
                        _this.creditCart.status = "PayCredit";
                        _this.spinnerService.show("invoice");
                        _this.cartService.updateCart(_this.creditCart, true).then(function (result) {
                            _this.creditInvoiceList = [];
                            var $popup = angular.element("#paymentPopup");
                            _this.coreService.displayModal($popup);
                            $('#collapseOne').removeClass('in');
                            _this.$window.localStorage.setItem("popup", "true");
                            _this.init();
                        }).catch(function (error) {
                            _this.creditSubmitting = false;
                            _this.creditErrorMessage = error.message;
                            _this.creditInvoiceList = [];
                            _this.spinnerService.hideAll();
                        });
                    }
                    else {
                        _this.$window.location.href = signInUri + "?returnUrl=" + _this.$window.location.href;
                    }
                });
            };
            OutstandingInvoicesListController.prototype.calculateCredit = function () {
                var validator = $("#applyCreditInvoiceForm").validate();
                validator.resetForm();
                if (this.debitInvoice != undefined && this.creditInvoice != undefined) {
                    this.payCredit = Math.abs(this.debitInvoice.invoiceBalance) < Math.abs(this.creditInvoice.invoiceBalance) ? Math.abs(this.debitInvoice.invoiceBalance) : Math.abs(this.creditInvoice.invoiceBalance);
                }
                else {
                    this.payCredit = 0;
                }
            };
            OutstandingInvoicesListController.prototype.resetForm = function () {
                $("#applyCreditInvoiceForm").trigger("reset");
                this.payOtherCredit = 0;
                this.payCredit = 0;
                this.fixedCredit = true;
            };
            OutstandingInvoicesListController.$inject = ["$scope", "$rootScope", "outstandingInvoicesService", "customerService", "cartService", "coreService", "paginationService", "settingsService", "$window", "sessionService", "spinnerService", "$filter"];
            return OutstandingInvoicesListController;
        }());
        outstandinginvoices.OutstandingInvoicesListController = OutstandingInvoicesListController;
        angular
            .module("insite")
            .controller("OutstandingInvoicesListController", OutstandingInvoicesListController);
    })(outstandinginvoices = insite.outstandinginvoices || (insite.outstandinginvoices = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.outstanding-invoices-list.controller.js.map