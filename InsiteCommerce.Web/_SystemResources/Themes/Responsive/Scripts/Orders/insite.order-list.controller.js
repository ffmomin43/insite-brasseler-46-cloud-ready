var insite;
(function (insite) {
    var order;
    (function (order) {
        "use strict";
        var OrderListController = /** @class */ (function () {
            function OrderListController(orderService, customerService, coreService, paginationService, settingsService, searchService) {
                this.orderService = orderService;
                this.customerService = customerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.settingsService = settingsService;
                this.searchService = searchService;
                this.paginationStorageKey = "DefaultPagination-OrderList";
                this.searchFilter = {
                    customerSequence: "-1",
                    sort: "OrderDate DESC,ErpOrderNumber DESC,WebOrderNumber DESC",
                    toDate: "",
                    fromDate: "",
                    expand: "",
                    ponumber: "",
                    ordernumber: "",
                    search: "",
                    ordertotaloperator: "",
                    ordertotal: "",
                    status: [],
                    statusDisplay: "",
                    productErpNumber: ""
                };
                this.appliedSearchFilter = new order.OrderSearchFilter();
            }
            OrderListController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.customerService.getShipTos().then(function (shipToCollection) { _this.getShipTosCompleted(shipToCollection); }, function (error) { _this.getShipTosFailed(error); });
                this.orderService.getOrderStatusMappings().then(function (orderStatusMappingCollection) { _this.getOrderStatusMappingCompleted(orderStatusMappingCollection); }, function (error) { _this.getOrderStatusMappingFailed(error); });
                this.initializeAutocomplete();
            };
            OrderListController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.orderSettings;
                this.initFromDate(settingsCollection.orderSettings.lookBackDays);
            };
            OrderListController.prototype.getSettingsFailed = function (error) {
            };
            OrderListController.prototype.getShipTosCompleted = function (shipToCollection) {
                this.shipTos = shipToCollection.shipTos;
            };
            OrderListController.prototype.getShipTosFailed = function (error) {
            };
            OrderListController.prototype.getOrderStatusMappingCompleted = function (orderStatusMappingCollection) {
                this.orderStatusMappings = {};
                for (var i = 0; i < orderStatusMappingCollection.orderStatusMappings.length; i++) {
                    var key = orderStatusMappingCollection.orderStatusMappings[i].displayName;
                    if (!this.orderStatusMappings[key]) {
                        this.orderStatusMappings[key] = [];
                    }
                    this.orderStatusMappings[key].push(orderStatusMappingCollection.orderStatusMappings[i].erpOrderStatus);
                }
            };
            OrderListController.prototype.getOrderStatusMappingFailed = function (error) {
            };
            OrderListController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.searchFilter.productErpNumber; });
                this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(function () { return _this.searchFilter.productErpNumber; }, "tst_ordersPage_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
            };
            OrderListController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (event) {
                    var dataItem = event.sender.dataItem(event.item.index());
                    _this.searchFilter.productErpNumber = dataItem.erpNumber;
                    dataItem.value = dataItem.erpNumber;
                };
            };
            OrderListController.prototype.initFromDate = function (lookBackDays) {
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                if (lookBackDays > 0) {
                    var tzOffset = (new Date()).getTimezoneOffset() * 60000;
                    var date = new Date(Date.now() - lookBackDays * 60 * 60 * 24 * 1000 - tzOffset);
                    this.searchFilter.fromDate = date.toISOString().split("T")[0];
                }
                this.restoreHistory();
                this.prepareSearchFilter();
                this.getOrders();
            };
            OrderListController.prototype.clear = function () {
                this.pagination.page = 1;
                this.searchFilter.customerSequence = "-1";
                this.searchFilter.sort = "OrderDate DESC,ErpOrderNumber DESC,WebOrderNumber DESC";
                this.searchFilter.toDate = "";
                this.searchFilter.fromDate = "";
                this.searchFilter.ponumber = "";
                this.searchFilter.ordernumber = "";
                this.searchFilter.search = "";
                this.searchFilter.ordertotaloperator = "";
                this.searchFilter.ordertotal = "";
                this.searchFilter.status = [];
                this.searchFilter.statusDisplay = "";
                this.searchFilter.productErpNumber = "";
                this.prepareSearchFilter();
                this.getOrders();
            };
            OrderListController.prototype.changeSort = function (sort) {
                if (this.searchFilter.sort === sort && this.searchFilter.sort.indexOf(" DESC") < 0) {
                    this.searchFilter.sort = sort.split(",").map(function (o) { return o + " DESC"; }).join(",");
                }
                else {
                    this.searchFilter.sort = sort;
                }
                this.getOrders();
            };
            OrderListController.prototype.search = function () {
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                this.prepareSearchFilter();
                this.getOrders();
            };
            OrderListController.prototype.getOrders = function () {
                var _this = this;
                this.appliedSearchFilter.sort = this.searchFilter.sort;
                this.coreService.replaceState({ filter: this.appliedSearchFilter, pagination: this.pagination });
                delete this.appliedSearchFilter.statusDisplay;
                this.orderService.getOrders(this.appliedSearchFilter, this.pagination, true).then(function (orderCollection) { _this.getOrdersCompleted(orderCollection); }, function (error) { _this.getOrdersFailed(error); });
            };
            OrderListController.prototype.getOrdersCompleted = function (orderCollection) {
                this.orderHistory = orderCollection;
                this.pagination = orderCollection.pagination;
            };
            OrderListController.prototype.getOrdersFailed = function (error) {
                this.validationMessage = error.exceptionMessage;
            };
            OrderListController.prototype.prepareSearchFilter = function () {
                for (var property in this.searchFilter) {
                    if (this.searchFilter.hasOwnProperty(property)) {
                        if (this.searchFilter[property] === "") {
                            this.appliedSearchFilter[property] = null;
                        }
                        else {
                            this.appliedSearchFilter[property] = this.searchFilter[property];
                        }
                    }
                }
                if (this.appliedSearchFilter.statusDisplay && this.orderStatusMappings && this.orderStatusMappings[this.appliedSearchFilter.statusDisplay]) {
                    this.appliedSearchFilter.status = this.orderStatusMappings[this.appliedSearchFilter.statusDisplay];
                }
            };
            OrderListController.prototype.restoreHistory = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    if (state.pagination) {
                        this.pagination = state.pagination;
                    }
                    if (state.filter) {
                        this.searchFilter = state.filter;
                        if (this.searchFilter.customerSequence === null) {
                            this.searchFilter.customerSequence = "-1";
                        }
                        if (this.searchFilter.statusDisplay === null) {
                            this.searchFilter.statusDisplay = "";
                        }
                    }
                }
            };
            OrderListController.$inject = ["orderService", "customerService", "coreService", "paginationService", "settingsService", "searchService"];
            return OrderListController;
        }());
        order.OrderListController = OrderListController;
        angular
            .module("insite")
            .controller("OrderListController", OrderListController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.order-list.controller.js.map