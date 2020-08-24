var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var PagerController = /** @class */ (function () {
            function PagerController(paginationService, $window) {
                this.paginationService = paginationService;
                this.$window = $window;
            }
            PagerController.prototype.showPager = function () {
                return this.pagination && (this.showPerPage() || this.showPagination() || this.showSortSelector());
            };
            PagerController.prototype.showSortSelector = function () {
                return !this.bottom && this.pagination.sortOptions != null && this.pagination.sortOptions.length > 1;
            };
            PagerController.prototype.showPerPage = function () {
                return !this.bottom && this.pagination.totalItemCount > this.pagination.defaultPageSize;
            };
            PagerController.prototype.showPagination = function () {
                return this.pagination.numberOfPages > 1;
            };
            PagerController.prototype.nextPage = function () {
                this.scrollToTopPager();
                this.pagination.page = Number(this.pagination.page) + 1;
                if (this.pageChanged) {
                    this.pageChanged();
                }
                this.updateData();
                return false;
            };
            PagerController.prototype.prevPage = function () {
                this.scrollToTopPager();
                this.pagination.page -= 1;
                if (this.pageChanged) {
                    this.pageChanged();
                }
                this.updateData();
                return false;
            };
            PagerController.prototype.pageInput = function () {
                this.scrollToTopPager();
                if (this.pagination.page > this.pagination.numberOfPages) {
                    this.pagination.page = this.pagination.numberOfPages;
                }
                else if (this.pagination.page < 1) {
                    this.pagination.page = 1;
                }
                if (this.pageChanged) {
                    this.pageChanged();
                }
                this.updateData();
            };
            PagerController.prototype.updatePageSize = function () {
                if (this.storageKey) {
                    this.paginationService.setDefaultPagination(this.storageKey, this.pagination);
                }
                this.pagination.page = 1;
                if (this.pageChanged) {
                    this.pageChanged();
                }
                this.updateData();
            };
            PagerController.prototype.updateSortOrder = function () {
                this.pagination.page = 1;
                if (this.pageChanged) {
                    this.pageChanged();
                }
                this.updateData();
            };
            PagerController.prototype.toggleSortingMode = function () {
                this.isSortingMode = !this.isSortingMode;
            };
            PagerController.prototype.scrollToTopPager = function () {
                angular.element("html, body").animate({
                    scrollTop: angular.element(".pager-wrapper").offset().top
                }, 100);
            };
            PagerController.$inject = ["paginationService", "$window"];
            return PagerController;
        }());
        core.PagerController = PagerController;
        angular
            .module("insite")
            .controller("PagerController", PagerController);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.pager.controller.js.map