var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var MyQuotesController = /** @class */ (function () {
            function MyQuotesController(rfqService, coreService, accountService, customerService, paginationService, settingsService, cartService) {
                this.rfqService = rfqService;
                this.coreService = coreService;
                this.accountService = accountService;
                this.customerService = customerService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.cartService = cartService;
                this.paginationStorageKey = "DefaultPagination-MyQuotes";
                this.isSalesRep = true;
            }
            MyQuotesController.prototype.$onInit = function () {
                var _this = this;
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            MyQuotesController.prototype.getSettingsCompleted = function (settingsCollection) {
                var _this = this;
                this.quoteSettings = settingsCollection.quoteSettings;
                this.cartService.getCart().then(function (cart) { _this.getCartCompleted(cart); }, function (error) { _this.getCartFailed(error); });
            };
            MyQuotesController.prototype.getSettingsFailed = function (error) {
            };
            MyQuotesController.prototype.getCartCompleted = function (cart) {
                this.cart = cart;
                this.isSalesRep = cart.isSalesperson;
                this.setDefaultSearchFilter();
                if (this.isSalesRep) {
                    this.getSalesRepSpecificData();
                }
                this.restoreHistory();
                this.getQuotes();
            };
            MyQuotesController.prototype.getCartFailed = function (error) {
            };
            MyQuotesController.prototype.getSalesRepSpecificData = function () {
                var _this = this;
                this.rfqService.expand = "saleslist";
                this.accountService.getAccounts().then(function (accountCollection) { _this.getAccountsCompleted(accountCollection); }, function (error) { _this.getAccountsFailed(error); });
                this.customerService.getBillTos().then(function (billToCollection) { _this.getBillTosCompleted(billToCollection); }, function (error) { _this.getBillTosFailed(error); });
            };
            MyQuotesController.prototype.getAccountsCompleted = function (accountCollection) {
                this.userList = accountCollection.accounts.sort(function (acc1, acc2) { return acc1.userName.localeCompare(acc2.userName); });
            };
            MyQuotesController.prototype.getAccountsFailed = function (error) {
            };
            MyQuotesController.prototype.getBillTosCompleted = function (billToCollection) {
                this.customerList = billToCollection.billTos;
            };
            MyQuotesController.prototype.getBillTosFailed = function (error) {
            };
            MyQuotesController.prototype.setDefaultSearchFilter = function () {
                this.searchFilter = {};
                this.searchFilter.statuses = [];
                this.searchFilter.types = [];
                this.selectedStatus = "";
                this.searchFilter.salesRepNumber = null;
                this.searchFilter.userId = null;
                this.searchFilter.customerId = null;
                this.selectedType = "";
            };
            MyQuotesController.prototype.getQuotes = function () {
                var _this = this;
                this.coreService.replaceState({ filter: this.searchFilter, pagination: this.pagination });
                this.rfqService.getQuotes(this.searchFilter, this.pagination).then(function (quotes) { _this.getQuotesCompleted(quotes); }, function (error) { _this.getQuotesFailed(error); });
            };
            MyQuotesController.prototype.getQuotesCompleted = function (quotesModel) {
                this.quotes = quotesModel.quotes;
                this.pagination = quotesModel.pagination;
                if (quotesModel.salespersonList) {
                    this.salesRepList = quotesModel.salespersonList;
                }
            };
            MyQuotesController.prototype.getQuotesFailed = function (error) {
            };
            MyQuotesController.prototype.clear = function () {
                this.pagination.page = 1;
                this.setDefaultSearchFilter();
                this.getQuotes();
            };
            MyQuotesController.prototype.search = function () {
                this.pagination.page = 1;
                this.searchFilter.statuses = [];
                this.searchFilter.types = [];
                if (this.selectedStatus) {
                    this.searchFilter.statuses.push(this.selectedStatus);
                }
                if (this.selectedType) {
                    this.searchFilter.types.push(this.selectedType);
                }
                this.getQuotes();
            };
            MyQuotesController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.filter) {
                        this.searchFilter = state.filter;
                        if (this.searchFilter.statuses && this.searchFilter.statuses.length > 0) {
                            this.selectedStatus = this.searchFilter.statuses[0];
                        }
                        if (this.searchFilter.types && this.searchFilter.types.length > 0) {
                            this.selectedType = this.searchFilter.types[0];
                        }
                    }
                }
            };
            MyQuotesController.$inject = ["rfqService", "coreService", "accountService", "customerService", "paginationService", "settingsService", "cartService"];
            return MyQuotesController;
        }());
        rfq.MyQuotesController = MyQuotesController;
        angular
            .module("insite")
            .controller("MyQuotesController", MyQuotesController);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-quotes.controller.js.map