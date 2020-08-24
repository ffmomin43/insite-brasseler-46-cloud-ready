var insite;
(function (insite) {
    var common;
    (function (common) {
        "use strict";
        var UploadError;
        (function (UploadError) {
            UploadError[UploadError["None"] = 0] = "None";
            UploadError[UploadError["NotEnough"] = 1] = "NotEnough";
            UploadError[UploadError["ConfigurableProduct"] = 2] = "ConfigurableProduct";
            UploadError[UploadError["StyledProduct"] = 3] = "StyledProduct";
            UploadError[UploadError["Unavailable"] = 4] = "Unavailable";
            UploadError[UploadError["InvalidUnit"] = 5] = "InvalidUnit";
            UploadError[UploadError["NotFound"] = 6] = "NotFound";
            UploadError[UploadError["OutOfStock"] = 7] = "OutOfStock";
        })(UploadError = common.UploadError || (common.UploadError = {}));
        var BaseUploadController = /** @class */ (function () {
            function BaseUploadController($scope, productService, coreService, settingsService) {
                this.$scope = $scope;
                this.productService = productService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.fileName = null;
                this.file = null;
                this.firstRowHeading = false;
                this.badFile = false;
                this.uploadLimitExceeded = false;
                this.uploadCancelled = false;
                this.allowCancel = true;
                this.errorProducts = null;
                this.itemsToSearch = null;
                this.uploadedItemsCount = 0;
            }
            BaseUploadController.prototype.$onInit = function () {
                var _this = this;
                if (typeof (XLSX) === "undefined") {
                    $.getScript("/SystemResources/Scripts/Libraries/xlsx/0.8.0/xlsx.full.min.js", function () {
                        _this.XLSX = XLSX;
                    });
                }
                else {
                    this.XLSX = XLSX;
                }
                if (typeof (Papa) === "undefined") {
                    $.getScript("/SystemResources/Scripts/Libraries/papaparse/4.1/papaparse.min.js", function () {
                        _this.Papa = Papa;
                    });
                }
                else {
                    this.Papa = Papa;
                }
                angular.element("#hiddenFileUpload").data("_scope", this.$scope);
            };
            BaseUploadController.prototype.onButtonFileUploadClick = function () {
                $("#hiddenFileUpload").val(null).click();
            };
            BaseUploadController.prototype.setFile = function (arg) {
                var _this = this;
                if (arg.files.length > 0) {
                    this.file = arg.files[0];
                    this.fileName = this.file.name;
                    var fileExtension = this.getFileExtension(this.file.name);
                    this.badFile = ["xls", "xlsx", "csv"].indexOf(fileExtension) === -1;
                    this.uploadLimitExceeded = false;
                    setTimeout(function () {
                        _this.$scope.$apply();
                    });
                }
            };
            BaseUploadController.prototype.uploadFile = function () {
                this.uploadCancelled = false;
                var reader = new FileReader();
                reader.onload = this.onReaderLoad(this.getFileExtension(this.file.name));
                reader.readAsArrayBuffer(this.file);
            };
            BaseUploadController.prototype.onReaderLoad = function (fileExtension) {
                var _this = this;
                return function (e) {
                    var data = e.target.result;
                    var arr = _this.fixData(data);
                    try {
                        if (fileExtension === "xls" || fileExtension === "xlsx") {
                            var wb = _this.XLSX.read(btoa(arr), { type: "base64" });
                            if (wb) {
                                _this.processWb(wb);
                            }
                        }
                        else if (fileExtension === "csv") {
                            _this.processCsv(arr);
                        }
                        else {
                            _this.badFile = true;
                        }
                    }
                    catch (error) {
                        _this.badFile = true;
                    }
                    if (!_this.badFile && !_this.uploadLimitExceeded) {
                        _this.allowCancel = true;
                        _this.showUploadingPopup();
                    }
                    else {
                        _this.$scope.$apply();
                    }
                };
            };
            BaseUploadController.prototype.processWb = function (wb) {
                var _this = this;
                this.itemsToSearch = [];
                wb.SheetNames.forEach(function (sheetName) {
                    var opts = { header: 1 };
                    var roa = _this.XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName], opts);
                    if (roa.length > 0) {
                        if (_this.firstRowHeading) {
                            roa = roa.slice(1, roa.length);
                        }
                        roa = roa.filter(function (r) { return r[0] != null && r[0].length > 0; });
                        if (_this.limitExceeded(roa.length)) {
                            return;
                        }
                        _this.itemsToSearch = roa.map(function (r) { return ({ Name: r[0], Qty: r[1], UM: r[2] }); });
                    }
                });
                this.batchGetProducts();
            };
            BaseUploadController.prototype.processCsv = function (data) {
                var _this = this;
                this.itemsToSearch = [];
                var newLineIndex = data.lastIndexOf("\r\n");
                if (newLineIndex + 2 === data.length) {
                    data = data.substr(0, newLineIndex);
                }
                var results = Papa.parse(data);
                if (results.errors.length > 0) {
                    this.badFile = true;
                    return;
                }
                var rows = results.data;
                if (this.firstRowHeading) {
                    rows = rows.slice(1, rows.length);
                }
                if (this.limitExceeded(rows.length)) {
                    return;
                }
                rows.forEach(function (s) {
                    if (s[0] == null || s[0].length === 0) {
                        return;
                    }
                    var objectToAdd = {};
                    objectToAdd.Name = s[0];
                    if (s[1]) {
                        objectToAdd.Qty = s[1];
                    }
                    if (s[2]) {
                        objectToAdd.UM = s[2];
                    }
                    _this.itemsToSearch.push(objectToAdd);
                });
                this.batchGetProducts();
            };
            BaseUploadController.prototype.batchGetProducts = function () {
                var _this = this;
                this.errorProducts = [];
                this.products = [];
                if (this.itemsToSearch.length === 0) {
                    this.badFile = true;
                    return;
                }
                var extendedNames = this.itemsToSearch.map(function (item) { return item.Name; });
                this.productService.batchGet(extendedNames).then(function (products) {
                    _this.batchGetCompleted(products);
                }, function (error) {
                    _this.batchGetFailed(error);
                });
            };
            BaseUploadController.prototype.batchGetCompleted = function (products) {
                if (this.uploadCancelled) {
                    return;
                }
                this.processProducts(products);
                this.checkCompletion();
            };
            BaseUploadController.prototype.batchGetFailed = function (error) {
            };
            BaseUploadController.prototype.processProducts = function (products) {
                for (var i = 0; i < products.length; i++) {
                    var item = this.itemsToSearch[i];
                    var index = this.firstRowHeading ? i + 2 : i + 1;
                    if (products[i] != null) {
                        var product = products[i];
                        var error = this.validateProduct(product);
                        if (error === UploadError.None) {
                            product.qtyOrdered = (!item.Qty || item.Qty === "0") ? 1 : item.Qty;
                            var isErrorProduct = this.setProductUnitOfMeasure(product, item, index);
                            if (!isErrorProduct) {
                                this.addProductToList(product, item, index);
                            }
                        }
                        else {
                            this.errorProducts.push(this.mapProductErrorInfo(index, error, item.Name, product));
                        }
                    }
                    else {
                        this.errorProducts.push(this.mapProductErrorInfo(index, UploadError.NotFound, item.Name, {
                            qtyOrdered: item.Qty,
                            unitOfMeasureDisplay: item.UM
                        }));
                    }
                }
            };
            BaseUploadController.prototype.checkCompletion = function () {
                var _this = this;
                if (this.uploadCancelled) {
                    return;
                }
                if (this.itemsToSearch.length === this.products.length && this.errorProducts.length === 0) {
                    this.uploadProducts();
                }
                else {
                    this.hideUploadingPopup();
                    setTimeout(function () {
                        _this.showUploadingIssuesPopup();
                    }, 250); // Foundation.libs.reveal.settings.animation_speed
                }
            };
            BaseUploadController.prototype.validateProduct = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    return UploadError.ConfigurableProduct;
                }
                if (product.isStyleProductParent) {
                    return UploadError.StyledProduct;
                }
                if (product.qtyOnHand === 0 && product.trackInventory && !product.canBackOrder) {
                    return UploadError.OutOfStock;
                }
                if (!product.canAddToCart) {
                    return UploadError.Unavailable;
                }
                return UploadError.None;
            };
            BaseUploadController.prototype.fixData = function (data) {
                var o = "";
                var l = 0;
                var w = 10240;
                for (; l < data.byteLength / w; ++l) {
                    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
                }
                o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
                return o;
            };
            BaseUploadController.prototype.cancelUpload = function () {
                this.uploadCancelled = true;
                this.hideUploadingPopup();
                this.cleanupUploadData();
                this.fileName = null;
                this.file = null;
                this.firstRowHeading = false;
            };
            BaseUploadController.prototype.closeIssuesPopup = function () {
                this.hideUploadingIssuesPopup();
                this.cleanupUploadData();
            };
            BaseUploadController.prototype.uploadingCompleted = function (data) {
                var _this = this;
                this.hideUploadingPopup();
                this.uploadedItemsCount = this.products.length;
                setTimeout(function () {
                    _this.showUploadSuccessPopup();
                    _this.cleanupUploadData();
                }, 250);
            };
            BaseUploadController.prototype.uploadingFailed = function (error) {
            };
            BaseUploadController.prototype.getFileExtension = function (fileName) {
                var splitFileName = fileName.split(".");
                return splitFileName.length > 0 ? splitFileName[splitFileName.length - 1].toLowerCase() : "";
            };
            BaseUploadController.prototype.cleanupUploadData = function () {
                this.errorProducts = null;
                this.products = null;
            };
            BaseUploadController.prototype.mapProductErrorInfo = function (index, error, name, product) {
                return {
                    index: index,
                    error: UploadError[error],
                    name: name,
                    qtyRequested: product.qtyOrdered,
                    umRequested: product.unitOfMeasureDisplay,
                    qtyOnHands: product.qtyOnHand
                };
            };
            BaseUploadController.prototype.limitExceeded = function (rowsCount) {
                this.uploadLimitExceeded = rowsCount > 500;
                return this.uploadLimitExceeded;
            };
            BaseUploadController.prototype.getProductUnitOfMeasures = function (product, item) {
                var lowerCaseItemUm = item.UM ? item.UM.toLowerCase() : "";
                return lowerCaseItemUm ? product.productUnitOfMeasures.filter(function (u) { return u.unitOfMeasure.toLowerCase() === lowerCaseItemUm
                    || u.unitOfMeasureDisplay.toLowerCase() === lowerCaseItemUm
                    || u.description.toLowerCase() === lowerCaseItemUm; }) : [];
            };
            BaseUploadController.prototype.setProductUnitOfMeasure = function (product, item, index) {
                var uoms = this.getProductUnitOfMeasures(product, item);
                if (uoms.length > 0) {
                    var um = uoms[0];
                    product.selectedUnitOfMeasure = um.unitOfMeasure;
                    product.selectedUnitOfMeasureDisplay = um.unitOfMeasureDisplay;
                    product.unitOfMeasure = um.unitOfMeasure;
                    product.unitOfMeasureDisplay = um.unitOfMeasureDisplay;
                    return false;
                }
                else if (item.UM) {
                    var errorProduct = this.mapProductErrorInfo(index, UploadError.InvalidUnit, item.Name, product);
                    errorProduct.umRequested = item.UM;
                    this.errorProducts.push(errorProduct);
                    return true;
                }
                return false;
            };
            BaseUploadController.prototype.getDefaultProductUnitOfMeasureDto = function () {
                return {
                    productUnitOfMeasureId: "",
                    unitOfMeasure: "",
                    unitOfMeasureDisplay: "",
                    description: "",
                    qtyPerBaseUnitOfMeasure: 1,
                    roundingRule: "",
                    isDefault: false,
                    availability: null
                };
            };
            BaseUploadController.prototype.getBaseUnitOfMeasure = function (product) {
                var defaultUnitOfMeasure = this.getDefaultProductUnitOfMeasureDto();
                var baseUnitOfMeasure = product.productUnitOfMeasures.filter(function (u) { return u.isDefault; })[0];
                if (!baseUnitOfMeasure) {
                    baseUnitOfMeasure = defaultUnitOfMeasure;
                }
                return baseUnitOfMeasure;
            };
            BaseUploadController.prototype.getCurrentUnitOfMeasure = function (product) {
                var defaultUnitOfMeasure = this.getDefaultProductUnitOfMeasureDto();
                var currentUnitOfMeasure = product.productUnitOfMeasures.filter(function (u) { return u.unitOfMeasure === product.unitOfMeasure; })[0];
                if (!currentUnitOfMeasure) {
                    currentUnitOfMeasure = defaultUnitOfMeasure;
                }
                return currentUnitOfMeasure;
            };
            BaseUploadController.prototype.addProductToList = function (product, item, index) {
                this.products.push(product);
            };
            BaseUploadController.prototype.uploadProducts = function (popupSelector) {
                var _this = this;
                if (popupSelector) {
                    this.coreService.closeModal(popupSelector);
                }
                this.allowCancel = false;
                setTimeout(function () {
                    _this.showUploadingPopup();
                }, 250);
            };
            BaseUploadController.prototype.showUploadingPopup = function () {
            };
            BaseUploadController.prototype.hideUploadingPopup = function () {
            };
            BaseUploadController.prototype.showUploadSuccessPopup = function () {
            };
            BaseUploadController.prototype.hideUploadSuccessPopup = function () {
            };
            BaseUploadController.prototype.showUploadingIssuesPopup = function () {
            };
            BaseUploadController.prototype.hideUploadingIssuesPopup = function () {
            };
            BaseUploadController.$inject = ["$scope", "productService", "coreService", "settingsService"];
            return BaseUploadController;
        }());
        common.BaseUploadController = BaseUploadController;
    })(common = insite.common || (insite.common = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.base-upload.js.map