var insite;
(function (insite) {
    var requisitions;
    (function (requisitions) {
        "use strict";
        var RequisitionService = /** @class */ (function () {
            function RequisitionService($http, httpWrapperService) {
                this.$http = $http;
                this.httpWrapperService = httpWrapperService;
                this.serviceUri = "/api/v1/requisitions";
            }
            RequisitionService.prototype.getRequisitions = function (pagination) {
                var filter = {};
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getRequisitionsParams(filter, pagination) }), this.getRequisitionsCompleted, this.getRequisitionsFailed);
            };
            RequisitionService.prototype.getRequisitionsParams = function (filter, pagination) {
                var params = filter ? JSON.parse(JSON.stringify(filter)) : {};
                if (pagination) {
                    params.page = pagination.page;
                    params.pageSize = pagination.pageSize;
                }
                return params;
            };
            RequisitionService.prototype.getRequisitionsCompleted = function (response) {
            };
            RequisitionService.prototype.getRequisitionsFailed = function (error) {
            };
            RequisitionService.prototype.getRequisition = function (requisitionId) {
                var uri = this.serviceUri + "/" + requisitionId;
                var expand = "requisitionLines";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getRequisitionParams(expand) }), this.getRequisitionCompleted, this.getRequisitionFailed);
            };
            RequisitionService.prototype.getRequisitionParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            RequisitionService.prototype.getRequisitionCompleted = function (response) {
            };
            RequisitionService.prototype.getRequisitionFailed = function (error) {
            };
            RequisitionService.prototype.getRequisitionCount = function () {
                var uri = this.serviceUri;
                var expand = "pageSize=1";
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ url: uri, method: "GET", params: this.getRequisitionCountParams(expand) }), this.getRequisitionCountCompleted, this.getRequisitionCountFailed);
            };
            RequisitionService.prototype.getRequisitionCountParams = function (expand) {
                return expand ? { expand: expand } : {};
            };
            RequisitionService.prototype.getRequisitionCountCompleted = function (response) {
            };
            RequisitionService.prototype.getRequisitionCountFailed = function (error) {
            };
            RequisitionService.prototype.patchRequisition = function (requisition) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: requisition.uri, data: requisition }), this.patchRequisitionCompleted, this.patchRequisitionFailed);
            };
            RequisitionService.prototype.patchRequisitionCompleted = function (response) {
            };
            RequisitionService.prototype.patchRequisitionFailed = function (error) {
            };
            RequisitionService.prototype.patchRequisitionLine = function (requisitionLine) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "PATCH", url: requisitionLine.uri, data: requisitionLine }), this.patchRequisitionLineCompleted, this.patchRequisitionLineFailed);
            };
            RequisitionService.prototype.patchRequisitionLineCompleted = function (response) {
            };
            RequisitionService.prototype.patchRequisitionLineFailed = function (error) {
            };
            RequisitionService.prototype.deleteRequisitionLine = function (requisitionLine) {
                return this.httpWrapperService.executeHttpRequest(this, this.$http.delete(requisitionLine.uri), this.deleteRequisitionLineCompleted, this.deleteRequisitionLineFailed);
            };
            RequisitionService.prototype.deleteRequisitionLineCompleted = function (response) {
            };
            RequisitionService.prototype.deleteRequisitionLineFailed = function (error) {
            };
            RequisitionService.$inject = ["$http", "httpWrapperService"];
            return RequisitionService;
        }());
        requisitions.RequisitionService = RequisitionService;
        angular
            .module("insite")
            .service("requisitionService", RequisitionService);
    })(requisitions = insite.requisitions || (insite.requisitions = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.requisition.service.js.map