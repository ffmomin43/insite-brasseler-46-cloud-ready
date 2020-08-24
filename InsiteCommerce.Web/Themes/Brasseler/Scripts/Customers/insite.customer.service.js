var insite;
(function (insite) {
    var customers;
    (function (customers) {
        "use strict";
        var CustomerService = /** @class */ (function () {
            function CustomerService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/billtos";
            }
            CustomerService.prototype.getBillTos = function (expand, filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: this.serviceUri, method: "GET", params: this.getBillTosParams(expand, filter, pagination) }), this.getBillTosCompleted, this.getBillTosFailed);
            };
            CustomerService.prototype.getBillTosParams = function (expand, filter, pagination) {
                var params = {
                    expand: expand,
                    filter: encodeURIComponent(filter || "")
                };
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            CustomerService.prototype.getBillTosCompleted = function (response) {
            };
            CustomerService.prototype.getBillTosFailed = function (error) {
            };
            CustomerService.prototype.getBillTo = function (expand) {
                var uri = this.serviceUri + "/current";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getBillToParams(expand) }), this.getBillToCompleted, this.getBillToFailed);
            };
            CustomerService.prototype.getBillToParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            CustomerService.prototype.getBillToCompleted = function (response) {
            };
            CustomerService.prototype.getBillToFailed = function (error) {
            };
            CustomerService.prototype.updateBillTo = function (billTo) {
                var patchBillTo = {};
                angular.extend(patchBillTo, billTo);
                delete patchBillTo.shipTos;
                delete patchBillTo.budgetEnforcementLevel;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: patchBillTo.uri, data: patchBillTo }), this.updateBillToCompleted, this.updateBillToFailed);
            };
            CustomerService.prototype.updateBillToCompleted = function (response) {
            };
            CustomerService.prototype.updateBillToFailed = function (error) {
            };
            CustomerService.prototype.updateEnforcementLevel = function (billTo) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: billTo.uri, data: billTo }), this.updateEnforcementLevelCompleted, this.updateEnforcementLevelFailed);
            };
            CustomerService.prototype.updateEnforcementLevelCompleted = function (response) {
            };
            CustomerService.prototype.updateEnforcementLevelFailed = function (error) {
            };
            CustomerService.prototype.getShipTos = function (expand, filter, pagination, billToId) {
                var uri = this.serviceUri;
                if (!billToId) {
                    uri += "/current/shiptos";
                }
                else {
                    uri += "/" + billToId + "/shiptos";
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getShipTosParams(expand, filter, pagination) }), this.getShipTosCompleted, this.getShipTosFailed);
            };
            CustomerService.prototype.getShipTosParams = function (expand, filter, pagination) {
                var params = {
                    expand: expand,
                    filter: encodeURIComponent(filter || "")
                };
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            CustomerService.prototype.getShipTosCompleted = function (response) {
            };
            CustomerService.prototype.getShipTosFailed = function (error) {
            };
            CustomerService.prototype.getShipTo = function (expand) {
                var uri = this.serviceUri + "/current/shiptos/current";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getShipToParams(expand) }), this.getShipToCompleted, this.getShipToFailed);
            };
            CustomerService.prototype.getShipToParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            CustomerService.prototype.getShipToCompleted = function (response) {
            };
            CustomerService.prototype.getShipToFailed = function (error) {
            };
            CustomerService.prototype.addOrUpdateShipTo = function (shipTo) {
                var patchShipTo = {};
                angular.extend(patchShipTo, shipTo);
                var operation = "PATCH";
                if (patchShipTo.isNew) {
                    operation = "POST";
                    patchShipTo.uri = this.serviceUri + "/current/shiptos";
                }
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: operation, url: patchShipTo.uri, data: patchShipTo }), this.addOrUpdateShipToCompleted, this.addOrUpdateShipToFailed);
            };
            CustomerService.prototype.addOrUpdateShipToCompleted = function (response) {
            };
            CustomerService.prototype.addOrUpdateShipToFailed = function (error) {
            };
            CustomerService.$inject = ["$http", "httpWrapperService"];
            return CustomerService;
        }());
        customers.CustomerService = CustomerService;
        angular
            .module("insite")
            .service("customerService", CustomerService);
    })(customers = insite.customers || (insite.customers = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.customer.service.js.map