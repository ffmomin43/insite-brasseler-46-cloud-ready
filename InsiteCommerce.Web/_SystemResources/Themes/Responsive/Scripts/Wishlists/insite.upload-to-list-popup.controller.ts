module insite.wishlist {
    "use strict";
    import WishListModel = Insite.WishLists.WebApi.V1.ApiModels.WishListModel;
    import ProductDto = Insite.Catalog.Services.Dtos.ProductDto;
    import UploadError = common.UploadError;

    export class UploadToListPopupController extends common.BaseUploadController {
        list: WishListModel;

        static $inject = ["$rootScope", "$scope", "productService", "wishListService", "coreService", "uploadToListPopupService", "settingsService"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected $scope: ng.IScope,
            protected productService: catalog.IProductService,
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected uploadToListPopupService: IUploadToListPopupService,
            protected settingsService: core.ISettingsService) {
            super($scope, productService, coreService, settingsService);
            this.uploadToListPopupService.registerDisplayFunction((list: WishListModel) => {
                this.cleanupUploadData();
                this.badFile = false;
                this.uploadLimitExceeded = false;
                this.list = list;
                this.coreService.displayModal(angular.element("#popup-upload-list"));
            });
        }

        protected uploadProducts(popupSelector?: string): void {
            super.uploadProducts(popupSelector);
            this.wishListService.addWishListLines(this.list, this.products).then(
                (lineCollection: WishListLineCollectionModel) => { this.uploadingCompleted(lineCollection) },
                (error: any) => { this.uploadingFailed(error)});
        }

        protected validateProduct(product: ProductDto): UploadError {
            if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                return UploadError.ConfigurableProduct;
            }

            if (product.isStyleProductParent) {
                return UploadError.StyledProduct;
            }

            return UploadError.None;
        }

        protected uploadingCompleted(data: any): void {
            super.uploadingCompleted(data);
            this.$rootScope.$broadcast("UploadingItemsToListCompleted");
        }

        protected showUploadingPopup() {
            this.coreService.displayModal(angular.element("#listUploadingPopup"));
        }

        protected hideUploadingPopup() {
            this.coreService.closeModal("#listUploadingPopup");
        }

        protected showUploadSuccessPopup() {
            this.coreService.displayModal(angular.element("#listUploadSuccessPopup"));
        }

        protected hideUploadSuccessPopup() {
            this.cleanupUploadData();

            this.coreService.closeModal("#listUploadSuccessPopup");
        }

        protected showUploadingIssuesPopup() {
            this.coreService.displayModal(angular.element("#listUploadingIssuesPopup"));
        }

        protected hideUploadingIssuesPopup() {
            this.coreService.closeModal("#listUploadingIssuesPopup");
        }
    }

    export interface IUploadToListPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class UploadToListPopupService extends base.BasePopupService<any> implements IUploadToListPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-upload-to-list-popup></isc-upload-to-list-popup>";
        }
    }

    angular
        .module("insite")
        .controller("UploadToListPopupController", UploadToListPopupController)
        .service("uploadToListPopupService", UploadToListPopupService)
        .directive("iscUploadToListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-UploadToListPopup",
            controller: "UploadToListPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}