module insite {
    "use strict";

    export interface IContentPagerControllerAttributes extends ng.IAttributes {
        page: string;
        pageSize: string;
        defaultPageSize: string;
        totalItemCount: string;
        numberOfPages: string;
        contentItemId: string;
    }

    export class ContentPagerController {
        contentItemId = "";
        pagination: PaginationModel;
        showPreviousPageLink = false;
        showNextPageLink = false;

        static $inject = ["$attrs", "$location", "coreService"];

        constructor(
            protected $attrs: IContentPagerControllerAttributes,
            protected $location: ng.ILocationService,
            protected coreService: core.ICoreService) {
        }

        $onInit(): void {
            this.pagination = {
                currentPage: parseInt(this.$attrs.page, 10),
                page: parseInt(this.$attrs.page, 10),
                pageSize: parseInt(this.$attrs.pageSize, 10),
                defaultPageSize: parseInt(this.$attrs.defaultPageSize, 10),
                totalItemCount: parseInt(this.$attrs.totalItemCount, 10),
                numberOfPages: parseInt(this.$attrs.numberOfPages, 10),
                pageSizeOptions: [],
                sortOptions: [],
                sortType: "",
                nextPageUri: "",
                prevPageUri: ""
            };
            this.contentItemId = this.$attrs.contentItemId.toString();
            this.showPreviousPageLink = this.pagination.page > 1;
            this.showNextPageLink = this.pagination.page < this.pagination.numberOfPages;
            this.calculatePageSizeOptions();
        }

        protected calculatePageSizeOptions(): void {
            const numberOfOptions = 4;

            for (let i = 1; i <= numberOfOptions; i++) {
                this.pagination.pageSizeOptions.push(this.pagination.defaultPageSize * i);
            }
        }

        showPager(): boolean {
            return this.pagination.numberOfPages > 0;
        }

        updatePageSize(): void {
            this.reloadListStartingAtPage(1);
        }

        pageInput(): void {
            let goToPage = 1;

            if (this.pagination.page > this.pagination.numberOfPages) {
                goToPage = this.pagination.numberOfPages;
            } else if (this.pagination.page < 1) {
                goToPage = 1;
            }

            this.reloadListStartingAtPage(goToPage);
        }

        previousPage(): void {
            this.reloadListStartingAtPage(this.pagination.page - 1);
        }

        nextPage(): void {
            this.reloadListStartingAtPage(this.pagination.page + 1);
        }

        protected reloadListStartingAtPage(page: number): void {
            this.coreService.redirectToPathAndRefreshPage(this.$location.path() + `?${this.contentItemId}_page=${page}&${this.contentItemId}_pageSize=${this.pagination.pageSize}`);
        }
    }

    angular
        .module("insite")
        .controller("ContentPagerController", ContentPagerController);
}