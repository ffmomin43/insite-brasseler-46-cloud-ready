var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var SharedListController = /** @class */ (function () {
            function SharedListController($scope, shareDetailsPopupService, manageSharingPopupService) {
                this.$scope = $scope;
                this.shareDetailsPopupService = shareDetailsPopupService;
                this.manageSharingPopupService = manageSharingPopupService;
            }
            SharedListController.prototype.$onInit = function () {
                this.updateScopeList();
            };
            SharedListController.prototype.shareDetailsLinkIsVisible = function (list) {
                return (list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.IndividualUsers] && list.wishListSharesCount > 1) ||
                    list.shareOption === wishlist.ShareOptionEnum[wishlist.ShareOptionEnum.AllCustomerUsers] && !list.isGlobal;
            };
            SharedListController.prototype.showShareDetails = function (list) {
                this.shareDetailsPopupService.display(list);
            };
            SharedListController.prototype.showManageSharing = function (list, session) {
                this.manageSharingPopupService.display({ list: list, session: session });
            };
            SharedListController.prototype.updateScopeList = function () {
                var _this = this;
                this.$scope.$on("listWasUpdated", function (event, list) {
                    var scopeList = _this.$scope.list;
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
            };
            SharedListController.$inject = ["$scope", "shareDetailsPopupService", "manageSharingPopupService"];
            return SharedListController;
        }());
        wishlist.SharedListController = SharedListController;
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.shared-list.controller.js.map