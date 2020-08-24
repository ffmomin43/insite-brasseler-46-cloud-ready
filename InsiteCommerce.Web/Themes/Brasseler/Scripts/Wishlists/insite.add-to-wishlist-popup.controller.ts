module insite.wishlist {
    "use strict";

    export class AddToWishlistPopupController {
        errorMessage: string;
        newWishListName: string;
        selectedWishList: WishListModel;
        addToWishlistCompleted: boolean;
        wishListCollection: WishListModel[];
        showWishlistNameErrorMessage: boolean;
        allowMultipleWishLists: boolean;
        isAuthenticated: boolean;
        popupId: string;
        productsToAdd: ProductDto[];
        isRememberedUser: boolean;
        isGuest: boolean;
        addingToList: boolean;
        wishListOptions: any;
        defaultPageSize = 20;
        totalWishListsCount: number;
        wishListSearch: string;
        wishListOptionsPlaceholder: string;
        private addToWishListPopupTimeout: number;
        enableWishListReminders: boolean;
        scheduleReminderAfterAdd: boolean;

        static $inject = ["wishListService", "coreService", "settingsService", "addToWishlistPopupService", "accessToken", "sessionService", "spinnerService", "scheduleReminderPopupService"];


        constructor(
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService,
            protected addToWishlistPopupService: AddToWishlistPopupService,
            protected accessToken: common.IAccessTokenService,
            protected sessionService: account.ISessionService,
            protected spinnerService: core.ISpinnerService,
            protected scheduleReminderPopupService: IUploadToListPopupService) {
        }

        $onInit(): void {
            this.productsToAdd = [];
            this.settingsService.getSettings().then(
                (settings: core.SettingsCollection) => { this.getSettingsCompleted(settings); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settings: core.SettingsCollection): void {
            this.addToWishListPopupTimeout = settings.cartSettings.addToCartPopupTimeout;
            this.allowMultipleWishLists = settings.wishListSettings.allowMultipleWishLists;
            this.enableWishListReminders = settings.wishListSettings.enableWishListReminders;

            this.sessionService.getSession().then((session: SessionModel) => {
                this.isAuthenticated = session.isAuthenticated;
                this.isRememberedUser = session.rememberMe;
                this.isGuest = session.isGuest;

                this.addToWishlistPopupService.registerDisplayFunction((data) => {
                    this.productsToAdd = data;
                    this.initialize();
                });
            });
        }

        protected getSettingsFailed(error: any): void {
        }

        initialize(): void {
            if (this.isAuthenticated || this.isRememberedUser) {
                this.clearMessages();
                this.newWishListName = "";
                this.selectedWishList = null;
                this.wishListSearch = "";
                this.scheduleReminderAfterAdd = false;
                if (this.allowMultipleWishLists) {
                    setTimeout(() => this.initWishListAutocompletes(), 0);
                    this.coreService.displayModal(angular.element("#popup-add-wishlist"));
                } else {
                    this.addWishList(this.newWishListName);
                }
            } else {
                this.coreService.displayModal(angular.element("#popup-add-wishlist"));
            }
        }

        protected getWishListCollectionFailed(error: any): void {
            this.errorMessage = error.message;
            this.spinnerService.hide();
        }

        clearMessages(): void {
            this.addToWishlistCompleted = false;
            this.errorMessage = "";
            this.showWishlistNameErrorMessage = false;
        }

        addWishList(wishListName: string): void {
            this.addingToList = true;
            this.wishListService.addWishList(wishListName).then(
                (newWishList: WishListModel) => { this.addWishListCompleted(newWishList); },
                (error: any) => { this.addWishListFailed(error); });
        }

        protected addWishListCompleted(newWishList: WishListModel): void {
            this.selectedWishList = newWishList;
            this.addProductsToWishList(newWishList);
        }

        protected addWishListFailed(error: any): void {
            this.addingToList = false;
            this.errorMessage = error.message;
        }

        addToWishList(): void {
            if (this.addingToList) {
                return;
            }

            this.clearMessages();
            if (this.selectedWishList) {
                this.addProductsToWishList(this.selectedWishList);
            } else {
                if (this.newWishListName && this.newWishListName.trim().length > 0) {
                    this.addWishList(this.newWishListName);
                } else {
                    this.showWishlistNameErrorMessage = true;
                }
            }
        }

        protected addProductsToWishList(wishList: WishListModel): void {
            this.addingToList = true;
            if (this.productsToAdd.length === 1) {
                this.addLineToWishList(wishList);
            } else {
                this.addLineCollectionToWishList(wishList);
            }
        }

        protected addLineToWishList(wishList: WishListModel): void {
            this.wishListService.addWishListLine(wishList, this.productsToAdd[0]).then(
                (wishListLine: WishListLineModel) => { this.addWishListLineCompleted(wishListLine); },
                (error: any) => { this.addWishListLineFailed(error); });
        }

        protected addWishListLineCompleted(wishListLine: WishListLineModel): void {
            this.completedAddingToWishList();
        }

        protected addWishListLineFailed(error: any): void {
            this.addingToList = false;
            this.errorMessage = error.message;
        }

        protected addLineCollectionToWishList(wishList: WishListModel): void {
            this.wishListService.addWishListLines(wishList, this.productsToAdd).then(
                (wishListLineCollection: WishListLineCollectionModel) => { this.addWishListLineCollectionCompleted(wishListLineCollection); },
                (error: any) => { this.addWishListLineCollectionFailed(error); });
        }

        protected addWishListLineCollectionCompleted(wishListLineCollection: WishListLineCollectionModel): void {
            this.completedAddingToWishList();
        }

        private completedAddingToWishList(): void {
            if (!this.allowMultipleWishLists) {
                this.coreService.displayModal(angular.element("#popup-add-wishlist"));
            }

            this.addToWishlistCompleted = true;
            this.addingToList = false;
            setTimeout(() => {
                if (this.addToWishlistCompleted) {
                    this.coreService.closeModal("#popup-add-wishlist");

                    if (this.scheduleReminderAfterAdd) {
                        this.wishListService.getListById(this.selectedWishList.id, "schedule", null, "listlines").then(
                            (listModel: WishListModel) => { this.getListCompleted(listModel); },
                            (error: any) => { this.getListFailed(error); });
                    }
                }
            }, this.addToWishListPopupTimeout);
        }

        protected addWishListLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
        }

        protected getListCompleted(listModel: WishListModel): void {
            setTimeout(() => {
                this.scheduleReminderPopupService.display(listModel);
            }, 100);
        }

        protected getListFailed(error: any): void {
        }

        protected openAutocomplete($event: ng.IAngularEvent, selector: string): void {
            const autoCompleteElement = angular.element(selector) as any;
            const kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
            kendoAutoComplete.popup.open();
        }

        initWishListAutocompletes(): void {
            const wishListValues = ["{{vm.defaultPageSize}}", "{{vm.totalWishListsCount}}"];
            this.wishListOptions = this.wishListOptions || {
                headerTemplate: this.renderMessage(wishListValues, "totalWishListCountTemplate"),
                dataSource: new kendo.data.DataSource({
                    serverFiltering: true,
                    serverPaging: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => {
                            this.onWishlistAutocompleteRead(options);
                        }
                    }
                }),
                select: (event: kendo.ui.AutoCompleteSelectEvent) => {
                    this.onWishlistAutocompleteSelect(event);
                },
                minLength: 0,
                dataTextField: "name",
                dataValueField: "id",
                placeholder: this.wishListOptionsPlaceholder
            };

            this.wishListOptions.dataSource.read();
        }

        protected onWishlistAutocompleteRead(options: kendo.data.DataSourceTransportReadOptions): void {
            this.spinnerService.show();
            this.wishListService.getWishLists(null, null, null, this.getDefaultPagination(), this.wishListSearch, "availabletoadd").then(
                (wishListCollection: WishListCollectionModel) => { this.getWishListCollectionCompleted(options, wishListCollection); },
                (error: any) => { this.getWishListCollectionFailed(error); });
        }

        protected onWishlistAutocompleteSelect(event: kendo.ui.AutoCompleteSelectEvent): void {
            if (event.item == null) {
                return;
            }

            const dataItem = event.sender.dataItem(event.item.index());
            this.selectedWishList = dataItem;
        }

        protected getWishListCollectionCompleted(options: kendo.data.DataSourceTransportReadOptions, wishListCollectionModel: WishListCollectionModel): void {
            const wishListCollection = wishListCollectionModel.wishListCollection;

            this.totalWishListsCount = wishListCollectionModel.pagination.totalItemCount;

            if (!this.hasWishlistWithLabel(wishListCollection, this.wishListSearch)) {
                this.selectedWishList = null;
            }

            // need to wrap this in setTimeout for prevent double scroll
            setTimeout(() => { options.success(wishListCollection); }, 0);
            this.spinnerService.hide();
        }

        protected getDefaultPagination(): PaginationModel {
            return { page: 1, pageSize: this.defaultPageSize } as PaginationModel;
        }

        hasWishlistWithLabel(wishLists: any, label: string): boolean {
            for (let i = 0; i < wishLists.length; i++) {
                if (wishLists[i].label === label) {
                    return true;
                }
            }

            return false;
        }

        renderMessage(values: string[], templateId: string): string {
            let template = angular.element(`#${templateId}`).html();
            for (var i = 0; i < values.length; i++) {
                template = template.replace(`{${i}}`, values[i]);
            }

            return template;
        }
    }

    export interface IAddToWishlistPopupService {
        display(data: any): void;
        registerDisplayFunction(p: (data: any) => void);
    }

    export class AddToWishlistPopupService extends base.BasePopupService<any> implements IAddToWishlistPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-add-to-wishlist-popup></isc-add-to-wishlist-popup>";
        }
    }

    angular
        .module("insite")
        .controller("AddToWishlistPopupController", AddToWishlistPopupController)
        .service("addToWishlistPopupService", AddToWishlistPopupService)
        .directive("iscAddToWishlistPopup", () => ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/WishList-AddToWishlistPopup",
            controller: "AddToWishlistPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}