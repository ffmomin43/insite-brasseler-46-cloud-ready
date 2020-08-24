module insite.catalog {
    "use strict";

    import WarehouseDto = Insite.Catalog.Services.Dtos.WarehouseDto;

    export class AvailabilityByWarehousePopupController {
        static $inject = ["coreService", "availabilityByWarehousePopupService"];
        warehouses: WarehouseDto[] = null;
        selector = "#popup-availability-by-warehouse";

        constructor(
            protected coreService: core.ICoreService,
            protected availabilityByWarehousePopupService: IAvailabilityByWarehousePopupService
        ) {
        }

        $onInit(): void {
            this.availabilityByWarehousePopupService.registerDisplayFunction((data) => {
                this.warehouses = data.warehouses || [];
                this.coreService.displayModal(this.selector);
            });

            this.availabilityByWarehousePopupService.registerUpdatePopupDataFunction((data) => {
                this.warehouses = data.warehouses || [];
            });
        }
    };

    export interface IAvailabilityByWarehousePopupData {
        warehouses: WarehouseDto[]
    }

    export interface IAvailabilityByWarehousePopupService {
        display(data: IAvailabilityByWarehousePopupData): void;
        registerDisplayFunction(p: (data: IAvailabilityByWarehousePopupData) => void);
        updatePopupData(data: IAvailabilityByWarehousePopupData): void;
        registerUpdatePopupDataFunction(updatePopupDataFunction: (data: IAvailabilityByWarehousePopupData) => void): void;
        close(): void;
    }

    export class AvailabilityByWarehousePopupService implements IAvailabilityByWarehousePopupService {
        protected getDirectiveHtml(): string {
            return "<isc-availability-by-warehouse-popup></isc-availability-by-warehouse-popup>";
        }
        element: ng.IAugmentedJQuery = null;
        displayFunction: (data: IAvailabilityByWarehousePopupData) => void;
        updatePopupDataFunction: (data: IAvailabilityByWarehousePopupData) => void;
        selector = "#popup-availability-by-warehouse";

        static $inject = ["coreService", "$rootScope", "$compile"];

        constructor(
            protected coreService: core.ICoreService,
            protected $rootScope: ng.IRootScopeService,
            protected $compile: ng.ICompileService
        ) {
            this.init();
        }

        init(): void {
            if (this.element === null) {
                this.element = angular.element(this.getDirectiveHtml());
                $("body").append(this.element);
                this.$compile(this.element)(this.$rootScope.$new());
            }
        }

        display(data: IAvailabilityByWarehousePopupData): void {
            if (this.displayFunction) {
                this.displayFunction(data);
            }
        }

        registerDisplayFunction(displayFunction: (data: IAvailabilityByWarehousePopupData) => void): void {
            this.displayFunction = displayFunction;
        }

        updatePopupData(data: IAvailabilityByWarehousePopupData): void {
            if (this.updatePopupDataFunction) {
                this.updatePopupDataFunction(data);
            }
        }

        registerUpdatePopupDataFunction(updatePopupDataFunction: (data: IAvailabilityByWarehousePopupData) => void): void {
            this.updatePopupDataFunction = updatePopupDataFunction;
        }

        close(): void {
            this.coreService.closeModal(this.selector);
        }
    }

    angular
        .module("insite")
        .controller("AvailabilityByWarehousePopupController", AvailabilityByWarehousePopupController)
        .service("availabilityByWarehousePopupService", AvailabilityByWarehousePopupService)
        .directive("iscAvailabilityByWarehousePopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Catalog-AvailabilityByWarehousePopup",
            scope: {},
            controller: "AvailabilityByWarehousePopupController",
            controllerAs: "vm"
        }));
}