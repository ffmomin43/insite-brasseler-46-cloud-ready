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
        var BrasselerMyListsController = /** @class */ (function (_super) {
            __extends(BrasselerMyListsController, _super);
            function BrasselerMyListsController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BrasselerMyListsController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
                this.errorMessage = error.message;
            };
            return BrasselerMyListsController;
        }(wishlist.MyListsController));
        wishlist.BrasselerMyListsController = BrasselerMyListsController;
        angular
            .module("insite")
            .controller("MyListsController", BrasselerMyListsController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.my-lists.controller.js.map