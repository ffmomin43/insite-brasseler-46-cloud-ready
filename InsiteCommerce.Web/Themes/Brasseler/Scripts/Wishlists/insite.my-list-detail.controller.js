var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var MyListDetailController = /** @class */ (function () {
            function MyListDetailController($scope, settingsService, queryString, wishListService, cartService, productService, sessionService, $timeout, $interval, coreService, spinnerService, $location, shareListPopupService, uploadToListPopupService, $localStorage, searchService, productPriceService, paginationService, $templateCache, scheduleReminderPopupService, createListPopupService, deleteListPopupService, copyToListPopupService, listQuantityAdjustmentPopupService) {
                this.$scope = $scope;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.wishListService = wishListService;
                this.cartService = cartService;
                this.productService = productService;
                this.sessionService = sessionService;
                this.$timeout = $timeout;
                this.$interval = $interval;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.$location = $location;
                this.shareListPopupService = shareListPopupService;
                this.uploadToListPopupService = uploadToListPopupService;
                this.$localStorage = $localStorage;
                this.searchService = searchService;
                this.productPriceService = productPriceService;
                this.paginationService = paginationService;
                this.$templateCache = $templateCache;
                this.scheduleReminderPopupService = scheduleReminderPopupService;
                this.createListPopupService = createListPopupService;
                this.deleteListPopupService = deleteListPopupService;
                this.copyToListPopupService = copyToListPopupService;
                this.listQuantityAdjustmentPopupService = listQuantityAdjustmentPopupService;
                this.inProgress = false;
                this.checkStorage = {};
                this.checkedItemsCount = 0;
                this.canPutAnySelectedToCart = false;
                this.listTotal = 0;
                this.failedToGetRealTimePrices = false;
                this.failedToGetRealTimeInventory = false;
                this.sortProperty = "sortOrder";
                this.isSortingMode = false;
                this.reverse = false;
                this.searchTerm = "";
                this.lastSearchTerm = "";
                this.addingSearchTerm = "";
                this.isAddToListSectionVisible = false;
                this.isAddingToList = false;
                this.paginationStorageKey = "DefaultPagination-MyListDetail";
                this.changedSharedListLinesQtys = {};
                this.listLinesWithUpdatedQty = {};
            }
            MyListDetailController.prototype.$onInit = function () {
                var _this = this;
                this.listId = this.queryString.get("id") || this.queryString.get("wishListId");
                this.invite = this.queryString.get("invite");
                if (!this.listId && this.invite) {
                    this.wishListService.activateInvite(this.invite).then(function (wishList) {
                        _this.updateWishListInviteCompleted(wishList);
                    }, function (error) {
                        _this.updateWishListInviteFailed(error);
                    });
                    return;
                }
                this.settingsService.getSettings().then(function (settingsCollection) {
                    _this.getSettingsCompleted(settingsCollection);
                }, function (error) {
                    _this.getSettingsFailed(error);
                });
                this.sessionService.getSession().then(function (session) {
                    _this.getSessionCompleted(session);
                }, function (error) {
                    _this.getSessionFailed(error);
                });
                this.updateBreadcrumbs();
                this.initCheckStorageWatcher();
                this.initListUpdate();
                this.initSort();
                this.initFilter();
                this.$scope.$on("UploadingItemsToListCompleted", function () { return _this.getList(); });
                this.initializeAutocomplete();
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
                this.$scope.$on("list-was-deleted", function () { return _this.redirectToListPage(); });
                this.$templateCache.remove(this.$location.path());
            };
            MyListDetailController.prototype.updateWishListInviteCompleted = function (wishList) {
                this.$location.search({
                    id: wishList.id,
                    invite: null
                });
            };
            MyListDetailController.prototype.updateWishListInviteFailed = function (error) {
                this.inviteIsNotAvailable = true;
            };
            MyListDetailController.prototype.calculateListHeight = function () {
                var list = angular.element("ul.item-list[ui-sortable]:visible");
                if (list.length > 0) {
                    list.css("height", "auto");
                    list.height(list.height());
                }
            };
            MyListDetailController.prototype.onSessionUpdated = function (session) {
                this.getList();
            };
            MyListDetailController.prototype.updateBreadcrumbs = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.listModel && _this.listModel.name; }, function (newValue) {
                    if (newValue) {
                        angular.element(".breadcrumbs > .current").text(newValue);
                    }
                }, true);
            };
            MyListDetailController.prototype.initCheckStorageWatcher = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.checkStorage; }, function () { return _this.calculateCheckedItems(); }, true);
            };
            MyListDetailController.prototype.initListUpdate = function () {
                var _this = this;
                this.$scope.$on("list-was-saved", function (event, list) {
                    _this.listModel.name = list.name;
                    _this.listModel.description = list.description;
                });
            };
            MyListDetailController.prototype.initSort = function () {
                this.sortableOptions = {
                    axis: "y",
                    handle: ".handle",
                    tolerance: "pointer",
                    containment: ".sort-parent-container",
                    "ui-floating": false,
                    stop: this.updateSortOrder.bind(this)
                };
            };
            MyListDetailController.prototype.initFilter = function () {
                var _this = this;
                var searchTimeout;
                this.$scope.$watch(function () { return _this.searchTerm; }, function () {
                    searchTimeout = setTimeout(function () {
                        clearTimeout(searchTimeout);
                        _this.updateIfNewSearchTerm();
                    }, 500);
                });
            };
            MyListDetailController.prototype.updateIfNewSearchTerm = function () {
                if (this.searchTerm !== this.lastSearchTerm) {
                    this.getListLines();
                }
            };
            MyListDetailController.prototype.clearSearch = function () {
                this.searchTerm = "";
                this.updateIfNewSearchTerm();
            };
            MyListDetailController.prototype.canReorderList = function () {
                return this.pagination.numberOfPages === 1 && this.allowedChangeSortOrder();
            };
            MyListDetailController.prototype.allowedChangeSortOrder = function () {
                return this.isSortingMode && this.canChangeSortOrder();
            };
            MyListDetailController.prototype.canChangeSortOrder = function () {
                return this.pagination.totalItemCount > 1 && this.pagination.sortType === "SortOrder" && !this.searchTerm && !this.lastSearchTerm && (this.listModel.allowEdit || !this.listModel.isSharedList);
            };
            MyListDetailController.prototype.updateSortOrder = function () {
                var _this = this;
                this.listModel.wishListLineCollection.forEach(function (line, index) {
                    line.sortOrder = index + 1;
                });
                this.orderIsSaving = true;
                this.wishListService.updateWishList(this.listModel).then(function (wishList) {
                    _this.orderIsSaving = false;
                }, function (error) {
                    _this.orderIsSaving = false;
                });
            };
            MyListDetailController.prototype.openSharePopup = function () {
                this.shareListPopupService.display({
                    step: "",
                    list: this.listModel,
                    session: this.session,
                    customBackStep: null
                });
            };
            MyListDetailController.prototype.calculateCheckedItems = function () {
                this.checkedItemsCount = 0;
                this.canPutAnySelectedToCart = false;
                if (!this.listModel || !this.listModel.wishListLineCollection) {
                    return;
                }
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        this.checkedItemsCount++;
                        if (this.listModel.wishListLineCollection[i].canAddToCart) {
                            this.canPutAnySelectedToCart = true;
                        }
                    }
                }
            };
            MyListDetailController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            MyListDetailController.prototype.setListItem = function (wishListLine) {
                this.selectedListLines = [wishListLine];
                this.editNote = !!wishListLine.notes;
                this.listLineNote = wishListLine.notes;
            };
            MyListDetailController.prototype.deleteListItem = function () {
                this.spinnerService.show();
                this.closeModal("#popup-delete-item");
                if (this.selectedListLines.length === 1) {
                    this.deleteLine(this.selectedListLines[0]);
                }
                else {
                    this.deleteLines(this.listModel, this.selectedListLines);
                }
            };
            MyListDetailController.prototype.deleteLines = function (list, lines) {
                var _this = this;
                if (this.inProgress) {
                    return;
                }
                this.inProgress = true;
                this.wishListService.deleteLineCollection(list, lines).then(function (wishListLineCollection) {
                    _this.deleteLineCollectionCompleted(wishListLineCollection);
                }, function (error) {
                    _this.deleteLineCollectionFailed(error);
                });
            };
            MyListDetailController.prototype.deleteLineCollectionCompleted = function (wishListLineCollection) {
                this.getList();
            };
            MyListDetailController.prototype.deleteLineCollectionFailed = function (error) {
            };
            MyListDetailController.prototype.deleteSelectedItems = function () {
                this.selectedListLines = [];
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        this.selectedListLines.push(this.listModel.wishListLineCollection[i]);
                    }
                }
            };
            MyListDetailController.prototype.redirectToListPage = function () {
                this.spinnerService.show();
                this.coreService.redirectToPath(this.myListUrl);
            };
            MyListDetailController.prototype.selectAll = function () {
                if (this.isAllSelected()) {
                    this.checkStorage = {};
                }
                else {
                    for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                        this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()] = true;
                    }
                }
            };
            MyListDetailController.prototype.isAllSelected = function () {
                return this.checkedItemsCount === this.listModel.wishListLineCollection.length;
            };
            MyListDetailController.prototype.checkProduct = function (productLineId) {
                if (this.checkStorage[productLineId.toString()]) {
                    delete this.checkStorage[productLineId.toString()];
                }
                else {
                    this.checkStorage[productLineId.toString()] = true;
                }
            };
            MyListDetailController.prototype.isProductChecked = function (productLineId) {
                return !!this.checkStorage[productLineId.toString()];
            };
            MyListDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.listSettings = settingsCollection.wishListSettings;
                this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                if (!this.pagination || this.pagination.defaultPageSize !== this.listSettings.productsPerPage) {
                    this.pagination = { defaultPageSize: this.listSettings.productsPerPage };
                    this.paginationService.setDefaultPagination(this.paginationStorageKey, this.pagination);
                }
                if (this.listId) {
                    this.getList();
                }
            };
            MyListDetailController.prototype.getSettingsFailed = function (error) {
            };
            MyListDetailController.prototype.getSessionCompleted = function (session) {
                this.currencySymbol = session.currency.currencySymbol;
                this.session = session;
            };
            MyListDetailController.prototype.getSessionFailed = function (error) {
            };
            MyListDetailController.prototype.getList = function () {
                var _this = this;
                this.inProgress = true;
                this.spinnerService.show();
                this.wishListService.getListById(this.listId, "schedule", null, "listlines").then(function (listModel) {
                    _this.getListCompleted(listModel);
                }, function (error) {
                    _this.getListFailed(error);
                });
            };
            MyListDetailController.prototype.calculateListTotal = function () {
                this.listTotal = 0;
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    var product = this.wishListService.mapWishlistLineToProduct(this.listModel.wishListLineCollection[i]);
                    if (product.pricing) {
                        var unitNetPrice = this.productPriceService.getUnitNetPrice(product).price;
                        var extendedNetPrice = Math.round(unitNetPrice *
                            product.qtyOrdered *
                            100) /
                            100;
                        this.listTotal += extendedNetPrice;
                    }
                }
                this.listTotal = Math.round(this.listTotal * 100) / 100;
            };
            MyListDetailController.prototype.isDiscontinued = function (wishListLine) {
                var outOfStock = 2;
                return !wishListLine.isActive || (wishListLine.isDiscontinued && wishListLine.availability.messageType === outOfStock);
            };
            MyListDetailController.prototype.isRestricted = function (wishListLine) {
                if (this.isDiscontinued(wishListLine)) {
                    return false;
                }
                return !wishListLine.isVisible;
            };
            MyListDetailController.prototype.getListCompleted = function (listModel) {
                this.listModel = listModel;
                this.getListLines();
            };
            MyListDetailController.prototype.getListFailed = function (error) {
                this.inProgress = false;
                this.getListErrorMessage = error;
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.getListLines = function () {
                var _this = this;
                this.inProgress = true;
                this.spinnerService.show();
                this.checkStorage = {};
                this.lastSearchTerm = this.searchTerm;
                this.wishListService.getWishListLinesById(this.listId, {
                    pagination: this.pagination,
                    query: this.searchTerm,
                    changedSharedListLinesQuantities: Object.keys(this.changedSharedListLinesQtys).map(function (o) { return o + "|" + _this.changedSharedListLinesQtys[o]; }).join(",")
                }).then(function (result) {
                    _this.getListLinesCompleted(result);
                }, function (error) {
                    _this.getListLinesFailed(error);
                });
            };
            MyListDetailController.prototype.getListLinesCompleted = function (wishListLineCollection) {
                var _this = this;
                if (wishListLineCollection.wishListLines.length === 0 && this.pagination.page > 1) {
                    // go back if the last product was deleted on a page
                    this.pagination.page = this.pagination.page - 1;
                    this.getListLines();
                    return;
                }
                this.listModel.canAddAllToCart = wishListLineCollection.wishListLines.every(function (p) { return p.canAddToCart; });
                this.listModel.canAddToCart = this.listModel.canAddAllToCart || wishListLineCollection.wishListLines.some(function (p) { return p.canAddToCart; });
                this.inProgress = false;
                this.spinnerService.hide();
                this.listModel.wishListLineCollection = wishListLineCollection.wishListLines;
                this.pagination = wishListLineCollection.pagination;
                this.calculateCheckedItems();
                this.getRealTimePrices();
                if (!this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
                this.calculateListTotal();
                this.$timeout(function () {
                    // refresh foundation tip hover
                    angular.element(document).foundation("dropdown", "reflow");
                    _this.calculateListHeight();
                }, 0);
            };
            MyListDetailController.prototype.getListLinesFailed = function (error) {
                this.inProgress = false;
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing && this.listModel.wishListLineCollection != null && this.listModel.wishListLineCollection.length > 0) {
                    var products = this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection);
                    this.productService.getProductRealTimePrices(products).then(function (pricingResult) {
                        _this.handleRealTimePricesCompleted(pricingResult);
                    }, function (reason) {
                        _this.handleRealtimePricesFailed(reason);
                    });
                }
            };
            MyListDetailController.prototype.handleRealTimePricesCompleted = function (result) {
                var _this = this;
                this.failedToGetRealTimePrices = false;
                result.realTimePricingResults.forEach(function (productPrice) {
                    var wishlistLine = _this.listModel.wishListLineCollection.find(function (p) { return p.productId === productPrice.productId &&
                        p.unitOfMeasure === productPrice.unitOfMeasure; });
                    wishlistLine.pricing = productPrice;
                });
                this.calculateListTotal();
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            MyListDetailController.prototype.handleRealtimePricesFailed = function (reason) {
                this.failedToGetRealTimePrices = true;
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            MyListDetailController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory && this.listModel.wishListLineCollection != null && this.listModel.wishListLineCollection.length > 0) {
                    var products = this.listModel.wishListLineCollection.map(function (wishlistLine) { return _this.wishListService.mapWishlistLineToProduct(wishlistLine); });
                    this.productService.getProductRealTimeInventory(products).then(function (inventoryResult) {
                        _this.handleRealTimeInventoryCompleted(inventoryResult);
                    }, function (reason) {
                        _this.handleRealtimeInventoryFailed(reason);
                    });
                }
            };
            MyListDetailController.prototype.handleRealTimeInventoryCompleted = function (result) {
                this.failedToGetRealTimeInventory = false;
                this.wishListService.applyRealTimeInventoryResult(this.listModel, result);
            };
            MyListDetailController.prototype.handleRealtimeInventoryFailed = function (reason) {
                this.failedToGetRealTimeInventory = true;
            };
            MyListDetailController.prototype.addAllToCart = function (wishList) {
                var _this = this;
                this.inProgress = true;
                var data = { changedSharedListLinesQuantities: this.changedSharedListLinesQtys };
                this.cartService.addWishListToCart(wishList.id, true, data).then(function (cartLineCollection) {
                    _this.addLineCollectionCompleted(cartLineCollection);
                }, function (error) {
                    _this.addLineCollectionFailed(error);
                });
            };
            MyListDetailController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.inProgress = false;
            };
            MyListDetailController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
            };
            MyListDetailController.prototype.updateLine = function (line) {
                var _this = this;
                if (line.qtyOrdered <= 0) {
                    line.qtyOrdered = 1;
                }
                this.inProgress = true;
                this.spinnerService.show();
                this.wishListService.updateLine(line).then(function (wishListLine) {
                    _this.updateLineCompleted(wishListLine);
                }, function (error) {
                    _this.updateLineFailed(error);
                });
            };
            MyListDetailController.prototype.deleteLine = function (line) {
                var _this = this;
                if (this.inProgress) {
                    return;
                }
                this.inProgress = true;
                this.wishListService.deleteLine(line).then(function (wishListLine) {
                    _this.deleteLineCompleted(wishListLine);
                }, function (error) {
                    _this.deleteLineFailed(error);
                });
            };
            MyListDetailController.prototype.deleteLineCompleted = function (wishListLine) {
                this.getList();
            };
            MyListDetailController.prototype.deleteLineFailed = function (error) {
            };
            MyListDetailController.prototype.updateLineCompleted = function (wishListLine) {
                this.getList();
            };
            MyListDetailController.prototype.updateLineFailed = function (error) {
            };
            MyListDetailController.prototype.sortOrderUpdated = function (wishListLine) {
                this.updateLine(wishListLine);
            };
            MyListDetailController.prototype.quantityUpdated = function (wishListLine) {
                if (wishListLine.qtyOrdered <= 0) {
                    wishListLine.qtyOrdered = 1;
                }
                this.changedSharedListLinesQtys[wishListLine.id.toString()] = wishListLine.qtyOrdered;
            };
            MyListDetailController.prototype.updateSavedQuantities = function () {
                var _this = this;
                this.inProgress = true;
                this.spinnerService.show();
                var data = {
                    wishListId: this.listId,
                    changedSharedListLinesQuantities: this.changedSharedListLinesQtys,
                    includeListLines: true,
                };
                this.wishListService.updateWishListLineCollection(data).then(function (wishListLineCollection) {
                    _this.updateSavedQuantitiesCompleted(wishListLineCollection);
                }, function (error) {
                    _this.updateSavedQuantitiesFailed(error);
                });
            };
            MyListDetailController.prototype.updateSavedQuantitiesCompleted = function (wishListLineCollection) {
                var _this = this;
                if (wishListLineCollection.wishListLines.some(function (wishListLine) { return wishListLine.isQtyAdjusted; })) {
                    this.listQuantityAdjustmentPopupService.display({ isQtyAdjusted: true });
                }
                this.getList();
                Object.keys(this.changedSharedListLinesQtys).forEach(function (o) { return _this.listLinesWithUpdatedQty[o] = true; });
                this.changedSharedListLinesQtys = {};
            };
            MyListDetailController.prototype.updateSavedQuantitiesFailed = function (error) {
                this.inProgress = false;
            };
            MyListDetailController.prototype.sortOrderKeyPress = function (keyEvent, wishListLine) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                }
            };
            MyListDetailController.prototype.quantityKeyPress = function (line, keyEvent) {
                if (keyEvent.which === 13) {
                    keyEvent.target.blur();
                }
            };
            MyListDetailController.prototype.addSelectedToCart = function () {
                var _this = this;
                var lines = [];
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.listModel.wishListLineCollection[i].canAddToCart &&
                        this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        lines.push(this.listModel.wishListLineCollection[i]);
                    }
                }
                this.cartService.addLineCollection(lines, true).then(function (cartLineCollection) {
                    _this.addLineCollectionCompleted(cartLineCollection);
                }, function (error) {
                    _this.addLineCollectionFailed(error);
                });
            };
            MyListDetailController.prototype.addLineToCart = function (line) {
                var _this = this;
                this.cartService.addLine(line, true).then(function (cartLine) {
                    _this.addLineCompleted(cartLine);
                }, function (error) {
                    _this.addLineFailed(error);
                });
            };
            MyListDetailController.prototype.addLineCompleted = function (cartLine) {
            };
            MyListDetailController.prototype.addLineFailed = function (error) {
            };
            MyListDetailController.prototype.allQtysIsValid = function () {
                if (!this.listModel || !this.listModel.wishListLineCollection) {
                    return false;
                }
                return this.listModel.wishListLineCollection.every(function (wishListLine) {
                    return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
                });
            };
            MyListDetailController.prototype.changeUnitOfMeasure = function (line) {
                var _this = this;
                var product = this.wishListService.mapWishlistLineToProduct(line);
                this.productService.changeUnitOfMeasure(product).then(function (productDto) {
                    _this.changeUnitOfMeasureCompleted(line, productDto);
                }, function (error) {
                    _this.changeUnitOfMeasureFailed(error);
                });
            };
            MyListDetailController.prototype.changeUnitOfMeasureCompleted = function (line, productDto) {
                line = this.wishListService.mapProductToWishlistLine(productDto, line);
                if (!productDto.quoteRequired) {
                    line.pricing = productDto.pricing;
                }
                this.updateLine(line);
                this.wishListService.updateAvailability(line);
            };
            MyListDetailController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            MyListDetailController.prototype.deleteNote = function () {
                this.listLineNote = "";
                this.saveNote();
            };
            MyListDetailController.prototype.saveNote = function () {
                var _this = this;
                this.noteErrorMessage = "";
                if (!this.noteForm.$valid) {
                    return;
                }
                this.spinnerService.show();
                this.selectedListLines[0].notes = this.listLineNote;
                this.wishListService.updateLine(this.selectedListLines[0]).then(function (wishListLine) {
                    _this.updateLineNoteCompleted(wishListLine);
                }, function (error) {
                    _this.updateLineNoteFailed(error);
                });
            };
            MyListDetailController.prototype.updateLineNoteCompleted = function (wishListLine) {
                this.closeModal("#popup-line-note");
                this.selectedListLines[0].notes = wishListLine.notes;
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.updateLineNoteFailed = function (error) {
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.leaveList = function (navigateTo) {
                var _this = this;
                this.wishListService.deleteWishListShare(this.listModel).then(function (wishList) {
                    _this.leaveListCompleted(navigateTo, wishList);
                }, function (error) {
                    _this.leaveListFailed(error);
                });
            };
            MyListDetailController.prototype.leaveListCompleted = function (navigateTo, wishList) {
                this.closeModal("#popup-leave-list");
                this.spinnerService.show();
                this.coreService.redirectToPath(navigateTo);
            };
            MyListDetailController.prototype.leaveListFailed = function (error) {
            };
            MyListDetailController.prototype.openUploadListPopup = function (wishList) {
                this.uploadToListPopupService.display(wishList);
            };
            MyListDetailController.prototype.openScheduleReminderPopup = function (wishList) {
                this.scheduleReminderPopupService.display(wishList);
            };
            MyListDetailController.prototype.openCreatePopup = function (wishList) {
                this.createListPopupService.display(wishList);
            };
            MyListDetailController.prototype.openDeletePopup = function (wishList) {
                this.deleteListPopupService.display(wishList);
            };
            MyListDetailController.prototype.openCopyToPopup = function (wishList) {
                this.copyToListPopupService.display({ list: wishList, changedSharedListLinesQtys: this.changedSharedListLinesQtys });
            };
            MyListDetailController.prototype.onEnterKeyPressedInAutocomplete = function () {
                var autocomplete = $("#qo-search-widget").data("kendoAutoComplete");
                if (autocomplete && autocomplete._last === kendo.keys.ENTER && autocomplete.listView.selectedDataItems().length === 0) {
                    this.searchProduct(this.addingSearchTerm);
                }
            };
            MyListDetailController.prototype.searchProduct = function (erpNumber) {
                var _this = this;
                if (!erpNumber || erpNumber.length === 0) {
                    return;
                }
                this.findProduct(erpNumber).then(function (productCollection) {
                    _this.addProductCompleted(productCollection);
                }, function (error) {
                    _this.addProductFailed(error);
                });
            };
            MyListDetailController.prototype.findProduct = function (erpNumber) {
                var parameters = { extendedNames: [erpNumber] };
                return this.productService.getProducts(parameters);
            };
            MyListDetailController.prototype.addProductCompleted = function (productCollection) {
                this.validateAndSetProduct(productCollection);
            };
            MyListDetailController.prototype.addProductFailed = function (error) {
                this.setErrorMessage(angular.element("#messageNotFound").val());
            };
            MyListDetailController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.addingSearchTerm; });
                this.autocompleteOptions.template =
                    this.searchService.getProductAutocompleteTemplate(function () { return _this.addingSearchTerm; }, "tst_ListWidget_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
            };
            MyListDetailController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (event) {
                    var dataItem = event.sender.dataItem(event.item.index());
                    _this.searchProduct(dataItem.erpNumber);
                };
            };
            MyListDetailController.prototype.toggleAddToListSection = function () {
                this.isAddToListSectionVisible = !this.isAddToListSectionVisible;
            };
            MyListDetailController.prototype.addProductToList = function (productToAdd) {
                var _this = this;
                if (!productToAdd || !productToAdd.id) {
                    if (this.addingSearchTerm) {
                        this.findProduct(this.addingSearchTerm).then(function (productCollection) {
                            _this.findProductCompleted(productCollection);
                        }, function (error) {
                            _this.findProductFailed(error);
                        });
                    }
                    else {
                        this.setErrorMessage(angular.element("#messageEnterProductName").val());
                    }
                    return;
                }
                this.addToList(productToAdd);
            };
            MyListDetailController.prototype.findProductCompleted = function (productCollection) {
                if (this.validateAndSetProduct(productCollection)) {
                    this.addToList(this.itemToAdd);
                }
            };
            MyListDetailController.prototype.findProductFailed = function (error) {
                this.setErrorMessage(angular.element("#messageNotFound").val());
            };
            MyListDetailController.prototype.addToList = function (productToAdd) {
                var _this = this;
                var listLineContainsCurrentProduct = this.listModel.wishListLineCollection.filter(function (item) {
                    return item.productId === productToAdd.id && item.unitOfMeasure === productToAdd.selectedUnitOfMeasure;
                });
                if (listLineContainsCurrentProduct && listLineContainsCurrentProduct.length > 0) {
                    this.setErrorMessage(angular.element("#alreadyInList").val());
                    return;
                }
                this.isAddingToList = true;
                this.wishListService.addWishListLine(this.listModel, productToAdd).then(function (data) {
                    _this.addProductToListCompleted(data);
                }, function (error) {
                    _this.addProductToListFailed(error);
                });
            };
            MyListDetailController.prototype.validateAndSetProduct = function (productCollection) {
                var product = productCollection.products[0];
                if (this.validateProduct(product)) {
                    var originalQty = (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) || 1;
                    product.qtyOrdered = originalQty < product.minimumOrderQty ? product.minimumOrderQty : originalQty;
                    this.selectedQty = product.qtyOrdered;
                    this.itemToAdd = product;
                    this.errorMessage = "";
                    this.successMessage = "";
                    return true;
                }
                return false;
            };
            MyListDetailController.prototype.validateProduct = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    this.setErrorMessage(angular.element("#messageConfigurableProduct").val());
                    return false;
                }
                if (product.isStyleProductParent) {
                    this.setErrorMessage(angular.element("#messageStyledProduct").val());
                    return false;
                }
                return true;
            };
            MyListDetailController.prototype.addProductToListCompleted = function (wishListLineModel) {
                this.getList();
                this.isAddingToList = false;
                this.addingSearchTerm = "";
                this.itemToAdd = { qtyOrdered: (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) };
                this.setSuccessMessage(angular.element("#messageAddedProduct").val());
            };
            MyListDetailController.prototype.addProductToListFailed = function (error) {
                this.isAddingToList = false;
            };
            MyListDetailController.prototype.setErrorMessage = function (message) {
                this.errorMessage = message;
                this.successMessage = "";
                this.initHideMessageTimeout();
            };
            MyListDetailController.prototype.setSuccessMessage = function (message) {
                this.errorMessage = "";
                this.successMessage = message;
                this.initHideMessageTimeout();
            };
            MyListDetailController.prototype.initHideMessageTimeout = function () {
                var _this = this;
                this.$timeout.cancel(this.messageTimeout);
                this.messageTimeout = this.$timeout(function () {
                    _this.successMessage = "";
                    _this.errorMessage = "";
                }, 2000);
            };
            MyListDetailController.prototype.getUomDisplayValue = function (uom) {
                if (!uom) {
                    return "";
                }
                var name = uom.description ? uom.description : uom.unitOfMeasureDisplay;
                var qtyPerBaseUnitOfMeasure = uom.qtyPerBaseUnitOfMeasure !== 1 ? "/" + uom.qtyPerBaseUnitOfMeasure : "";
                return "" + name + qtyPerBaseUnitOfMeasure;
            };
            MyListDetailController.prototype.addingSearchTermChanged = function () {
                this.successMessage = "";
                this.errorMessage = "";
                var originalQty = this.itemToAdd ? this.itemToAdd.qtyOrdered : 1;
                this.itemToAdd = { qtyOrdered: originalQty };
            };
            MyListDetailController.prototype.checkPrint = function (event) {
                if (this.orderIsSaving) {
                    event.preventDefault();
                }
            };
            MyListDetailController.$inject = [
                "$scope",
                "settingsService",
                "queryString",
                "wishListService",
                "cartService",
                "productService",
                "sessionService",
                "$timeout",
                "$interval",
                "coreService",
                "spinnerService",
                "$location",
                "shareListPopupService",
                "uploadToListPopupService",
                "$localStorage",
                "searchService",
                "productPriceService",
                "paginationService",
                "$templateCache",
                "scheduleReminderPopupService",
                "createListPopupService",
                "deleteListPopupService",
                "copyToListPopupService",
                "listQuantityAdjustmentPopupService",
            ];
            return MyListDetailController;
        }());
        wishlist.MyListDetailController = MyListDetailController;
        angular
            .module("insite")
            .controller("MyListDetailController", MyListDetailController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-list-detail.controller.js.map