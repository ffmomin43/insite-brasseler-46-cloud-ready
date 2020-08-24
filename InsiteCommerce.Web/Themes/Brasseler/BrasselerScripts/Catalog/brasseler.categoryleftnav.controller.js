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
        var BrasselerCategoryLeftNavController = /** @class */ (function (_super) {
            __extends(BrasselerCategoryLeftNavController, _super);
            function BrasselerCategoryLeftNavController($timeout, $window, $scope, $rootScope, sessionService) {
                var _this = _super.call(this, $timeout, $window, $scope, $rootScope, sessionService) || this;
                _this.$timeout = $timeout;
                _this.$window = $window;
                _this.$scope = $scope;
                _this.$rootScope = $rootScope;
                _this.sessionService = sessionService;
                _this.originalAttributes = [];
                _this.selectedAttributeValueIds = [];
                // local collections
                _this.attributeValues = []; // private list of attributes for the ui to display
                _this.priceFilters = []; // private list of price ranges for the ui to display
                // Changes For BUSA-335 Starts
                _this.clearFilters();
                // Changes For BUSA-335 Ends
                _this.brasselerInit();
                return _this;
            }
            BrasselerCategoryLeftNavController.prototype.brasselerInit = function () {
                _super.prototype.$onInit.call(this);
                this.originalAttributes = this.products.attributeTypeFacets;
            };
            BrasselerCategoryLeftNavController.prototype.isAuthenticated = function () {
                return this.session && this.session.isAuthenticated;
            };
            BrasselerCategoryLeftNavController.prototype.toggleFilter = function (attributeValueId) {
                this.updateOriginalArrayItems(attributeValueId, this.selectedAttributeValueIds);
                this.changeArrayValue(attributeValueId, this.attributeValueIds);
                //this.getSelectedFilters();
                //this.$rootScope.$broadcast("CategoryLeftNavController-filterUpdated", "attribute");
                this.updateProductData();
            };
            BrasselerCategoryLeftNavController.prototype.updateOriginalArrayItems = function (attributeValueId, array) {
                var _this = this;
                // iterate over original array attribute values
                this.originalAttributes.forEach(function (attrType) {
                    //check whether the values contain the selected id
                    if (attrType.attributeValueFacets.some(function (attrVal) { return attrVal.attributeValueId === attributeValueId; })) {
                        // iterate over the attribute values to add or remove them
                        attrType.attributeValueFacets.forEach(function (attrVal) {
                            if (attrVal.attributeValueId.toString() === attributeValueId) {
                                if ($.inArray(attrVal, _this.attributeValues) !== -1) {
                                    _this.attributeValues.splice(_this.attributeValues
                                        .indexOf(attrVal), 1);
                                }
                                else {
                                    attrVal.sectionNameDisplay = attrType.nameDisplay;
                                    _this.attributeValues.push(attrVal);
                                }
                                attrVal.selected = !attrVal.selected;
                            }
                        });
                    }
                });
            };
            BrasselerCategoryLeftNavController.prototype.changeArrayValue = function (item, array) {
                if (this.products.attributeTypeFacets.some(function (atf) { return atf.attributeTypeId === item; })) {
                    var facet = this.products.attributeTypeFacets.filter(function (atf) { return atf.attributeTypeId === item; })[0];
                    facet.attributeValueFacets.forEach(function (av) {
                        if ($.inArray(av.attributeValueId, array) !== -1) {
                            array.splice(array.indexOf(av.attributeValueId.toString()), 1);
                        }
                    });
                    return;
                }
                if ($.inArray(item, array) === -1) {
                    array.push(item);
                }
                else {
                    array.splice(array.indexOf(item), 1);
                }
            };
            BrasselerCategoryLeftNavController.prototype.getSelectedFilters = function () {
                var _this = this;
                this.attributeValues = [];
                var attributeValuesIdsCopy = this.attributeValueIds.slice();
                this.attributeValueIds.length = 0;
                if (!(typeof this.originalAttributes == "undefined")) {
                    this.originalAttributes.forEach(function (attr) {
                        attr.attributeValueFacets.forEach(function (attrVal) {
                            attributeValuesIdsCopy.forEach(function (attrValId) {
                                if (attrVal.attributeValueId.toString() === attrValId) {
                                    attrVal.sectionNameDisplay = attr.nameDisplay;
                                    attr.selectedAttributeValueId = attrVal.attributeValueId;
                                    _this.attributeValues.push(attrVal);
                                    _this.attributeValueIds.push(attrValId);
                                }
                            });
                        });
                    });
                }
            };
            BrasselerCategoryLeftNavController.$inject = ["$timeout", "$window", "$scope", "$rootScope", "sessionService"];
            return BrasselerCategoryLeftNavController;
        }(catalog.CategoryLeftNavController));
        catalog.BrasselerCategoryLeftNavController = BrasselerCategoryLeftNavController;
        angular
            .module("insite")
            .controller("CategoryLeftNavController", BrasselerCategoryLeftNavController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=brasseler.categoryleftnav.controller.js.map