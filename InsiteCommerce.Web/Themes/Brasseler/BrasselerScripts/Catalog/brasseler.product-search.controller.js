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
    var catalog;
    (function (catalog) {
        "use strict";
        var BrasselerProductSearchController = /** @class */ (function (_super) {
            __extends(BrasselerProductSearchController, _super);
            function BrasselerProductSearchController($element, $filter, coreService, searchService, settingsService, $state, queryString, $scope) {
                var _this = _super.call(this, $element, $filter, coreService, searchService, settingsService, $state, queryString, $scope) || this;
                _this.$element = $element;
                _this.$filter = $filter;
                _this.coreService = coreService;
                _this.searchService = searchService;
                _this.settingsService = settingsService;
                _this.$state = $state;
                _this.queryString = queryString;
                _this.$scope = $scope;
                _this.brasselerInit();
                return _this;
            }
            BrasselerProductSearchController.prototype.brasselerInit = function () {
                _super.prototype.init.call(this);
            };
            BrasselerProductSearchController.prototype.getAutocompleteProductTemplate = function (suggestion, pattern) {
                var shortDescription = suggestion.title.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                var additionalInfo = "";
                if (suggestion.title) {
                    var partNumberLabel = void 0;
                    var partNumber = void 0;
                    if (suggestion.isNameCustomerOverride) {
                        partNumberLabel = this.getTranslation("customerPartNumber") || "";
                        partNumber = suggestion.name || "";
                    }
                    else {
                        partNumberLabel = this.getTranslation("partNumber") || "";
                        partNumber = suggestion.erpNumber || "";
                    }
                    partNumber = partNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                    additionalInfo += "<span class='name'><span class='label'>" + partNumberLabel + "</span><span class='value tst_autocomplete_product_" + suggestion.id + "_number'>" + partNumber + "</span></span>";
                }
                if (suggestion.properties != null && suggestion.properties.unspsc) {
                    if (suggestion.properties != null) {
                        var unspsc = suggestion.properties.unspsc.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                        var unspscLabel = this.getTranslation("UNSPSC") || "";
                        additionalInfo += "<span class='name'><span class='label'>" + unspscLabel + "</span><span class='value'>" + unspsc + "</span></span>";
                    }
                }
                //if (suggestion.manufacturerItemNumber) {
                //    const manufacturerItemNumber = suggestion.manufacturerItemNumber.replace(new RegExp(pattern, "gi"), "<strong>$1<\/strong>");
                //    const manufacturerItemNumberLabel = this.getTranslation("manufacturerItemNumber") || "";
                //    additionalInfo += `<span class='manufacturer-item-number'><span class='label'>${manufacturerItemNumberLabel}</span><span class='value'>${manufacturerItemNumber}</span></span>`;
                //}
                return "<div class=\"group-" + suggestion.type + " tst_autocomplete_product_" + suggestion.id + "\"><div class=\"image\"><img src='" + suggestion.image + "' /></div><div><div class='shortDescription'>" + shortDescription + "</div>" + additionalInfo + "</div></div>";
            };
            BrasselerProductSearchController.$inject = ["$element",
                "$filter",
                "coreService",
                "searchService",
                "settingsService",
                "$state",
                "queryString",
                "$scope"
            ];
            return BrasselerProductSearchController;
        }(catalog.ProductSearchController));
        catalog.BrasselerProductSearchController = BrasselerProductSearchController;
        angular
            .module("insite")
            .controller("ProductSearchController", BrasselerProductSearchController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.product-search.controller.js.map