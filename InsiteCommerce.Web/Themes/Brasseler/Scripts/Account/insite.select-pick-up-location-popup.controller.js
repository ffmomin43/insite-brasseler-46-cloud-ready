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
    var account;
    (function (account) {
        "use strict";
        var SelectPickUpLocationPopupController = /** @class */ (function () {
            function SelectPickUpLocationPopupController(coreService, $scope, $rootScope, $q, warehouseService, dealerService, $compile, selectPickUpLocationPopupService) {
                this.coreService = coreService;
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.warehouseService = warehouseService;
                this.dealerService = dealerService;
                this.$compile = $compile;
                this.selectPickUpLocationPopupService = selectPickUpLocationPopupService;
                this.markers = [];
                this.locationKnown = true;
            }
            SelectPickUpLocationPopupController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("mapInitialized", function () {
                    _this.onMapInitialized();
                    _this.isMapInitialized = true;
                });
                this.$scope.$on("locationDetected", function (event, address) {
                    _this.searchLocation = address;
                });
                Foundation.libs.dropdown.settings.align = "top";
                var isTouchDevice = "ontouchstart" in document.documentElement;
                if (!isTouchDevice) {
                    Foundation.libs.dropdown.settings.is_hover = true;
                }
                this.initModal();
            };
            SelectPickUpLocationPopupController.prototype.initModal = function () {
                var _this = this;
                this.selectPickUpLocationPopupService.registerDisplayFunction(function (data) {
                    _this.session = data.session;
                    _this.selectedWarehouse = data.selectedWarehouse;
                    _this.updateSessionOnSelect = data.updateSessionOnSelect;
                    _this.onSelectWarehouse = data.onSelectWarehouse;
                    if (_this.isMapInitialized) {
                        _this.clearModal();
                        _this.searchWarehouses();
                    }
                    _this.coreService.displayModal("#select-pick-up-location-popup");
                });
            };
            SelectPickUpLocationPopupController.prototype.clearModal = function () {
                this.searchLocation = "";
                this.locationKnown = true;
                this.center = null;
                this.warehouses = null;
                this.pagination = null;
            };
            SelectPickUpLocationPopupController.prototype.selectWarehouse = function (warehouse) {
                var _this = this;
                if (angular.isFunction(this.onSelectWarehouse)) {
                    this.onSelectWarehouse(warehouse, function () { return _this.closePopup(); });
                }
                if (!this.updateSessionOnSelect) {
                    this.$rootScope.$broadcast("PickupWarehouseSelected", warehouse);
                    this.closePopup();
                }
            };
            SelectPickUpLocationPopupController.prototype.closePopup = function () {
                this.coreService.closeModal("#select-pick-up-location-popup");
            };
            SelectPickUpLocationPopupController.prototype.onMapInitialized = function () {
                this.searchWarehouses();
            };
            SelectPickUpLocationPopupController.prototype.getWarehouses = function () {
                var _this = this;
                if (this.pagination) {
                    this.pagination.page = 1;
                }
                if (this.searchLocation && this.searchLocation.trim()) {
                    // resolve an address
                    this.dealerService.getGeoCodeFromAddress(this.searchLocation).then(function (geocoderResults) { _this.getGeoCodeFromAddressCompleted(geocoderResults); }, function (error) { _this.getGeoCodeFromAddressFailed(error); });
                }
                else {
                    // get from the browser
                    this.searchWarehouses();
                }
            };
            SelectPickUpLocationPopupController.prototype.getGeoCodeFromAddressCompleted = function (geocoderResults) {
                this.locationKnown = true;
                var geocoderResult = geocoderResults[0];
                if (typeof geocoderResult.formatted_address !== "undefined") {
                    this.searchLocation = geocoderResult.formatted_address;
                }
                var coords = new google.maps.LatLng(geocoderResult.geometry.location.lat(), geocoderResult.geometry.location.lng());
                this.getWarehouseCollection(coords);
            };
            SelectPickUpLocationPopupController.prototype.getGeoCodeFromAddressFailed = function (error) {
                this.locationKnown = false;
            };
            SelectPickUpLocationPopupController.prototype.searchWarehouses = function () {
                var _this = this;
                this.getCurrentLocation().then(function (coords) { _this.getCurrentLocationCompleted(coords); }, function (error) { _this.getCurrentLocationFailed(error); });
            };
            SelectPickUpLocationPopupController.prototype.getCurrentLocationCompleted = function (coords) {
                this.getWarehouseCollection(coords);
            };
            SelectPickUpLocationPopupController.prototype.getCurrentLocationFailed = function (error) {
            };
            SelectPickUpLocationPopupController.prototype.getWarehouseCollection = function (coords) {
                var _this = this;
                var filter = this.getFilter(coords);
                this.warehouseService.getWarehouses(filter).then(function (warehouseCollection) { _this.getWarehouseCollectionCompleted(warehouseCollection, filter); }, function (error) { _this.getWarehouseCollectionFailed(error); });
            };
            SelectPickUpLocationPopupController.prototype.getWarehouseCollectionCompleted = function (warehouseCollection, filter) {
                this.warehouses = warehouseCollection.warehouses;
                this.pagination = warehouseCollection.pagination;
                this.distanceUnitOfMeasure = warehouseCollection.distanceUnitOfMeasure === "Metric" ? 1 : 0;
                if (!this.center || this.center.lat() === 0 && this.center.lng() === 0) {
                    this.center = new google.maps.LatLng(warehouseCollection.defaultLatitude, warehouseCollection.defaultLongitude);
                }
                var distanceToSelectedWarehouse = this.getDistance(filter.latitude, filter.longitude, this.selectedWarehouse.latitude, this.selectedWarehouse.longitude);
                this.selectedWarehouse.distance = distanceToSelectedWarehouse;
                this.showSelectedWarehouseMarker = distanceToSelectedWarehouse < warehouseCollection.defaultRadius;
                this.setMap();
            };
            SelectPickUpLocationPopupController.prototype.getWarehouseCollectionFailed = function (error) {
            };
            SelectPickUpLocationPopupController.prototype.getCurrentLocation = function () {
                var deferred = this.$q.defer();
                if (this.center) {
                    deferred.resolve(this.center);
                }
                else {
                    this.dealerService.getGeoLocation().then(deferred.resolve, deferred.reject);
                }
                return deferred.promise;
            };
            SelectPickUpLocationPopupController.prototype.getFilter = function (coords) {
                this.center = coords;
                var filter = {
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
            };
            SelectPickUpLocationPopupController.prototype.getWarehouseMarkerPopupHtml = function (warehouse) {
                var markerPopupScope = this.$scope.$new();
                markerPopupScope.warehouse = warehouse;
                markerPopupScope.warehouse.distanceUnitOfMeasure = this.distanceUnitOfMeasure.toString();
                var markerPopupRawHtml = angular.element("#warehouseMarkerPopup").html();
                var markerPopup = this.$compile(markerPopupRawHtml)(markerPopupScope);
                markerPopupScope.$digest();
                return markerPopup[0].outerHTML;
            };
            SelectPickUpLocationPopupController.prototype.setHomeMarker = function () {
                var _this = this;
                var marker = this.createMarker(this.center.lat(), this.center.lng(), "<span class='home-marker'></span>", false);
                google.maps.event.addListener(marker, "click", function () {
                    _this.onHomeMarkerClick(marker);
                });
            };
            SelectPickUpLocationPopupController.prototype.onHomeMarkerClick = function (marker) {
                this.openMarker(marker, this.currentLocationText + "<br/>" + this.searchLocation);
            };
            SelectPickUpLocationPopupController.prototype.setMap = function () {
                this.$scope.map.setCenter(this.center);
                this.removeAllMarkers();
                this.setHomeMarker();
                this.setWarehousesMarkers();
                this.fitBounds();
            };
            SelectPickUpLocationPopupController.prototype.removeAllMarkers = function () {
                for (var m = 0; m < this.markers.length; m++) {
                    this.markers[m].setMap(null);
                }
                this.markers = [];
            };
            SelectPickUpLocationPopupController.prototype.setWarehousesMarkers = function () {
                var _this = this;
                this.warehouses.forEach(function (warehouse, i) {
                    _this.setWarehouseMarker(warehouse, _this.getWarehouseNumber(i).toString());
                });
                if (this.showSelectedWarehouseMarker) {
                    this.setWarehouseMarker(this.selectedWarehouse, "0");
                }
            };
            SelectPickUpLocationPopupController.prototype.setWarehouseMarker = function (warehouse, markerText) {
                var _this = this;
                var marker = this.createMarker(warehouse.latitude, warehouse.longitude, "<span class='loc-marker " + (this.selectedWarehouse && this.selectedWarehouse.id === warehouse.id ? "selected" : "") + "'><span>" + markerText + "</span></span>");
                google.maps.event.addListener(marker, "click", function () {
                    _this.onWarehouseMarkerClick(marker, warehouse);
                });
            };
            SelectPickUpLocationPopupController.prototype.createMarker = function (lat, lng, content, isWarehouseMarker) {
                if (isWarehouseMarker === void 0) { isWarehouseMarker = true; }
                var markerOptions = {
                    position: new google.maps.LatLng(lat, lng),
                    map: this.$scope.map,
                    flat: true,
                    draggable: false,
                    content: content,
                    isWarehouseMarker: isWarehouseMarker
                };
                var marker = new RichMarker(markerOptions);
                this.markers.push(marker);
                return marker;
            };
            SelectPickUpLocationPopupController.prototype.onWarehouseMarkerClick = function (marker, warehouse) {
                this.openMarker(marker, this.getWarehouseMarkerPopupHtml(warehouse));
            };
            SelectPickUpLocationPopupController.prototype.openMarker = function (marker, content) {
                if (this.infoWindow) {
                    this.infoWindow.close();
                }
                this.infoWindow = new google.maps.InfoWindow();
                this.infoWindow.setContent(content);
                this.infoWindow.open(this.$scope.map, marker);
            };
            SelectPickUpLocationPopupController.prototype.getWarehouseNumber = function (index) {
                return index + 1 + (this.pagination.pageSize * (this.pagination.page - 1));
            };
            SelectPickUpLocationPopupController.prototype.fitBounds = function () {
                if (this.$scope.map != null) {
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0, markersLength = this.markers.length; i < markersLength; i++) {
                        if (this.markers[i].isWarehouseMarker) {
                            bounds.extend(this.markers[i].position);
                        }
                    }
                    // Extends the bounds when we have only one marker to prevent zooming in too far.
                    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
                        var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.03, bounds.getNorthEast().lng() + 0.03);
                        var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.03, bounds.getNorthEast().lng() - 0.03);
                        bounds.extend(extendPoint1);
                        bounds.extend(extendPoint2);
                    }
                    if (bounds.getCenter().lat() === 0 && bounds.getCenter().lng() === -180) {
                        return;
                    }
                    this.$scope.map.setCenter(bounds.getCenter());
                    this.$scope.map.fitBounds(bounds);
                }
            };
            SelectPickUpLocationPopupController.prototype.getDistance = function (latitude1, longitude1, latitude2, longitude2) {
                var distance = Math.cos(this.getRadians(latitude1)) * Math.cos(this.getRadians(latitude2)) * Math.cos(this.getRadians(longitude2) - this.getRadians(longitude1)) + Math.sin(this.getRadians(latitude1)) * Math.sin(this.getRadians(latitude2));
                if (distance > 1) {
                    distance = 1;
                }
                distance = 3960 * Math.acos(distance);
                return distance;
            };
            SelectPickUpLocationPopupController.prototype.getRadians = function (degrees) {
                return degrees * (Math.PI / 180);
            };
            SelectPickUpLocationPopupController.prototype.onOpenHoursClick = function ($event) {
                $event.preventDefault();
            };
            SelectPickUpLocationPopupController.$inject = ["coreService", "$scope", "$rootScope", "$q", "warehouseService", "dealerService", "$compile", "selectPickUpLocationPopupService"];
            return SelectPickUpLocationPopupController;
        }());
        account.SelectPickUpLocationPopupController = SelectPickUpLocationPopupController;
        var SelectPickUpLocationPopupService = /** @class */ (function (_super) {
            __extends(SelectPickUpLocationPopupService, _super);
            function SelectPickUpLocationPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            SelectPickUpLocationPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-select-pick-up-location-popup></isc-select-pick-up-location-popup>";
            };
            return SelectPickUpLocationPopupService;
        }(base.BasePopupService));
        account.SelectPickUpLocationPopupService = SelectPickUpLocationPopupService;
        angular
            .module("insite")
            .controller("SelectPickUpLocationPopupController", SelectPickUpLocationPopupController)
            .service("selectPickUpLocationPopupService", SelectPickUpLocationPopupService)
            .directive("iscSelectPickUpLocationPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Account-SelectPickUpLocationPopup",
            scope: {},
            controller: "SelectPickUpLocationPopupController",
            controllerAs: "vm"
        }); });
    })(account = insite.account || (insite.account = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.select-pick-up-location-popup.controller.js.map