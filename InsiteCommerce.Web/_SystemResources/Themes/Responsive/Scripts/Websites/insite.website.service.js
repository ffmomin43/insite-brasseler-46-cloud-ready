var insite;
(function (insite) {
    var websites;
    (function (websites) {
        "use strict";
        var WebsiteService = /** @class */ (function () {
            function WebsiteService($http, httpWrapperService, sessionService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.sessionService = sessionService;
                this.serviceUri = "/api/v1/websites/current";
                this.init();
            }
            WebsiteService.prototype.init = function () {
                var context = this.sessionService.getContext();
                if (context) {
                    this.languageId = context.languageId;
                }
                else {
                    // if called before context is set, just set to empty, this is only used to vary the cache by language and not server side
                    this.languageId = guidHelper.emptyGuid();
                }
            };
            WebsiteService.prototype.getWebsite = function (expand) {
                var uri = this.serviceUri;
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getWebsiteParams(expand) }), this.getWebsiteCompleted, this.getWebsiteFailed);
            };
            WebsiteService.prototype.getWebsiteParams = function (expand) {
                return expand ? { languageId: this.languageId, expand: expand } : { languageId: this.languageId };
            };
            WebsiteService.prototype.getWebsiteCompleted = function (response) {
            };
            WebsiteService.prototype.getWebsiteFailed = function (error) {
            };
            WebsiteService.prototype.getCountries = function (expand) {
                var uri = this.serviceUri + "/countries";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getCountriesParams(expand) }), this.getCountriesCompleted, this.getCountriesFailed);
            };
            WebsiteService.prototype.getCountriesParams = function (expand) {
                return expand ? { languageId: this.languageId, expand: expand } : { languageId: this.languageId };
            };
            WebsiteService.prototype.getCountriesCompleted = function (response) {
            };
            WebsiteService.prototype.getCountriesFailed = function (error) {
            };
            WebsiteService.prototype.getAddressFields = function () {
                var uri = this.serviceUri + "/addressfields";
                return this.httpWrapperService.executeHttpRequest(this, this.$http.get(uri), this.getAddressFieldsCompleted, this.getAddressFieldsFailed);
            };
            WebsiteService.prototype.getAddressFieldsCompleted = function (response) {
            };
            WebsiteService.prototype.getAddressFieldsFailed = function (error) {
            };
            WebsiteService.$inject = ["$http", "httpWrapperService", "sessionService"];
            return WebsiteService;
        }());
        websites.WebsiteService = WebsiteService;
        angular
            .module("insite")
            .service("websiteService", WebsiteService);
    })(websites = insite.websites || (insite.websites = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.website.service.js.map