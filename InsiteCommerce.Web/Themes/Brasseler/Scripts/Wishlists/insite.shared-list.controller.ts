module insite.wishlist {
    "use strict";

    export class SharedListController {
        static $inject = ["$scope", "shareDetailsPopupService", "manageSharingPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected shareDetailsPopupService: IShareDetailsPopupService,
            protected manageSharingPopupService: IManageSharingPopupService) {
        }

        $onInit(): void {
            this.updateScopeList();
        }

        shareDetailsLinkIsVisible(list: WishListModel): boolean {
            return (list.shareOption === ShareOptionEnum[ShareOptionEnum.IndividualUsers] && list.wishListSharesCount > 1) ||
                list.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers] && !list.isGlobal;
        }

        showShareDetails(list: WishListModel): void {
            this.shareDetailsPopupService.display(list);
        }

        showManageSharing(list: WishListModel, session: SessionModel): void {
            this.manageSharingPopupService.display({ list: list, session: session });
        }

        private updateScopeList(): void {
            this.$scope.$on("listWasUpdated", (event, list: WishListModel) => {
                let scopeList: WishListModel = (<any>this.$scope).list;
                if (scopeList.id === list.id) {
                    if (list.wishListSharesCount || list.wishListSharesCount === 0) {
                        scopeList.wishListSharesCount = list.wishListSharesCount;
                    }
                    if (list.allowEdit === true || list.allowEdit === false) {
                        scopeList.allowEdit = list.allowEdit;
                    }
                    if (list.shareOption) {
                        scopeList.shareOption = list.shareOption;
                    }
                }
            });
        }
    }
}