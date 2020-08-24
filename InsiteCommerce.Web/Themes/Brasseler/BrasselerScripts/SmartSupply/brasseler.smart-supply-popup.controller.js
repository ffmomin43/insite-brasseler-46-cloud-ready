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
    var smartsupply;
    (function (smartsupply) {
        "use strict";
        var SmartSupplyPopupController = /** @class */ (function () {
            function SmartSupplyPopupController($scope, $window, cartService, sessionService, spinnerService, coreService, paginationService, userPaymentProfileService, smartSupplyService, $localStorage, addToExistingSmartSupplyService, settingsService, accessToken) {
                this.$scope = $scope;
                this.$window = $window;
                this.cartService = cartService;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.coreService = coreService;
                this.paginationService = paginationService;
                this.userPaymentProfileService = userPaymentProfileService;
                this.smartSupplyService = smartSupplyService;
                this.$localStorage = $localStorage;
                this.addToExistingSmartSupplyService = addToExistingSmartSupplyService;
                this.settingsService = settingsService;
                this.accessToken = accessToken;
                // custom pagination to avoid default pagination for popup.
                this.pagination = {
                    currentPage: 1,
                    pageSize: 500,
                    defaultPageSize: 1,
                    totalItemCount: 0,
                    numberOfPages: 0,
                    pageSizeOptions: [],
                    sortOptions: null,
                    sortType: "",
                    nextPageUri: "",
                    prevPageUri: "",
                    page: 1
                };
                this.smartSupplyNames = [];
                this.paginationStorageKey = "DefaultPagination-AddToExistingSmartSupplyList";
                this.searchFilter = {
                    status: "SubscriptionOrder",
                    sort: "OrderDate DESC",
                    shipToId: null
                };
                this.cartCollection = {};
                this.init();
            }
            SmartSupplyPopupController.prototype.init = function () {
                var _this = this;
                this.productsToAdd = [];
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
            };
            SmartSupplyPopupController.prototype.getSettingsCompleted = function (settings) {
                var _this = this;
                this.sessionService.getSession().then(function (session) {
                    _this.isAuthenticateduser = session.isAuthenticated;
                    _this.isRememberedUser = session.rememberMe;
                    _this.isGuest = session.isGuest;
                    _this.addToExistingSmartSupplyService.registerDisplayFunction(function (data) {
                        _this.productsToAdd = data;
                        _this.initialize();
                        _this.coreService.displayModal(angular.element("#popup-add-existing-smartsupply"));
                    });
                });
            };
            SmartSupplyPopupController.prototype.getSettingsFailed = function (error) {
            };
            SmartSupplyPopupController.prototype.initialize = function () {
                var _this = this;
                if (this.isAuthenticateduser && this.isAuthenticated()) {
                    this.spinnerService.show();
                    this.clearMessages();
                    this.smartSupplyService.getSmartSupplyCarts(this.searchFilter, this.pagination).then(function (result) {
                        _this.smartSupplyCarts = result.carts;
                        var list = result.properties["subscriptionNames"];
                        var parsedData = JSON.parse(list);
                        var map = Object.keys(parsedData).map(function (key) { return ({ key: key, value: parsedData[key] }); });
                        _this.smartSupplyNames = map;
                        _this.smartSupplyCarts.forEach(function (data) {
                            _this.cartCollection[data.id] = data;
                        });
                        //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order start
                        _this.smartSupplyCarts.forEach(function (x) {
                            //BUSA-859 : Add to Existing SS                       
                            _this.smartSupplyService.getSmartSupplyCart(x.id).then(function (y) {
                                if (y.properties["subscriptionName"] == undefined) {
                                    y.properties["subscriptionName"] = y.orderNumber;
                                }
                            });
                        });
                        //BUSA-761 SS-Add name for Smart Supply order and force users enter a name while placing order end
                    });
                }
            };
            SmartSupplyPopupController.prototype.clearMessages = function () {
                this.successMessage = false;
                this.errorMessage = "";
                this.smartSupplyOrderNoErrorMessage = false;
            };
            SmartSupplyPopupController.prototype.showPopup = function () {
                this.coreService.displayModal(angular.element(this.popupId));
            };
            SmartSupplyPopupController.prototype.addToSmartSupply = function () {
                this.clearMessages();
                //BUSA-859: Add to Existing SS
                if (this.selectedSmartSupply) {
                    this.addLineToSmartSupply(this.cartCollection[this.selectedSmartSupply]);
                }
                else {
                    this.smartSupplyOrderNoErrorMessage = true;
                }
            };
            SmartSupplyPopupController.prototype.addLineToSmartSupply = function (smartSupply) {
                var _this = this;
                this.spinnerService.show();
                this.smartSupplyService.addLineToSmartSupply(this.productsToAdd[0], smartSupply.uri.toString()).then(function () {
                    _this.spinnerService.hide();
                    _this.successMessage = true;
                }, function (error) {
                    _this.errorMessage = error.message;
                });
            };
            SmartSupplyPopupController.prototype.showAddToCartPopup = function () {
                this.coreService.displayModal(angular.element("#popup-add-addtocartlist"));
            };
            SmartSupplyPopupController.prototype.isAuthenticated = function () {
                return this.$localStorage.get("accessToken", null) !== null;
            };
            SmartSupplyPopupController.$inject = [
                "$scope",
                "$window",
                "cartService",
                "sessionService",
                "spinnerService",
                "coreService",
                "paginationService",
                "userPaymentProfileService",
                "smartSupplyService",
                "$localStorage",
                "AddToExistingSmartSupplyService",
                "settingsService",
                "accessToken"
            ];
            return SmartSupplyPopupController;
        }());
        smartsupply.SmartSupplyPopupController = SmartSupplyPopupController;
        var AddToExistingSmartSupplyService = /** @class */ (function (_super) {
            __extends(AddToExistingSmartSupplyService, _super);
            function AddToExistingSmartSupplyService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddToExistingSmartSupplyService.prototype.getDirectiveHtml = function () {
                return "<isc-add-to-existing-smart-supply-popup></isc-add-to-existing-smart-supply-popup>";
            };
            return AddToExistingSmartSupplyService;
        }(base.BasePopupService));
        smartsupply.AddToExistingSmartSupplyService = AddToExistingSmartSupplyService;
        angular
            .module("insite")
            .controller("SmartSupplyPopupController", SmartSupplyPopupController)
            .service("AddToExistingSmartSupplyService", AddToExistingSmartSupplyService)
            .directive("iscAddToExistingSmartSupplyPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/SmartSupply-AddSmartSupplyPopup",
            controller: "SmartSupplyPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(smartsupply = insite.smartsupply || (insite.smartsupply = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.smart-supply-popup.controller.js.map