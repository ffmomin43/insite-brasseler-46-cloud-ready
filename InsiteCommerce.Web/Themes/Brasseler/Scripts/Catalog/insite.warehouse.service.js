var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var WarehouseService = /** @class */ (function () {
            function WarehouseService($http, $q, httpWrapperService, $rootScope) {
                this.$http = $http;
                this.$q = $q;
                this.httpWrapperService = httpWrapperService;
                this.$rootScope = $rootScope;
                this.serviceUri = "/api/v1/warehouses";
            }
            WarehouseService.prototype.getGeoCodeFromLatLng = function (lat, lng) {
                var _this = this;
                var deferred = this.$q.defer();
                var latlng = new google.maps.LatLng(lat, lng);
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: "", latLng: latlng }, function (results, status) {
                    _this.getGeoCodeFromLatLngCompleted(results, status, deferred);
                });
                return deferred.promise;
            };
            WarehouseService.prototype.getGeoCodeFromLatLngCompleted = function (results, status, deferred) {
                if (status === google.maps.GeocoderStatus.OK) {
                    deferred.resolve(results);
                }
                else {
                    deferred.reject(status);
                }
            };
            WarehouseService.prototype.getWarehouses = function (filter) {
                var _this = this;
                var deferred = this.$q.defer();
                this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri, params: this.getWarehousesParams(filter) }), function (response) { _this.getWarehousesCompleted(response.data, deferred); }, function (error) { _this.getWarehousesFailed(error.data, deferred); });
                return deferred.promise;
            };
            WarehouseService.prototype.getWarehousesParams = function (filter) {
                return filter ? JSON.parse(JSON.stringify(filter)) : {};
            };
            WarehouseService.prototype.getWarehousesCompleted = function (warehouseCollection, deferred) {
                var _this = this;
                this.getGeoCodeFromLatLng(warehouseCollection.defaultLatitude, warehouseCollection.defaultLongitude).then(function (results) { _this.getGeoCodeFromLatLngForWarehousesCompleted(results, warehouseCollection, deferred); }, function (error) { _this.getGeoCodeFromLatLngForWarehousesFailed(error, warehouseCollection, deferred); });
            };
            WarehouseService.prototype.getWarehousesFailed = function (error, deferred) {
                deferred.reject(error);
            };
            WarehouseService.prototype.getGeoCodeFromLatLngForWarehousesCompleted = function (results, warehouseCollection, deferred) {
                this.$rootScope.$broadcast("locationDetected", results[0].formatted_address);
                deferred.resolve(warehouseCollection);
            };
            WarehouseService.prototype.getGeoCodeFromLatLngForWarehousesFailed = function (error, warehouseCollection, deferred) {
                deferred.resolve(warehouseCollection);
            };
            WarehouseService.prototype.getWarehouse = function (warehouseId) {
                var _this = this;
                var deferred = this.$q.defer();
                this.httpWrapperService.executeHttpRequest(this, this.$http({ method: "GET", url: this.serviceUri + "/" + warehouseId }), function (response) { _this.getWarehouseCompleted(response.data, deferred); }, function (error) { _this.getWarehouseFailed(error.data, deferred); });
                return deferred.promise;
            };
            WarehouseService.prototype.getWarehouseCompleted = function (warehouse, deferred) {
                var _this = this;
                this.getGeoCodeFromLatLng(warehouse.latitude, warehouse.longitude).then(function (results) { _this.getGeoCodeFromLatLngForWarehouseCompleted(results, warehouse, deferred); }, function (error) { _this.getGeoCodeFromLatLngForWarehouseFailed(error, deferred); });
            };
            WarehouseService.prototype.getWarehouseFailed = function (error, deferred) {
                deferred.reject(error);
            };
            WarehouseService.prototype.getGeoCodeFromLatLngForWarehouseCompleted = function (results, warehouse, deferred) {
                deferred.resolve(warehouse);
            };
            WarehouseService.prototype.getGeoCodeFromLatLngForWarehouseFailed = function (error, deferred) {
                deferred.reject(error);
            };
            WarehouseService.$inject = ["$http", "$q", "httpWrapperService", "$rootScope"];
            return WarehouseService;
        }());
        catalog.WarehouseService = WarehouseService;
        angular
            .module("insite")
            .service("warehouseService", WarehouseService);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.warehouse.service.js.map