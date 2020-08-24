var GetOutstandingInvoicesDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.GetOutstandingInvoicesDto;
var GetOutstandingOrderDto = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.GetOutstandingOrderDto;
var OutstandingOrderModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OutstandingOrderModel;
var OutstandingOrder = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OutstandingOrder;
var OrderHeaderModel = InSiteCommerce.Brasseler.CustomAPI.WebApi.ApiModels.OrderHeaderModel;
var ArOpenInvoicesResult = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.AROpenInvoicesResultDto;
var ArOpenInvoices = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.AROpenInvoicesDto;
var OpenInvoice = InSiteCommerce.Brasseler.CustomAPI.WebApi.Dtos.Invoices;
var insite;
(function (insite) {
    var outstandinginvoices;
    (function (outstandinginvoices) {
        "use strict";
        var OutstandingInvoicesService = /** @class */ (function () {
            function OutstandingInvoicesService($http, $rootScope, httpWrapperService) {
                this.$http = $http;
                this.$rootScope = $rootScope;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/outstandinginvoices";
                this.orderUri = "/api/v1/getoutstandingorder";
            }
            OutstandingInvoicesService.prototype.getInvoices = function (filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getInvoicesParams(filter, pagination) }), this.getInvoicesCompleted, this.getInvoicesFailed);
            };
            OutstandingInvoicesService.prototype.getOutstandingInvoices = function (filter, pagination, getOutstandingInvoicesDto) {
                var _this = this;
                var postUrl = this.serviceUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: getOutstandingInvoicesDto, params: this.getOutstandingInvoicesParams(filter, pagination), bypassErrorInterceptor: true }), function (response) { _this.outstandingInvoicesDTOCompleted(response); }, this.outstandingInvoicesDTOFailed);
            };
            OutstandingInvoicesService.prototype.outstandingInvoicesDTOCompleted = function (response) {
            };
            OutstandingInvoicesService.prototype.outstandingInvoicesDTOFailed = function (error) {
            };
            OutstandingInvoicesService.prototype.getOutstandingInvoicesParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            OutstandingInvoicesService.prototype.getOutstandingBalance = function (filter, getOutstandingInvoicesDto) {
                var _this = this;
                var postUrl = this.serviceUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: getOutstandingInvoicesDto, params: this.getOutstandingBalanceParams(filter), bypassErrorInterceptor: true }), function (response) { _this.getOutstandingBalanceDTOCompleted(response); }, this.getOutstandingBalanceDTOFailed);
            };
            OutstandingInvoicesService.prototype.getOutstandingBalanceParams = function (filter) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                return params;
            };
            OutstandingInvoicesService.prototype.getOutstandingBalanceDTOCompleted = function (response) {
            };
            OutstandingInvoicesService.prototype.getOutstandingBalanceDTOFailed = function (error) {
            };
            OutstandingInvoicesService.prototype.getOutstandingOrder = function (filter, getOutstandingOrderDto) {
                var _this = this;
                var postUrl = this.orderUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: postUrl, data: getOutstandingOrderDto, params: this.getOutstandingBalanceParams(filter), bypassErrorInterceptor: true }), function (response) { _this.getOutstandingOrderCompleted(response); }, this.getOutstandingOrderFailed);
            };
            OutstandingInvoicesService.prototype.getOutstandingOrderParams = function (filter) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                return params;
            };
            OutstandingInvoicesService.prototype.getOutstandingOrderCompleted = function (response) {
            };
            OutstandingInvoicesService.prototype.getOutstandingOrderFailed = function (error) {
            };
            OutstandingInvoicesService.prototype.getInvoicesParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            OutstandingInvoicesService.prototype.getInvoicesCompleted = function (response) {
            };
            OutstandingInvoicesService.prototype.getInvoicesFailed = function (error) {
            };
            OutstandingInvoicesService.prototype.getInvoice = function (invoiceId, expand) {
                var uri = this.serviceUri + "/" + invoiceId;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: uri, params: this.getInvoiceParams(expand) }), this.getInvoiceCompleted, this.getInvoiceFailed);
            };
            OutstandingInvoicesService.prototype.getInvoiceParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            OutstandingInvoicesService.prototype.getInvoiceCompleted = function (response) {
            };
            OutstandingInvoicesService.prototype.getInvoiceFailed = function (error) {
            };
            OutstandingInvoicesService.$inject = ["$http", "$rootScope", "httpWrapperService"];
            return OutstandingInvoicesService;
        }());
        outstandinginvoices.OutstandingInvoicesService = OutstandingInvoicesService;
        angular
            .module("insite")
            .service("outstandingInvoicesService", OutstandingInvoicesService);
    })(outstandinginvoices = insite.outstandinginvoices || (insite.outstandinginvoices = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.outstanding-invoices.service.js.map