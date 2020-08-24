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
    var cart;
    (function (cart) {
        "use strict";
        var AddToCartPopupController = /** @class */ (function () {
            function AddToCartPopupController($scope, coreService, settingsService, addToCartPopupService) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.addToCartPopupService = addToCartPopupService;
            }
            AddToCartPopupController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            AddToCartPopupController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.cartSettings = settingsCollection.cartSettings;
                this.registerDisplayFunction();
            };
            AddToCartPopupController.prototype.getSettingsFailed = function (error) {
            };
            AddToCartPopupController.prototype.registerDisplayFunction = function () {
                var _this = this;
                this.addToCartPopupService.registerDisplayFunction(function (data) { return _this.displayFunction(data); });
            };
            AddToCartPopupController.prototype.displayFunction = function (data) {
                var _this = this;
                this.isAddAll = false;
                if (data && data.isAddAll) {
                    this.isAddAll = data.isAddAll;
                }
                this.isQtyAdjusted = false;
                if (data && data.isQtyAdjusted) {
                    this.isQtyAdjusted = data.isQtyAdjusted;
                }
                this.notAllAdded = false;
                if (data && data.notAllAdded) {
                    this.notAllAdded = data.notAllAdded;
                }
                var showPopup;
                this.showAddToCartPopup = false;
                if (data && typeof data.showAddToCartPopup !== "undefined" && data.showAddToCartPopup !== null) {
                    this.showAddToCartPopup = showPopup = data.showAddToCartPopup;
                }
                else {
                    showPopup = this.productSettings.showAddToCartConfirmationDialog || this.isQtyAdjusted;
                }
                if (!showPopup) {
                    return;
                }
                var popupSelector = ".add-to-cart-popup";
                var $popup = angular.element(popupSelector);
                if ($popup.length <= 0) {
                    return;
                }
                this.coreService.displayModal($popup);
                if (!this.isQtyAdjusted) {
                    setTimeout(function () {
                        _this.coreService.closeModal(popupSelector);
                    }, this.cartSettings.addToCartPopupTimeout);
                }
            };
            AddToCartPopupController.$inject = [
                "$scope",
                "coreService",
                "settingsService",
                "addToCartPopupService"
            ];
            return AddToCartPopupController;
        }());
        cart.AddToCartPopupController = AddToCartPopupController;
        var AddToCartPopupService = /** @class */ (function (_super) {
            __extends(AddToCartPopupService, _super);
            function AddToCartPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddToCartPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-add-to-cart-popup></isc-add-to-cart-popup>";
            };
            return AddToCartPopupService;
        }(base.BasePopupService));
        cart.AddToCartPopupService = AddToCartPopupService;
        angular
            .module("insite")
            .controller("AddToCartPopupController", AddToCartPopupController)
            .service("addToCartPopupService", AddToCartPopupService)
            .directive("iscAddToCartPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Cart-AddToCartPopup",
            controller: "AddToCartPopupController",
            controllerAs: "vm",
            scope: {},
            bindToController: true
        }); });
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.add-to-cart-popup.controller.js.map