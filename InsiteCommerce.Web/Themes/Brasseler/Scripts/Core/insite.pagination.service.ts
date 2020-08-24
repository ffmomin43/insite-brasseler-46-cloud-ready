module insite.core {
    "use strict";

    export interface IPaginationService {
        getDefaultPagination(storageKey: string, defaultValue?: PaginationModel): PaginationModel;
        setDefaultPagination(storageKey: string, pagination: PaginationModel);
    }

    export class PaginationService implements IPaginationService {
        static $inject = ["$localStorage"];

        constructor(protected $localStorage: common.IWindowStorage) {
        }

        getDefaultPagination(storageKey: string, defaultValue?: PaginationModel): PaginationModel {
            const pagination: PaginationModel = angular.fromJson(this.$localStorage.get(storageKey));

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
        }

        setDefaultPagination(storageKey: string, pagination: PaginationModel): void {
            this.$localStorage.set(storageKey, angular.toJson(pagination));
        }
    }

    angular
        .module("insite")
        .service("paginationService", PaginationService);
}