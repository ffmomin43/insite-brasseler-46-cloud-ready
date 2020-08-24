var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var AvailabilityByWarehousePopupController = /** @class */ (function () {
            function AvailabilityByWarehousePopupController(coreService, availabilityByWarehousePopupService) {
                this.coreService = coreService;
                this.availabilityByWarehousePopupService = availabilityByWarehousePopupService;
                this.warehouses = null;
                this.selector = "#popup-availability-by-warehouse";
            }
            AvailabilityByWarehousePopupController.prototype.$onInit = function () {
                var _this = this;
                this.availabilityByWarehousePopupService.registerDisplayFunction(function (data) {
                    _this.warehouses = data.warehouses || [];
                    _this.coreService.displayModal(_this.selector);
                });
                this.availabilityByWarehousePopupService.registerUpdatePopupDataFunction(function (data) {
                    _this.warehouses = data.warehouses || [];
                });
            };
            AvailabilityByWarehousePopupController.$inject = ["coreService", "availabilityByWarehousePopupService"];
            return AvailabilityByWarehousePopupController;
        }());
        catalog.AvailabilityByWarehousePopupController = AvailabilityByWarehousePopupController;
        ;
        var AvailabilityByWarehousePopupService = /** @class */ (function () {
            function AvailabilityByWarehousePopupService(coreService, $rootScope, $compile) {
                this.coreService = coreService;
                this.$rootScope = $rootScope;
                this.$compile = $compile;
                this.element = null;
                this.selector = "#popup-availability-by-warehouse";
                this.init();
            }
            AvailabilityByWarehousePopupService.prototype.getDirectiveHtml = function () {
                return "<isc-availability-by-warehouse-popup></isc-availability-by-warehouse-popup>";
            };
            AvailabilityByWarehousePopupService.prototype.init = function () {
                if (this.element === null) {
                    this.element = angular.element(this.getDirectiveHtml());
                    $("body").append(this.element);
                    this.$compile(this.element)(this.$rootScope.$new());
                }
            };
            AvailabilityByWarehousePopupService.prototype.display = function (data) {
                if (this.displayFunction) {
                    this.displayFunction(data);
                }
            };
            AvailabilityByWarehousePopupService.prototype.registerDisplayFunction = function (displayFunction) {
                this.displayFunction = displayFunction;
            };
            AvailabilityByWarehousePopupService.prototype.updatePopupData = function (data) {
                if (this.updatePopupDataFunction) {
                    this.updatePopupDataFunction(data);
                }
            };
            AvailabilityByWarehousePopupService.prototype.registerUpdatePopupDataFunction = function (updatePopupDataFunction) {
                this.updatePopupDataFunction = updatePopupDataFunction;
            };
            AvailabilityByWarehousePopupService.prototype.close = function () {
                this.coreService.closeModal(this.selector);
            };
            AvailabilityByWarehousePopupService.$inject = ["coreService", "$rootScope", "$compile"];
            return AvailabilityByWarehousePopupService;
        }());
        catalog.AvailabilityByWarehousePopupService = AvailabilityByWarehousePopupService;
        angular
            .module("insite")
            .controller("AvailabilityByWarehousePopupController", AvailabilityByWarehousePopupController)
            .service("availabilityByWarehousePopupService", AvailabilityByWarehousePopupService)
            .directive("iscAvailabilityByWarehousePopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Catalog-AvailabilityByWarehousePopup",
            scope: {},
            controller: "AvailabilityByWarehousePopupController",
            controllerAs: "vm"
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.availability-by-warehouse-popup.controller.js.map