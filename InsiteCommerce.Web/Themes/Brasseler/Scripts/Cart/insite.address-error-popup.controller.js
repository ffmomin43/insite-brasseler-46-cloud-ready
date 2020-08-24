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
        var AddressErrorPopupController = /** @class */ (function () {
            function AddressErrorPopupController($scope, coreService, settingsService, addressErrorPopupService, $window, sessionService, $q) {
                this.$scope = $scope;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.addressErrorPopupService = addressErrorPopupService;
                this.$window = $window;
                this.sessionService = sessionService;
                this.$q = $q;
            }
            AddressErrorPopupController.prototype.$onInit = function () {
                var _this = this;
                this.$q.all([this.sessionService.getSession(), this.settingsService.getSettings()]).then(function (results) { _this.getSessionAndSettingsCompleted(results); }, function (error) { _this.getSessionAndSettingsFailed(error); });
            };
            AddressErrorPopupController.prototype.getSessionAndSettingsCompleted = function (results) {
                var session = (results[0]);
                var customerSettings = (results[1]).customerSettings;
                this.oneTimeAddress = session.shipTo && session.shipTo.oneTimeAddress;
                this.isAddressEditAllowed = customerSettings.allowBillToAddressEdit && customerSettings.allowShipToAddressEdit;
                this.registerDisplayFunction();
            };
            AddressErrorPopupController.prototype.getSessionAndSettingsFailed = function (error) {
            };
            AddressErrorPopupController.prototype.registerDisplayFunction = function () {
                var _this = this;
                this.addressErrorPopupService.registerDisplayFunction(function () { return _this.displayFunction(); });
            };
            AddressErrorPopupController.prototype.displayFunction = function () {
                var $popup = angular.element(".address-error-popup");
                if ($popup.length > 0) {
                    var path = this.$window.location.pathname.toLowerCase();
                    if (path.indexOf(this.checkoutAddressUrl.toLowerCase()) > -1 || path.indexOf(this.myAccountAddressUrl.toLowerCase()) > -1) {
                        this.continueUrl = "";
                    }
                    else {
                        this.continueUrl = (path.indexOf(this.reviewAndPayPageUrl.toLowerCase()) > -1 || this.oneTimeAddress) ? this.checkoutAddressUrl : this.myAccountAddressUrl;
                    }
                    this.coreService.displayModal($popup);
                }
            };
            AddressErrorPopupController.$inject = ["$scope", "coreService", "settingsService", "addressErrorPopupService", "$window", "sessionService", "$q"];
            return AddressErrorPopupController;
        }());
        cart.AddressErrorPopupController = AddressErrorPopupController;
        var AddressErrorPopupService = /** @class */ (function (_super) {
            __extends(AddressErrorPopupService, _super);
            function AddressErrorPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddressErrorPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-address-error-popup></isc-address-error-popup>";
            };
            return AddressErrorPopupService;
        }(base.BasePopupService));
        cart.AddressErrorPopupService = AddressErrorPopupService;
        angular
            .module("insite")
            .controller("AddressErrorPopupController", AddressErrorPopupController)
            .service("addressErrorPopupService", AddressErrorPopupService)
            .directive("iscAddressErrorPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Cart-AddressErrorPopup",
            scope: {},
            controller: "AddressErrorPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(cart = insite.cart || (insite.cart = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.address-error-popup.controller.js.map