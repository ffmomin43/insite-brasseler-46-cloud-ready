module insite.account {
    "use strict";
    import WarehouseModel = Insite.Catalog.WebApi.V1.ApiModels.WarehouseModel;
    import IWarehouseService = catalog.IWarehouseService;
    import IDealerService = dealers.IDealerService;
    import IWarehouseFilter = catalog.IWarehouseFilter;
    import WarehouseCollectionModel = Insite.Catalog.WebApi.V1.ApiModels.WarehouseCollectionModel;

    declare let Foundation: any;
    declare function RichMarker(options: google.maps.MarkerOptions): void;

    export interface ISelectPickUpLocationPopupScope extends ng.IScope {
        map: google.maps.Map;
    }

    export class SelectPickUpLocationPopupController {
        protected infoWindow: google.maps.InfoWindow;
        protected markers = [];

        searchLocation: string;
        locationKnown = true;
        center: google.maps.LatLng;
        warehouses: WarehouseModel[];
        distanceUnitOfMeasure: number;
        pagination: PaginationModel;
        currentLocationText: string;
        selectedWarehouse: WarehouseModel;
        session: SessionModel;
        isMapInitialized: boolean;
        updateSessionOnSelect: boolean;
        onSelectWarehouse: Function;
        showSelectedWarehouseMarker: boolean;

        static $inject = ["coreService", "$scope", "$rootScope", "$q", "warehouseService", "dealerService", "$compile", "selectPickUpLocationPopupService"];

        constructor(
            protected coreService: core.ICoreService,
            protected $scope: ISelectPickUpLocationPopupScope,
            protected $rootScope: ng.IRootScopeService,
            protected $q: ng.IQService,
            protected warehouseService: IWarehouseService,
            protected dealerService: IDealerService,
            protected $compile: ng.ICompileService,
            protected selectPickUpLocationPopupService: ISelectPickUpLocationPopupService) {
        }

        $onInit(): void {
            this.$scope.$on("mapInitialized", () => {
                this.onMapInitialized();
                this.isMapInitialized = true;
            });

            this.$scope.$on("locationDetected", (event: ng.IAngularEvent, address: string) => {
                this.searchLocation = address;
            });

            Foundation.libs.dropdown.settings.align = "top";
            const isTouchDevice = "ontouchstart" in document.documentElement;
            if (!isTouchDevice) {
                Foundation.libs.dropdown.settings.is_hover = true;
            }

            this.initModal();
        }

        initModal(): void {
            this.selectPickUpLocationPopupService.registerDisplayFunction((data) => {
                this.session = data.session;
                this.selectedWarehouse = data.selectedWarehouse;
                this.updateSessionOnSelect = data.updateSessionOnSelect;
                this.onSelectWarehouse = data.onSelectWarehouse;
                if (this.isMapInitialized) {
                    this.clearModal();
                    this.searchWarehouses();
                }
                this.coreService.displayModal("#select-pick-up-location-popup");
            });
        }

        clearModal(): void {
            this.searchLocation = "";
            this.locationKnown = true;
            this.center = null;
            this.warehouses = null;
            this.pagination = null;
        }

        selectWarehouse(warehouse: WarehouseModel): void {
            if (angular.isFunction(this.onSelectWarehouse)) {
                this.onSelectWarehouse(warehouse, () => this.closePopup());
            }

            if (!this.updateSessionOnSelect) {
                this.$rootScope.$broadcast("PickupWarehouseSelected", warehouse);
                this.closePopup();
            }
        }

        protected closePopup(): void {
            this.coreService.closeModal("#select-pick-up-location-popup");
        }

        protected onMapInitialized(): void {
            this.searchWarehouses();
        }

        getWarehouses(): void {
            if (this.pagination) {
                this.pagination.page = 1;
            }

            if (this.searchLocation && this.searchLocation.trim()) {
                // resolve an address
                this.dealerService.getGeoCodeFromAddress(this.searchLocation).then(
                    (geocoderResults: google.maps.GeocoderResult[]) => { this.getGeoCodeFromAddressCompleted(geocoderResults); },
                    (error: any) => { this.getGeoCodeFromAddressFailed(error); });
            } else {
                // get from the browser
                this.searchWarehouses();
            }
        }

        protected getGeoCodeFromAddressCompleted(geocoderResults: google.maps.GeocoderResult[]): void {
            this.locationKnown = true;

            const geocoderResult = geocoderResults[0];
            if (typeof geocoderResult.formatted_address !== "undefined") {
                this.searchLocation = geocoderResult.formatted_address;
            }

            const coords = new google.maps.LatLng(geocoderResult.geometry.location.lat(), geocoderResult.geometry.location.lng());
            this.getWarehouseCollection(coords);
        }

        protected getGeoCodeFromAddressFailed(error: any): void {
            this.locationKnown = false;
        }

        searchWarehouses(): void {
            this.getCurrentLocation().then(
                (coords: google.maps.LatLng) => { this.getCurrentLocationCompleted(coords); },
                (error: any) => { this.getCurrentLocationFailed(error); });
        }

        protected getCurrentLocationCompleted(coords: google.maps.LatLng): void {
            this.getWarehouseCollection(coords);
        }

        protected getCurrentLocationFailed(error: any): void {
        }

        protected getWarehouseCollection(coords: google.maps.LatLng): void {
            const filter = this.getFilter(coords);
            this.warehouseService.getWarehouses(filter).then(
                (warehouseCollection: WarehouseCollectionModel) => { this.getWarehouseCollectionCompleted(warehouseCollection, filter); },
                (error: any) => { this.getWarehouseCollectionFailed(error); });
        }

        protected getWarehouseCollectionCompleted(warehouseCollection: WarehouseCollectionModel, filter: IWarehouseFilter): void {
            this.warehouses = warehouseCollection.warehouses;
            this.pagination = warehouseCollection.pagination;
            this.distanceUnitOfMeasure = warehouseCollection.distanceUnitOfMeasure === "Metric" ? 1 : 0;

            if (!this.center || this.center.lat() === 0 && this.center.lng() === 0) {
                this.center = new google.maps.LatLng(warehouseCollection.defaultLatitude, warehouseCollection.defaultLongitude);
            }

            const distanceToSelectedWarehouse = this.getDistance(filter.latitude, filter.longitude, this.selectedWarehouse.latitude, this.selectedWarehouse.longitude);
            this.selectedWarehouse.distance = distanceToSelectedWarehouse;
            this.showSelectedWarehouseMarker = distanceToSelectedWarehouse < warehouseCollection.defaultRadius;

            this.setMap();
        }

        protected getWarehouseCollectionFailed(error: any): void {
        }

        protected getCurrentLocation(): ng.IPromise<google.maps.LatLng> {
            const deferred = this.$q.defer();

            if (this.center) {
                deferred.resolve(this.center);
            } else {
                this.dealerService.getGeoLocation().then(deferred.resolve, deferred.reject);
            }

            return deferred.promise as any;
        }

        protected getFilter(coords: google.maps.LatLng): IWarehouseFilter {
            this.center = coords;

            const filter: IWarehouseFilter = {
                search: this.searchLocation,
                latitude: coords.lat() ? coords.lat() : this.selectedWarehouse.latitude,
                longitude: coords.lng() ? coords.lng() : this.selectedWarehouse.longitude,
                onlyPickupWarehouses: true,
                sort: "Distance",
                excludeCurrentPickupWarehouse: true
            };

            if (this.pagination) {
                filter.pageSize = this.pagination.pageSize;
                filter.page = this.pagination.page;
            }

            return filter;
        }

        protected getWarehouseMarkerPopupHtml(warehouse: WarehouseModel): string {
            const markerPopupScope = this.$scope.$new();
            (markerPopupScope as any).warehouse = warehouse;
            (markerPopupScope as any).warehouse.distanceUnitOfMeasure = this.distanceUnitOfMeasure.toString();
            const markerPopupRawHtml = angular.element("#warehouseMarkerPopup").html();
            const markerPopup = this.$compile(markerPopupRawHtml)(markerPopupScope);
            markerPopupScope.$digest();

            return markerPopup[0].outerHTML;
        }

        protected setHomeMarker(): void {
            const marker = this.createMarker(this.center.lat(), this.center.lng(), "<span class='home-marker'></span>", false);

            google.maps.event.addListener(marker, "click", () => {
                this.onHomeMarkerClick(marker);
            });
        }

        protected onHomeMarkerClick(marker: any): void {
            this.openMarker(marker, `${this.currentLocationText}<br/>${this.searchLocation}`);
        }

        protected setMap(): void {
            this.$scope.map.setCenter(this.center);
            this.removeAllMarkers();
            this.setHomeMarker();
            this.setWarehousesMarkers();
            this.fitBounds();
        }

        protected removeAllMarkers(): void {
            for (let m = 0; m < this.markers.length; m++) {
                this.markers[m].setMap(null);
            }
            this.markers = [];
        }

        protected setWarehousesMarkers(): void {
            this.warehouses.forEach((warehouse, i) => {
                this.setWarehouseMarker(warehouse, this.getWarehouseNumber(i).toString());
            });

            if (this.showSelectedWarehouseMarker) {
                this.setWarehouseMarker(this.selectedWarehouse, "0");
            }
        }

        protected setWarehouseMarker(warehouse: WarehouseModel, markerText: string): void {
            const marker = this.createMarker(warehouse.latitude, warehouse.longitude, `<span class='loc-marker ${this.selectedWarehouse && this.selectedWarehouse.id === warehouse.id ? "selected" : ""}'><span>${markerText}</span></span>`);

            google.maps.event.addListener(marker, "click", () => {
                this.onWarehouseMarkerClick(marker, warehouse);
            });
        }

        protected createMarker(lat: number, lng: number, content: string, isWarehouseMarker = true): any {
            const markerOptions = {
                position: new google.maps.LatLng(lat, lng),
                map: this.$scope.map,
                flat: true,
                draggable: false,
                content: content,
                isWarehouseMarker: isWarehouseMarker
            };
            const marker = new RichMarker(markerOptions);
            this.markers.push(marker);

            return marker;
        }

        protected onWarehouseMarkerClick(marker: any, warehouse: WarehouseModel): void {
            this.openMarker(marker, this.getWarehouseMarkerPopupHtml(warehouse));
        }

        protected openMarker(marker: any, content: string): void {
            if (this.infoWindow) {
                this.infoWindow.close();
            }

            this.infoWindow = new google.maps.InfoWindow();
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.$scope.map, marker);
        }

        getWarehouseNumber(index: number): number {
            return index + 1 + (this.pagination.pageSize * (this.pagination.page - 1));
        }

        protected fitBounds(): void {
            if (this.$scope.map != null) {
                const bounds = new google.maps.LatLngBounds();
                for (let i = 0, markersLength = this.markers.length; i < markersLength; i++) {
                    if (this.markers[i].isWarehouseMarker) {
                        bounds.extend(this.markers[i].position);
                    }
                }

                // Extends the bounds when we have only one marker to prevent zooming in too far.
                if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                    const extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.03, bounds.getNorthEast().lng() + 0.03);
                    const extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.03, bounds.getNorthEast().lng() - 0.03);
                    bounds.extend(extendPoint1);
                    bounds.extend(extendPoint2);
                }

                if (bounds.getCenter().lat() === 0 && bounds.getCenter().lng() === -180) {
                    return;
                }

                this.$scope.map.setCenter(bounds.getCenter());
                this.$scope.map.fitBounds(bounds);
            }
        }

        protected getDistance(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
            let distance = Math.cos(this.getRadians(latitude1)) * Math.cos(this.getRadians(latitude2)) * Math.cos(this.getRadians(longitude2) - this.getRadians(longitude1)) + Math.sin(this.getRadians(latitude1)) * Math.sin(this.getRadians(latitude2));
            if (distance > 1) {
                distance = 1;
            }

            distance = 3960 * Math.acos(distance);

            return distance;
        }

        private getRadians(degrees: number) {
            return degrees * (Math.PI / 180);
        }

        onOpenHoursClick($event): void {
            $event.preventDefault();
        }
    }

    export interface ISelectPickUpLocationPopupData {
        session: SessionModel;
        updateSessionOnSelect: boolean;
        selectedWarehouse: WarehouseModel;
        onSelectWarehouse: Function;
    }

    export interface ISelectPickUpLocationPopupService {
        display(data: ISelectPickUpLocationPopupData): void;
        registerDisplayFunction(p: (data: ISelectPickUpLocationPopupData) => void);
    }

    export class SelectPickUpLocationPopupService extends base.BasePopupService<any> implements ISelectPickUpLocationPopupService {
        protected getDirectiveHtml(): string {
            return "<isc-select-pick-up-location-popup></isc-select-pick-up-location-popup>";
        }
    }

    angular
        .module("insite")
        .controller("SelectPickUpLocationPopupController", SelectPickUpLocationPopupController)
        .service("selectPickUpLocationPopupService", SelectPickUpLocationPopupService)
        .directive("iscSelectPickUpLocationPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-SelectPickUpLocationPopup",
            scope: {},
            controller: "SelectPickUpLocationPopupController",
            controllerAs: "vm"
        }));
}