module insite.useradministration {
    "use strict";

    export class UserShipToController {
        pageNumber = 1;
        pageSize = null;
        sort = "ShipTo";
        userProfileId: System.Guid;
        costCodeCollection: Insite.Account.Services.Dtos.CustomerCostCodeDto[];
        userShipToCollection: AccountShipToModel[];
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-UserShipTo";
        errorMessage = "";
        saveSuccess = false;

        static $inject = ["userService", "paginationService", "queryString"];

        constructor(
            protected userService: useradministration.IUserService,
            protected paginationService: core.IPaginationService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.userProfileId = this.queryString.get("userId");

            this.search();
        }

        search(): void {
            this.errorMessage = "";

            this.userService.getUserShipToCollection(this.userProfileId, this.pagination, this.sort).then(
                (accountShipToCollection: AccountShipToCollectionModel) => { this.getUserShipToCollectionCompleted(accountShipToCollection); },
                (error: any) => { this.getUserShipToCollectionFailed(error); });
        }

        protected getUserShipToCollectionCompleted(accountShipToCollection: AccountShipToCollectionModel): void {
            this.pagination = accountShipToCollection.pagination;
            this.costCodeCollection = accountShipToCollection.costCodeCollection;
            this.userShipToCollection = accountShipToCollection.userShipToCollection;
        }

        protected getUserShipToCollectionFailed(error: any): void {
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }

        saveShipToCollection(): void {
            this.errorMessage = "";
            this.saveSuccess = false;

            this.userService.applyUserShipToCollection(this.userProfileId, this.userShipToCollection).then(
                (accountShipToCollection: AccountShipToCollectionModel) => { this.applyUserShipToCollectionCompleted(accountShipToCollection); },
                (error: any) => { this.applyUserShipToCollectionFailed(error); });
        }

        protected applyUserShipToCollectionCompleted(accountShipToCollection: AccountShipToCollectionModel): void {
            this.saveSuccess = true;
        }

        protected applyUserShipToCollectionFailed(error: any): void {
            this.saveSuccess = false;
            this.errorMessage = "";
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }

        sortBy(sortKey: string): void {
            if (this.sort.indexOf(sortKey) >= 0) {
                this.sort = this.sort.indexOf("DESC") >= 0 ? sortKey : `${sortKey} DESC`;
            } else {
                this.sort = sortKey;
            }

            this.pagination.page = 1;
            this.search();
        }

        getSortClass(key: string): string {
            return this.sort.indexOf(key) >= 0 ?
                (this.sort.indexOf("DESC") >= 0 ? "sort-descending" : "sort-ascending") : "";
        }
    }

    angular
        .module("insite")
        .controller("UserShipToController", UserShipToController);
}