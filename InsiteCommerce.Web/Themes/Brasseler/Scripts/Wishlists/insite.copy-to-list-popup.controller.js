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
        var CopyToListPopupController = /** @class */ (function () {
            function CopyToListPopupController(wishListService, coreService, copyToListPopupService, spinnerService) {
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.copyToListPopupService = copyToListPopupService;
                this.spinnerService = spinnerService;
                this.defaultPageSize = 20;
            }
            CopyToListPopupController.prototype.$onInit = function () {
                this.initializePopup();
            };
            CopyToListPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-copy-list");
            };
            CopyToListPopupController.prototype.initializePopup = function () {
                var _this = this;
                this.copyToListPopupService.registerDisplayFunction(function (data) {
                    _this.mylistDetailModel = data.list;
                    _this.changedSharedListLinesQtys = data.changedSharedListLinesQtys;
                    _this.coreService.displayModal(angular.element("#popup-copy-list"));
                    _this.selectedList = null;
                    _this.listSearch = "";
                    _this.clearMessages();
                    _this.newListName = "";
                    setTimeout(function () { return _this.initListAutocompletes(); }, 0);
                });
            };
            CopyToListPopupController.prototype.getListCollectionFailed = function (error) {
                this.errorMessage = error.message;
                this.spinnerService.hide();
            };
            CopyToListPopupController.prototype.clearMessages = function () {
                this.copyInProgress = false;
                this.copyToListCompleted = false;
                this.errorMessage = "";
                this.showListNameErrorMessage = false;
            };
            CopyToListPopupController.prototype.addList = function (listName) {
                var _this = this;
                this.wishListService.addWishList(listName).then(function (list) { _this.addListCompleted(list); }, function (error) { _this.addListFailed(error); });
            };
            CopyToListPopupController.prototype.addListCompleted = function (list) {
                this.addProductsToList(list);
            };
            CopyToListPopupController.prototype.addListFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.prototype.copyToList = function () {
                this.clearMessages();
                this.copyInProgress = true;
                if (this.selectedList) {
                    this.listName = this.selectedList.name;
                    this.addProductsToList(this.selectedList);
                }
                else {
                    if (this.newListName && this.newListName.trim().length > 0) {
                        this.listName = this.newListName;
                        this.addList(this.newListName);
                    }
                    else {
                        this.showListNameErrorMessage = true;
                        this.copyInProgress = false;
                    }
                }
            };
            CopyToListPopupController.prototype.addProductsToList = function (list) {
                if (this.mylistDetailModel.wishListLinesCount === 1) {
                    this.addLineToList(list);
                }
                else {
                    this.addLineCollectionToList(list);
                }
            };
            CopyToListPopupController.prototype.addLineToList = function (list) {
                var _this = this;
                this.wishListService.addWishListLine(list, this.wishListService.mapWishListLinesToProducts(this.mylistDetailModel.wishListLineCollection)[0]).then(function (listLine) { _this.addListLineCompleted(listLine); }, function (error) { _this.addListLineFailed(error); });
            };
            CopyToListPopupController.prototype.addListLineCompleted = function (listLine) {
                this.copyToListCompleted = true;
            };
            CopyToListPopupController.prototype.addListLineFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.prototype.addLineCollectionToList = function (list) {
                var _this = this;
                this.wishListService.addAllWishListLines(list, this.mylistDetailModel.id, this.changedSharedListLinesQtys).then(function (listLineCollection) { _this.addListLineCollectionCompleted(listLineCollection); }, function (error) { _this.addListLineCollectionFailed(error); });
            };
            CopyToListPopupController.prototype.addListLineCollectionCompleted = function (listLineCollection) {
                this.copyToListCompleted = true;
            };
            CopyToListPopupController.prototype.addListLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.prototype.openAutocomplete = function ($event, selector) {
                var autoCompleteElement = angular.element(selector);
                var kendoAutoComplete = autoCompleteElement.data("kendoAutoComplete");
                kendoAutoComplete.popup.open();
            };
            CopyToListPopupController.prototype.initListAutocompletes = function () {
                var _this = this;
                var listValues = ["{{vm.defaultPageSize}}", "{{vm.totalListsCount}}"];
                this.listOptions = this.listOptions || {
                    headerTemplate: this.renderMessage(listValues, "totalListCountTemplate"),
                    dataSource: new kendo.data.DataSource({
                        serverFiltering: true,
                        serverPaging: true,
                        transport: {
                            read: function (options) {
                                _this.onListAutocompleteRead(options);
                            }
                        }
                    }),
                    select: function (event) {
                        _this.onListAutocompleteSelect(event);
                    },
                    minLength: 0,
                    dataTextField: "name",
                    dataValueField: "id",
                    placeholder: this.listOptionsPlaceholder
                };
                this.listOptions.dataSource.read();
            };
            CopyToListPopupController.prototype.onListAutocompleteRead = function (options) {
                var _this = this;
                this.spinnerService.show();
                this.wishListService.getWishLists(null, null, null, this.getDefaultPagination(), this.listSearch, "availabletoadd").then(function (listCollection) { _this.getListCollectionCompleted(options, listCollection); }, function (error) { _this.getListCollectionFailed(error); });
            };
            CopyToListPopupController.prototype.onListAutocompleteSelect = function (event) {
                if (event.item == null) {
                    return;
                }
                var dataItem = event.sender.dataItem(event.item.index());
                this.selectedList = dataItem;
            };
            CopyToListPopupController.prototype.getListCollectionCompleted = function (options, listCollectionModel) {
                var _this = this;
                var listCollection = listCollectionModel.wishListCollection.filter(function (o) { return o.id !== _this.mylistDetailModel.id; });
                this.totalListsCount = listCollectionModel.pagination.totalItemCount;
                if (!this.hasListWithLabel(listCollection, this.listSearch)) {
                    this.selectedList = null;
                }
                // need to wrap this in setTimeout for prevent double scroll
                setTimeout(function () { options.success(listCollection); }, 0);
                this.spinnerService.hide();
            };
            CopyToListPopupController.prototype.getDefaultPagination = function () {
                return { page: 1, pageSize: this.defaultPageSize };
            };
            CopyToListPopupController.prototype.hasListWithLabel = function (lists, label) {
                for (var i = 0; i < lists.length; i++) {
                    if (lists[i].label === label) {
                        return true;
                    }
                }
                return false;
            };
            CopyToListPopupController.prototype.renderMessage = function (values, templateId) {
                var template = angular.element("#" + templateId).html();
                for (var i = 0; i < values.length; i++) {
                    template = template.replace("{" + i + "}", values[i]);
                }
                return template;
            };
            CopyToListPopupController.$inject = ["wishListService", "coreService", "copyToListPopupService", "spinnerService"];
            return CopyToListPopupController;
        }());
        wishlist.CopyToListPopupController = CopyToListPopupController;
        var CopyToListPopupService = /** @class */ (function (_super) {
            __extends(CopyToListPopupService, _super);
            function CopyToListPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CopyToListPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-copy-to-list-popup></isc-copy-to-list-popup>";
            };
            return CopyToListPopupService;
        }(base.BasePopupService));
        wishlist.CopyToListPopupService = CopyToListPopupService;
        angular
            .module("insite")
            .controller("CopyToListPopupController", CopyToListPopupController)
            .service("copyToListPopupService", CopyToListPopupService)
            .directive("iscCopyToListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CopyToListPopup",
            controller: "CopyToListPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.copy-to-list-popup.controller.js.map