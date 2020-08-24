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
        var SelectVariantProductPopupController = /** @class */ (function () {
            function SelectVariantProductPopupController(coreService, selectVariantProductPopupService, $rootScope, productService, settingsService) {
                this.coreService = coreService;
                this.selectVariantProductPopupService = selectVariantProductPopupService;
                this.$rootScope = $rootScope;
                this.productService = productService;
                this.settingsService = settingsService;
                this.initialStyleTraits = [];
                this.initialStyledProducts = [];
                this.styleTraitFiltered = [];
                this.styleSelection = [];
                this.selector = "#popup-select-variant-product";
            }
            SelectVariantProductPopupController.prototype.$onInit = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.selectVariantProductPopupService.registerDisplayFunction(function (product) {
                    _this.initialStyledProducts = product.styledProducts.slice();
                    _this.styleTraitFiltered = product.styleTraits.slice();
                    _this.initialStyleTraits = product.styleTraits.slice();
                    _this.styleSelection = _this.initialStyleTraits.map(function (p) { return null; });
                    _this.product = {};
                    _this.coreService.displayModal(_this.selector);
                });
            };
            SelectVariantProductPopupController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
            };
            SelectVariantProductPopupController.prototype.getSettingsFailed = function (error) {
            };
            SelectVariantProductPopupController.prototype.styleChange = function () {
                var _this = this;
                var styledProductsFiltered = [];
                angular.copy(this.initialStyleTraits, this.styleTraitFiltered);
                // loop trough every trait and compose values
                this.styleTraitFiltered.forEach(function (styleTrait) {
                    if (styleTrait) {
                        styledProductsFiltered = _this.initialStyledProducts.slice();
                        // iteratively filter products for selected traits (except current)
                        _this.styleSelection.forEach(function (styleValue) {
                            if (styleValue && styleValue.styleTraitId !== styleTrait.styleTraitId) { // skip current
                                styledProductsFiltered = _this.getProductsByStyleTraitValueId(styledProductsFiltered, styleValue.styleTraitValueId);
                            }
                        });
                        // for current trait get all distinct values in filtered products
                        var filteredValues_1 = [];
                        styledProductsFiltered.forEach(function (product) {
                            var currentProduct = _this.coreService.getObjectByPropertyValue(product.styleValues, { styleTraitId: styleTrait.styleTraitId }); // get values for current product
                            var isProductInFilteredList = currentProduct && filteredValues_1.some(function (item) { return (item.styleTraitValueId === currentProduct.styleTraitValueId); }); // check if value already selected
                            if (currentProduct && !isProductInFilteredList) {
                                filteredValues_1.push(currentProduct);
                            }
                        });
                        styleTrait.styleValues = filteredValues_1.slice();
                    }
                });
                if (this.isStyleSelectionCompleted()) {
                    var selectedProduct = this.getSelectedStyleProduct(styledProductsFiltered);
                    if (selectedProduct) {
                        this.selectStyledProduct(selectedProduct);
                    }
                }
                else if (this.product.id) {
                    this.product = {};
                }
            };
            SelectVariantProductPopupController.prototype.isStyleSelectionCompleted = function () {
                return this.styleSelection.every(function (item) { return (item != null); });
            };
            SelectVariantProductPopupController.prototype.getProductsByStyleTraitValueId = function (styledProducts, styleTraitValueId) {
                return styledProducts.filter(function (product) { return product.styleValues.some(function (value) { return value.styleTraitValueId === styleTraitValueId; }); });
            };
            SelectVariantProductPopupController.prototype.getSelectedStyleProduct = function (styledProducts) {
                var _this = this;
                this.styleSelection.forEach(function (styleValue) {
                    styledProducts = _this.getProductsByStyleTraitValueId(styledProducts, styleValue.styleTraitValueId);
                });
                return (styledProducts && styledProducts.length > 0) ? styledProducts[0] : null;
            };
            SelectVariantProductPopupController.prototype.selectStyledProduct = function (styledProduct) {
                var _this = this;
                this.product.id = styledProduct.productId;
                this.product.erpNumber = styledProduct.erpNumber;
                this.product.pricing = styledProduct.pricing;
                this.product.shortDescription = styledProduct.shortDescription;
                if (this.settings.realTimePricing && this.product.pricing.requiresRealTimePrice) {
                    var products = this.initialStyledProducts.map(function (styledProduct) {
                        return {
                            id: styledProduct.productId
                        };
                    });
                    this.productService.getProductRealTimePrices(products).then(function (productPrice) {
                        _this.selectStyleProductGetProductPriceCompleted(productPrice);
                    }, function (error) { _this.selectStyleProductGetProductPriceFailed(error); });
                }
            };
            SelectVariantProductPopupController.prototype.selectStyleProductGetProductPriceCompleted = function (productPrice) {
                var _this = this;
                productPrice.realTimePricingResults.forEach(function (productPrice) {
                    var product = _this.initialStyledProducts.find(function (p) { return p.productId === productPrice.productId; });
                    if (product) {
                        product.pricing = productPrice;
                        if (_this.product.id === product.productId) {
                            _this.product.pricing = product.pricing;
                        }
                    }
                });
            };
            SelectVariantProductPopupController.prototype.selectStyleProductGetProductPriceFailed = function (error) {
            };
            SelectVariantProductPopupController.prototype.addToQuickOrderForm = function () {
                this.$rootScope.$broadcast("addProductToQuickOrderForm", this.product);
                this.coreService.closeModal(this.selector);
            };
            SelectVariantProductPopupController.$inject = ["coreService", "selectVariantProductPopupService", "$rootScope", "productService", "settingsService"];
            return SelectVariantProductPopupController;
        }());
        quickorder.SelectVariantProductPopupController = SelectVariantProductPopupController;
        ;
        var SelectVariantProductPopupService = /** @class */ (function (_super) {
            __extends(SelectVariantProductPopupService, _super);
            function SelectVariantProductPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            SelectVariantProductPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-select-variant-product-popup></isc-select-variant-product-popup>";
            };
            return SelectVariantProductPopupService;
        }(base.BasePopupService));
        quickorder.SelectVariantProductPopupService = SelectVariantProductPopupService;
        angular
            .module("insite")
            .service("selectVariantProductPopupService", SelectVariantProductPopupService)
            .controller("SelectVariantProductPopupController", SelectVariantProductPopupController)
            .directive("iscSelectVariantProductPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/QuickOrder-SelectVariantProductPopup",
            controller: "SelectVariantProductPopupController",
            controllerAs: "vm"
        }); });
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.select-variant-product-popup.controller.js.map