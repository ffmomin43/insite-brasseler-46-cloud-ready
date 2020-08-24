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
    var quickorder;
    (function (quickorder) {
        "use strict";
        var BrasselerOrderUploadController = /** @class */ (function (_super) {
            __extends(BrasselerOrderUploadController, _super);
            function BrasselerOrderUploadController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BrasselerOrderUploadController.prototype.uploadingFailed = function (error) {
                this.sampleErrorMessage = error.message;
            };
            return BrasselerOrderUploadController;
        }(quickorder.OrderUploadController));
        quickorder.BrasselerOrderUploadController = BrasselerOrderUploadController;
        angular
            .module("insite")
            .controller("OrderUploadController", BrasselerOrderUploadController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.order-upload.controller.js.map