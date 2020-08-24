module insite.wishlist {
    "use strict";

    export class BrasselerCopyToListPopupController extends CopyToListPopupController {

        initializePopup(): void {
            this.copyToListPopupService.registerDisplayFunction((list: ICopyToListModel) => {
                this.mylistDetailModel = list;
                this.clearMessages();
                this.newListName = "";
                this.wishListService.getWishLists().then(
                    (listCollection: WishListCollectionModel) => { /*this.getListCollectionCompleted(listCollection.wishListCollection);*/ },
                    (error: any) => { this.getListCollectionFailed(error); });
            });
        }

        //protected getListCollectionCompleted(listCollection: WishListCollectionModel): void {
        //    this.listCollection = listCollection.wishListCollection.filter(o => o.id !== this.mylistDetailModel.list.id);
        //    this.coreService.displayModal(angular.element("#popup-copy-list"));//BUSA-1073 Moved popup call after service call
        //}


    }

    angular
        .module("insite")
        .controller("CopyToListPopupController", BrasselerCopyToListPopupController);
}