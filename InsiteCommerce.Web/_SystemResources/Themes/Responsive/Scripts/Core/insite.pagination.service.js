var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var PaginationService = /** @class */ (function () {
            function PaginationService($localStorage) {
                this.$localStorage = $localStorage;
            }
            PaginationService.prototype.getDefaultPagination = function (storageKey, defaultValue) {
                var pagination = angular.fromJson(this.$localStorage.get(storageKey));
                if (!pagination) {
                    return defaultValue;
                }
                if (!defaultValue) {
                    pagination.page = 1; // For now ignore page number
                    pagination.totalItemCount = 0;
                    return pagination;
                }
                defaultValue.pageSize = pagination.pageSize;
                return defaultValue;
            };
            PaginationService.prototype.setDefaultPagination = function (storageKey, pagination) {
                this.$localStorage.set(storageKey, angular.toJson(pagination));
            };
            PaginationService.$inject = ["$localStorage"];
            return PaginationService;
        }());
        core.PaginationService = PaginationService;
        angular
            .module("insite")
            .service("paginationService", PaginationService);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.pagination.service.js.map