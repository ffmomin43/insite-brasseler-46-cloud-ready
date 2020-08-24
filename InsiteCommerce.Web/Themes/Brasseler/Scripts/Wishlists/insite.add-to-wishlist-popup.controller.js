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
        var AddToWishlistPopupController = /** @class */ (function () {
            function AddToWishlistPopupController(wishListService, coreService, settingsService, addToWishlistPopupService, accessToken, sessionService, spinnerService, scheduleReminderPopupService) {
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.accessToken = accessToken;
                this.sessionService = sessionService;
                this.spinnerService = spinnerService;
                this.scheduleReminderPopupService = scheduleReminderPopupService;
                this.defaultPageSize = 20;
            }
            AddToWishlistPopupController.prototype.$onInit = function () {
                var _this = this;
                this.productsToAdd = [];
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
            };
            AddToWishlistPopupController.prototype.getSettingsCompleted = function (settings) {
                var _this = this;
                this.addToWishListPopupTimeout = settings.cartSettings.addToCartPopupTimeout;
                this.allowMultipleWishLists = settings.wishListSettings.allowMultipleWishLists;
                this.enableWishListReminders = settings.wishListSettings.enableWishListReminders;
                this.sessionService.getSession().then(function (session) {
                    _this.isAuthenticated = session.isAuthenticated;
                    _this.isRememberedUser = session.rememberMe;
                    _this.isGuest = session.isGuest;
                    _this.addToWishlistPopupService.registerDisplayFunction(function (data) {
                        _this.productsToAdd = data;
                        _this.initialize();
                    });
                });
            };
            AddToWishlistPopupController.prototype.getSettingsFailed = function (error) {
            };
            AddToWishlistPopupController.prototype.initialize = function () {
                var _this = this;
                if (this.isAuthenticated || this.isRememberedUser) {
                    this.clearMessages();
                    this.newWishListName = "";
                    this.selectedWishList = null;
                    this.wishListSearch = "";
                    this.scheduleReminderAfterAdd = false;
                    if (this.allowMultipleWishLists) {
                        setTimeout(function () { return _this.initWishListAutocompletes(); }, 0);
                        this.coreService.displayModal(angular.element("#popup-add-wishlist"));
                    }
                    else {
                        this.addWishList(this.newWishListName);
                    }
                }
                else {
                    this.coreService.displayModal(angular.element("#popup-add-wishlist"));
                }
            };
            AddToWishlistPopupController.prototype.getWishListCollectionFailed = function (error) {
                this.errorMessage = error.message;
                this.spinnerService.hide();
            };
            AddToWishlistPopupController.prototype.clearMessages = function () {
                this.addToWishlistCompleted = false;
                this.errorMessage = "";
                this.showWishlistNameErrorMessage = false;
            };
            AddToWishlistPopupController.prototype.addWishList = function (wishListName) {
                var _this = this;
                this.addingToList = true;
                this.wishListService.addWishList(wishListName).then(function (newWishList) { _this.addWishListCompleted(newWishList); }, function (error) { _this.addWishListFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListCompleted = function (newWishList) {
                this.selectedWishList = newWishList;
                this.addProductsToWishList(newWishList);
            };
            AddToWishlistPopupController.prototype.addWishListFailed = function (error) {
                this.addingToList = false;
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.addToWishList = function () {
                if (this.addingToList) {
                    return;
                }
                this.clearMessages();
                if (this.selectedWishList) {
                    this.addProductsToWishList(this.selectedWishList);
                }
                else {
                    if (this.newWishListName && this.newWishListName.trim().length > 0) {
                        this.addWishList(this.newWishListName);
                    }
                    else {
                        this.showWishlistNameErrorMessage = true;
                    }
                }
            };
            AddToWishlistPopupController.prototype.addProductsToWishList = function (wishList) {
                this.addingToList = true;
                if (this.productsToAdd.length === 1) {
                    this.addLineToWishList(wishList);
                }
                else {
                    this.addLineCollectionToWishList(wishList);
                }
            };
            AddToWishlistPopupController.prototype.addLineToWishList = function (wishList) {
                var _this = this;
                this.wishListService.addWishListLine(wishList, this.productsToAdd[0]).then(function (wishListLine) { _this.addWishListLineCompleted(wishListLine); }, function (error) { _this.addWishListLineFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListLineCompleted = function (wishListLine) {
                this.completedAddingToWishList();
            };
            AddToWishlistPopupController.prototype.addWishListLineFailed = function (error) {
                this.addingToList = false;
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.addLineCollectionToWishList = function (wishList) {
                var _this = this;
                this.wishListService.addWishListLines(wishList, this.productsToAdd).then(function (wishListLineCollection) { _this.addWishListLineCollectionCompleted(wishListLineCollection); }, function (error) { _this.addWishListLineCollectionFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListLineCollectionCompleted = function (wishListLineCollection) {
                this.completedAddingToWishList();
            };
            AddToWishlistPopupController.prototype.completedAddingToWishList = function () {
                var _this = this;
                if (!this.allowMultipleWishLists) {
                    this.coreService.displayModal(angular.element("#popup-add-wishlist"));
                }
                this.addToWishlistCompleted = true;
                this.addingToList = false;
                setTimeout(function () {
                    if (_this.addToWishlistCompleted) {
                        _this.coreService.closeModal("#popup-add-wishlist");
                        if (_this.scheduleReminderAfterAdd) {
                            _this.wishListService.getListById(_this.selectedWishList.id, "schedule", null, "listlines").then(function (listModel) { _this.getListCompleted(listModel); }, function (error) { _this.getListFailed(error); });
                        }
                    }
                }, this.addToWishListPopupTimeout);
            };
            AddToWishlistPopupController.prototype.addWishListLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.getListCompleted = function (listModel) {
                var _this = this;
                setTimeout(function () {
                    _this.scheduleReminderPopupService.display(listModel);
                }, 100);
            };
            AddToWishlistPopupController.prototype.getListFailed = function (error) {
            };
            AddToWishlistPopupController.prototype.openAutocomplete = function ($event, selector) {
                var autoCompleteElement = angular.element(selector);
                var kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
                kendoAutoComplete.popup.open();
            };
            AddToWishlistPopupController.prototype.initWishListAutocompletes = function () {
                var _this = this;
                var wishListValues = ["{{vm.defaultPageSize}}", "{{vm.totalWishListsCount}}"];
                this.wishListOptions = this.wishListOptions || {
                    headerTemplate: this.renderMessage(wishListValues, "totalWishListCountTemplate"),
                    dataSource: new kendo.data.DataSource({
                        serverFiltering: true,
                        serverPaging: true,
                        transport: {
                            read: function (options) {
                                _this.onWishlistAutocompleteRead(options);
                            }
                        }
                    }),
                    select: function (event) {
                        _this.onWishlistAutocompleteSelect(event);
                    },
                    minLength: 0,
                    dataTextField: "name",
                    dataValueField: "id",
                    placeholder: this.wishListOptionsPlaceholder
                };
                this.wishListOptions.dataSource.read();
            };
            AddToWishlistPopupController.prototype.onWishlistAutocompleteRead = function (options) {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getWishLists(null, null, null, this.getDefaultPagination(), this.wishListSearch, "availabletoadd").then(function (wishListCollection) { _this.getWishListCollectionCompleted(options, wishListCollection); }, function (error) { _this.getWishListCollectionFailed(error); });
            };
            AddToWishlistPopupController.prototype.onWishlistAutocompleteSelect = function (event) {
                if (event.item == null) {
                    return;
                }
                var dataItem = event.sender.dataItem(event.item.index());
                this.selectedWishList = dataItem;
            };
            AddToWishlistPopupController.prototype.getWishListCollectionCompleted = function (options, wishListCollectionModel) {
                var wishListCollection = wishListCollectionModel.wishListCollection;
                this.totalWishListsCount = wishListCollectionModel.pagination.totalItemCount;
                if (!this.hasWishlistWithLabel(wishListCollection, this.wishListSearch)) {
                    this.selectedWishList = null;
                }
                // need to wrap this in setTimeout for prevent double scroll
                setTimeout(function () { options.success(wishListCollection); }, 0);
                this.spinnerService.hide();
            };
            AddToWishlistPopupController.prototype.getDefaultPagination = function () {
                return { page: 1, pageSize: this.defaultPageSize };
            };
            AddToWishlistPopupController.prototype.hasWishlistWithLabel = function (wishLists, label) {
                for (var i = 0; i < wishLists.length; i++) {
                    if (wishLists[i].label === label) {
                        return true;
                    }
                }
                return false;
            };
            AddToWishlistPopupController.prototype.renderMessage = function (values, templateId) {
                var template = angular.element("#" + templateId).html();
                for (var i = 0; i < values.length; i++) {
                    template = template.replace("{" + i + "}", values[i]);
                }
                return template;
            };
            AddToWishlistPopupController.$inject = ["wishListService", "coreService", "settingsService", "addToWishlistPopupService", "accessToken", "sessionService", "spinnerService", "scheduleReminderPopupService"];
            return AddToWishlistPopupController;
        }());
        wishlist.AddToWishlistPopupController = AddToWishlistPopupController;
        var AddToWishlistPopupService = /** @class */ (function (_super) {
            __extends(AddToWishlistPopupService, _super);
            function AddToWishlistPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddToWishlistPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-add-to-wishlist-popup></isc-add-to-wishlist-popup>";
            };
            return AddToWishlistPopupService;
        }(base.BasePopupService));
        wishlist.AddToWishlistPopupService = AddToWishlistPopupService;
        angular
            .module("insite")
            .controller("AddToWishlistPopupController", AddToWishlistPopupController)
            .service("addToWishlistPopupService", AddToWishlistPopupService)
            .directive("iscAddToWishlistPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/WishList-AddToWishlistPopup",
            controller: "AddToWishlistPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.add-to-wishlist-popup.controller.js.map