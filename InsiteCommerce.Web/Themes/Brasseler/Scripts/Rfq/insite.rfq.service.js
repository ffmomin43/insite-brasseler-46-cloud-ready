var insite;
(function (insite) {
    var rfq;
    (function (rfq) {
        "use strict";
        var RfqService = /** @class */ (function () {
            function RfqService($http, $q, httpWrapperService) {
                this.$http = $http;
                this.$q = $q;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/quotes/";
                this.messageUri = "/api/v1/messages/";
            }
            RfqService.prototype.getQuotes = function (filter, pagination) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getQuotesParams(filter, pagination) }), this.getQuotesCompleted, this.getQuotesFailed);
            };
            RfqService.prototype.getQuotesParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (this.expand) {
                    params.expand = this.expand;
                }
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            RfqService.prototype.getQuotesCompleted = function (response) {
            };
            RfqService.prototype.getQuotesFailed = function (error) {
            };
            RfqService.prototype.getQuote = function (quoteId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(this.serviceUri + quoteId), this.getQuoteCompleted, this.getQuoteFailed);
            };
            RfqService.prototype.getQuoteCompleted = function (response) {
            };
            RfqService.prototype.getQuoteFailed = function (error) {
            };
            RfqService.prototype.submitQuote = function (quote) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.serviceUri, data: quote }), this.submitQuoteCompleted, this.submitQuoteFailed);
            };
            RfqService.prototype.submitQuoteCompleted = function (response) {
            };
            RfqService.prototype.submitQuoteFailed = function (error) {
            };
            RfqService.prototype.removeQuote = function (quoteId) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "DELETE", url: this.serviceUri + "/" + quoteId }), this.removeQuoteCompleted, this.removeQuoteFailed);
            };
            RfqService.prototype.removeQuoteCompleted = function (response) {
            };
            RfqService.prototype.removeQuoteFailed = function (error) {
            };
            RfqService.prototype.updateQuote = function (quote) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: this.serviceUri + quote.quoteId, data: quote }), this.updateQuoteCompleted, this.updateQuoteFailed);
            };
            RfqService.prototype.updateQuoteCompleted = function (response) {
            };
            RfqService.prototype.updateQuoteFailed = function (error) {
            };
            RfqService.prototype.updateQuoteLine = function (quoteLine) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: quoteLine.uri, data: quoteLine }), this.updateQuoteLineCompleted, this.updateQuoteLineFailed);
            };
            RfqService.prototype.updateQuoteLineCompleted = function (response) {
            };
            RfqService.prototype.updateQuoteLineFailed = function (error) {
            };
            RfqService.prototype.submitRfqMessage = function (rfqMessage) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "POST", url: this.messageUri, data: rfqMessage }), this.submitRfqMessageCompleted, this.submitRfqMessageFailed);
            };
            RfqService.prototype.submitRfqMessageCompleted = function (response) {
            };
            RfqService.prototype.submitRfqMessageFailed = function (error) {
            };
            RfqService.$inject = ["$http", "$q", "httpWrapperService"];
            return RfqService;
        }());
        rfq.RfqService = RfqService;
        angular
            .module("insite")
            .service("rfqService", RfqService);
    })(rfq = insite.rfq || (insite.rfq = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.rfq.service.js.map