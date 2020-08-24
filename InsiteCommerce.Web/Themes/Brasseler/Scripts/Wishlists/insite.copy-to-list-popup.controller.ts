module insite.wishlist {
    "use strict";

    export class CopyToListPopupController {
        errorMessage: string;
        newListName: string;
        selectedList: WishListModel;
        copyToListCompleted: boolean;
        copyInProgress: boolean;
        listCollection: WishListModel[];
        showListNameErrorMessage: boolean;
        mylistDetailModel: WishListModel;
        changedSharedListLinesQtys: { [key: string]: number };
        listName: string;
        listOptions: any;
        defaultPageSize = 20;
        totalListsCount: number;
        listSearch: string;
        listOptionsPlaceholder: string;

        static $inject = ["wishListService", "coreService", "copyToListPopupService", "spinnerService"];

        constructor(
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService,
            protected copyToListPopupService: ICopyToListPopupService,
            protected spinnerService: core.ISpinnerService) {
        }

        $onInit(): void {
            this.initializePopup();
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-copy-list");
        }

        initializePopup(): void {
            this.copyToListPopupService.registerDisplayFunction((data: ICopyToListModel) => {
                this.mylistDetailModel = data.list;
                this.changedSharedListLinesQtys = data.changedSharedListLinesQtys;
                this.coreService.displayModal(angular.element("#popup-copy-list"));
                this.selectedList = null;
                this.listSearch = "";
                this.clearMessages();
                this.newListName = "";
                setTimeout(() => this.initListAutocompletes(), 0);
            });
        }

        protected getListCollectionFailed(error: any): void {
            this.errorMessage = error.message;
            this.spinnerService.hide();
        }

        clearMessages(): void {
            this.copyInProgress = false;
            this.copyToListCompleted = false;
            this.errorMessage = "";
            this.showListNameErrorMessage = false;
        }

        addList(listName: string): void {
            this.wishListService.addWishList(listName).then(
                (list: WishListModel) => { this.addListCompleted(list); },
                (error: any) => { this.addListFailed(error); });
        }

        protected addListCompleted(list: WishListModel): void {
            this.addProductsToList(list);
        }

        protected addListFailed(error: any): void {
            this.errorMessage = error.message;
            this.copyInProgress = false;
        }

        copyToList(): void {
            this.clearMessages();
            this.copyInProgress = true;
            if (this.selectedList) {
                this.listName = this.selectedList.name;
                this.addProductsToList(this.selectedList);
            } else {
                if (this.newListName && this.newListName.trim().length > 0) {
                    this.listName = this.newListName;
                    this.addList(this.newListName);
                } else {
                    this.showListNameErrorMessage = true;
                    this.copyInProgress = false;
                }
            }
        }

        protected addProductsToList(list: WishListModel): void {
            if (this.mylistDetailModel.wishListLinesCount === 1) {
                this.addLineToList(list);
            } else {
                this.addLineCollectionToList(list);
            }
        }

        protected addLineToList(list: WishListModel): void {
            this.wishListService.addWishListLine(list, this.wishListService.mapWishListLinesToProducts(this.mylistDetailModel.wishListLineCollection)[0]).then(
                (listLine: WishListLineModel) => { this.addListLineCompleted(listLine); },
                (error: any) => { this.addListLineFailed(error); });
        }

        protected addListLineCompleted(listLine: WishListLineModel): void {
            this.copyToListCompleted = true;
        }

        protected addListLineFailed(error: any): void {
            this.errorMessage = error.message;
            this.copyInProgress = false;
        }

        protected addLineCollectionToList(list: WishListModel): void {
            this.wishListService.addAllWishListLines(list, this.mylistDetailModel.id, this.changedSharedListLinesQtys).then(
                (listLineCollection: WishListLineCollectionModel) => { this.addListLineCollectionCompleted(listLineCollection); },
                (error: any) => { this.addListLineCollectionFailed(error); });
        }

        protected addListLineCollectionCompleted(listLineCollection: WishListLineCollectionModel): void {
            this.copyToListCompleted = true;
        }

        protected addListLineCollectionFailed(error: any): void {
            this.errorMessage = error.message;
            this.copyInProgress = false;
        }

        protected openAutocomplete($event: ng.IAngularEvent, selector: string): void {
            const autoCompleteElement = angular.element(selector) as any;
            const kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
            kendoAutoComplete.popup.open();
        }

        initListAutocompletes(): void {
            const listValues = ["{{vm.defaultPageSize}}", "{{vm.totalListsCount}}"];
            this.listOptions = this.listOptions || {
                headerTemplate: this.renderMessage(listValues, "totalListCountTemplate"),
                dataSource: new kendo.data.DataSource({
                    serverFiltering: true,
                    serverPaging: true,
                    transport: {
                        read: (options: kendo.data.DataSourceTransportReadOptions) => {
                            this.onListAutocompleteRead(options);
                        }
                    }
                }),
                select: (event: kendo.ui.AutoCompleteSelectEvent) => {
                    this.onListAutocompleteSelect(event);
                },
                minLength: 0,
                dataTextField: "name",
                dataValueField: "id",
                placeholder: this.listOptionsPlaceholder
            };

            this.listOptions.dataSource.read();
        }

        protected onListAutocompleteRead(options: kendo.data.DataSourceTransportReadOptions): void {
            this.spinnerService.show();
            this.wishListService.getWishLists(null, null, null, this.getDefaultPagination(), this.listSearch, "availabletoadd").then(
                (listCollection: WishListCollectionModel) => { this.getListCollectionCompleted(options, listCollection); },
                (error: any) => { this.getListCollectionFailed(error); });
        }

        protected onListAutocompleteSelect(event: kendo.ui.AutoCompleteSelectEvent): void {
            if (event.item == null) {
                return;
            }

            const dataItem = event.sender.dataItem(event.item.index());
            this.selectedList = dataItem;
        }

        protected getListCollectionCompleted(options: kendo.data.DataSourceTransportReadOptions, listCollectionModel: WishListCollectionModel): void {
            const listCollection = listCollectionModel.wishListCollection.filter(o => o.id !== this.mylistDetailModel.id);

            this.totalListsCount = listCollectionModel.pagination.totalItemCount;

            if (!this.hasListWithLabel(listCollection, this.listSearch)) {
                this.selectedList = null;
            }

            // need to wrap this in setTimeout for prevent double scroll
            setTimeout(() => { options.success(listCollection); }, 0);
            this.spinnerService.hide();
        }

        protected getDefaultPagination(): PaginationModel {
            return { page: 1, pageSize: this.defaultPageSize } as PaginationModel;
        }

        hasListWithLabel(lists: any, label: string): boolean {
            for (let i = 0; i < lists.length; i++) {
                if (lists[i].label === label) {
                    return true;
                }
            }

            return false;
        }

        renderMessage(values: string[], templateId: string): string {
            let template = angular.element(`#${templateId}`).html();
            for (let i = 0; i < values.length; i++) {
                template = template.replace(`{${i}}`, values[i]);
            }

            return template;
        }
    }

    export interface ICopyToListModel {
        list: WishListModel;
        changedSharedListLinesQtys: { [key: string]: number };
    }

    export interface ICopyToListPopupService {
        display(data: ICopyToListModel): void;
        registerDisplayFunction(p: (data: ICopyToListModel) => void);
    }

    export class CopyToListPopupService extends base.BasePopupService<any> implements ICopyToListPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-copy-to-list-popup></isc-copy-to-list-popup>";
        }
    }

    angular
        .module("insite")
        .controller("CopyToListPopupController", CopyToListPopupController)
        .service("copyToListPopupService", CopyToListPopupService)
        .directive("iscCopyToListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CopyToListPopup",
            controller: "CopyToListPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}