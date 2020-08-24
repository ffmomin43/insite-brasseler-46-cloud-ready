var insite;
(function (insite) {
    var common;
    (function (common) {
        "use strict";
        var QueryStringService = /** @class */ (function () {
            function QueryStringService() {
            }
            QueryStringService.prototype.get = function (key) {
                key = key.toLowerCase().replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                var regex = new RegExp("[\\?&]" + key + "=([^&#]*)", "i");
                var results = regex.exec(location.search);
                return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            };
            return QueryStringService;
        }());
        common.QueryStringService = QueryStringService;
        angular
            .module("insite-common")
            .service("queryString", QueryStringService);
    })(common = insite.common || (insite.common = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.query-string.service.js.map