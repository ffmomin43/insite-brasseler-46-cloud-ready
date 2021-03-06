﻿module insite.wishlist {
    "use strict";

    export class BrasselerMyListDetailController extends MyListDetailController{

        static $inject = [
            "$scope",
            "settingsService",
            "queryString",
            "wishListService",
            "cartService",
            "productService",
            "sessionService",
            "$timeout",
            "$interval",
            "coreService",
            "spinnerService",
            "$location",
            "shareListPopupService",
            "uploadToListPopupService",
            "$localStorage",
            "searchService",
            "productPriceService",
            "paginationService",
            "$templateCache",
            "scheduleReminderPopupService",
            "createListPopupService",
            "deleteListPopupService",
            "copyToListPopupService",
            "listQuantityAdjustmentPopupService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected wishListService: IWishListService,
            protected cartService: cart.ICartService,
            protected productService: catalog.IProductService,
            protected sessionService: account.ISessionService,
            protected $timeout: ng.ITimeoutService,
            protected $interval: ng.IIntervalService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected $location: ng.ILocationService,
            protected shareListPopupService: IShareListPopupService,
            protected uploadToListPopupService: IUploadToListPopupService,
            protected $localStorage: common.IWindowStorage,
            protected searchService: catalog.ISearchService,
            protected productPriceService: catalog.IProductPriceService,
            protected paginationService: core.IPaginationService,
            protected $templateCache: ng.ITemplateCacheService,
            protected scheduleReminderPopupService: IUploadToListPopupService,
            protected createListPopupService: ICreateListPopupService,
            protected deleteListPopupService: IDeleteListPopupService,
            protected copyToListPopupService: ICopyToListPopupService,
            protected listQuantityAdjustmentPopupService: IListQuantityAdjustmentPopupService
        ) {
            super(
                $scope,
                settingsService,
                queryString,
                wishListService,
                cartService,
                productService,
                sessionService,
                $timeout,
                $interval,
                coreService,
                spinnerService,
                $location,
                shareListPopupService,
                uploadToListPopupService,
                $localStorage,
                searchService,
                productPriceService,
                paginationService,
                $templateCache,
                scheduleReminderPopupService,
                createListPopupService,
                deleteListPopupService,
                copyToListPopupService,
                listQuantityAdjustmentPopupService
            );
            super.$onInit();
        }

        displayPopup(htmlElement: string) {
            this.coreService.displayModal(htmlElement);
        }

        protected addLineFailed(error: any): void {
            this.errorMessage = error.message;
        }

        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
            this.errorMessage = error.message;
        }
    }


    angular
        .module("insite")
        .controller("MyListDetailController", BrasselerMyListDetailController);
}