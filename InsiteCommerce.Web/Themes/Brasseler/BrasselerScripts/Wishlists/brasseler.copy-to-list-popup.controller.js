var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var BrasselerCopyToListPopupController = /** @class */ (function (_super) {
            __extends(BrasselerCopyToListPopupController, _super);
            function BrasselerCopyToListPopupController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BrasselerCopyToListPopupController.prototype.initializePopup = function () {
                var _this = this;
                this.copyToListPopupService.registerDisplayFunction(function (list) {
                    _this.mylistDetailModel = list;
                    _this.clearMessages();
                    _this.newListName = "";
                    _this.wishListService.getWishLists().then(function (listCollection) { }, function (error) { _this.getListCollectionFailed(error); });
                });
            };
            return BrasselerCopyToListPopupController;
        }(wishlist.CopyToListPopupController));
        wishlist.BrasselerCopyToListPopupController = BrasselerCopyToListPopupController;
        angular
            .module("insite")
            .controller("CopyToListPopupController", BrasselerCopyToListPopupController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.copy-to-list-popup.controller.js.map