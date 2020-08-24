var insite;
(function (insite) {
    "use strict";
    var ContentPagerController = /** @class */ (function () {
        function ContentPagerController($attrs, $location, coreService) {
            this.$attrs = $attrs;
            this.$location = $location;
            this.coreService = coreService;
            this.contentItemId = "";
            this.showPreviousPageLink = false;
            this.showNextPageLink = false;
        }
        ContentPagerController.prototype.$onInit = function () {
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
        };
        ContentPagerController.prototype.calculatePageSizeOptions = function () {
            var numberOfOptions = 4;
            for (var i = 1; i <= numberOfOptions; i++) {
                this.pagination.pageSizeOptions.push(this.pagination.defaultPageSize * i);
            }
        };
        ContentPagerController.prototype.showPager = function () {
            return this.pagination.numberOfPages > 0;
        };
        ContentPagerController.prototype.updatePageSize = function () {
            this.reloadListStartingAtPage(1);
        };
        ContentPagerController.prototype.pageInput = function () {
            var goToPage = 1;
            if (this.pagination.page > this.pagination.numberOfPages) {
                goToPage = this.pagination.numberOfPages;
            }
            else if (this.pagination.page < 1) {
                goToPage = 1;
            }
            this.reloadListStartingAtPage(goToPage);
        };
        ContentPagerController.prototype.previousPage = function () {
            this.reloadListStartingAtPage(this.pagination.page - 1);
        };
        ContentPagerController.prototype.nextPage = function () {
            this.reloadListStartingAtPage(this.pagination.page + 1);
        };
        ContentPagerController.prototype.reloadListStartingAtPage = function (page) {
            this.coreService.redirectToPathAndRefreshPage(this.$location.path() + ("?" + this.contentItemId + "_page=" + page + "&" + this.contentItemId + "_pageSize=" + this.pagination.pageSize));
        };
        ContentPagerController.$inject = ["$attrs", "$location", "coreService"];
        return ContentPagerController;
    }());
    insite.ContentPagerController = ContentPagerController;
    angular
        .module("insite")
        .controller("ContentPagerController", ContentPagerController);
})(insite || (insite = {}));
//# sourceMappingURL=insite.content-pager.controller.js.map