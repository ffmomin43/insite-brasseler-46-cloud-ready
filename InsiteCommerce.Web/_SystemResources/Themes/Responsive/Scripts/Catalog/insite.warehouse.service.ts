module insite.catalog {
    "use strict";
    import WarehouseModel = Insite.Catalog.WebApi.V1.ApiModels.WarehouseModel;
    import WarehouseCollectionModel = Insite.Catalog.WebApi.V1.ApiModels.WarehouseCollectionModel;

    export interface IWarehouseService {
        getGeoCodeFromLatLng(lat: number, lng: number): ng.IPromise<google.maps.GeocoderResult[]>;
        getWarehouses(filter: IWarehouseFilter): ng.IPromise<WarehouseCollectionModel>;
        getWarehouse(warehouseId: System.Guid): ng.IPromise<WarehouseModel>;
    }

    export interface IWarehouseFilter {
        search: string;
        radius?: number;
        latitude: number;
        longitude: number;
        page?: number;
        pageSize?: number;
        onlyPickupWarehouses?: boolean;
        sort: string;
        excludeCurrentPickupWarehouse?: boolean;
    }

    export class WarehouseService implements IWarehouseService {
        serviceUri = "/api/v1/warehouses";

        static $inject = ["$http", "$q", "httpWrapperService", "$rootScope"];

        constructor(
            protected $http: ng.IHttpService,
            protected $q: ng.IQService,
            protected httpWrapperService: core.HttpWrapperService,
            protected $rootScope: ng.IRootScopeService) {
        }

        getGeoCodeFromLatLng(lat: number, lng: number): ng.IPromise<google.maps.GeocoderResult[]> {
            const deferred = this.$q.defer();

            const latlng = new google.maps.LatLng(lat, lng);
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: "", latLng: latlng }, (results, status) => {
                this.getGeoCodeFromLatLngCompleted(results, status, deferred);
            });

            return deferred.promise as any;
        }

        protected getGeoCodeFromLatLngCompleted(results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus, deferred: ng.IDeferred<{}>): void {
            if (status === google.maps.GeocoderStatus.OK) {
                deferred.resolve(results);
            } else {
                deferred.reject(status);
            }
        }

        getWarehouses(filter: IWarehouseFilter): ng.IPromise<WarehouseCollectionModel> {
            const deferred = this.$q.defer();

            this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getWarehousesParams(filter) }),
                (response: ng.IHttpPromiseCallbackArg<WarehouseCollectionModel>) => { this.getWarehousesCompleted(response.data, deferred); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getWarehousesFailed(error.data, deferred); });

            return deferred.promise as any;
        }

        protected getWarehousesParams(filter: IWarehouseFilter): any {
            return filter ? JSON.parse(JSON.stringify(filter)) : {};
        }

        protected getWarehousesCompleted(warehouseCollection: WarehouseCollectionModel, deferred: ng.IDeferred<{}>): void {
            this.getGeoCodeFromLatLng(warehouseCollection.defaultLatitude, warehouseCollection.defaultLongitude).then(
                (results: google.maps.GeocoderResult[]) => { this.getGeoCodeFromLatLngForWarehousesCompleted(results, warehouseCollection, deferred); },
                (error: any) => { this.getGeoCodeFromLatLngForWarehousesFailed(error, warehouseCollection, deferred); });
        }

        protected getWarehousesFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }

        protected getGeoCodeFromLatLngForWarehousesCompleted(results: google.maps.GeocoderResult[], warehouseCollection: WarehouseCollectionModel, deferred: ng.IDeferred<{}>): void {
            this.$rootScope.$broadcast("locationDetected", results[0].formatted_address);
            deferred.resolve(warehouseCollection);
        }

        protected getGeoCodeFromLatLngForWarehousesFailed(error: any, warehouseCollection: WarehouseCollectionModel, deferred: ng.IDeferred<{}>): void {
            deferred.resolve(warehouseCollection);
        }

        getWarehouse(warehouseId: System.Guid): ng.IPromise<WarehouseModel> {
            const deferred = this.$q.defer();

            this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.serviceUri}/${warehouseId}` }),
                (response: ng.IHttpPromiseCallbackArg<WarehouseModel>) => { this.getWarehouseCompleted(response.data, deferred); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getWarehouseFailed(error.data, deferred); });

            return deferred.promise as any;
        }

        protected getWarehouseCompleted(warehouse: WarehouseModel, deferred: ng.IDeferred<{}>): void {
            this.getGeoCodeFromLatLng(warehouse.latitude, warehouse.longitude).then(
                (results: google.maps.GeocoderResult[]) => { this.getGeoCodeFromLatLngForWarehouseCompleted(results, warehouse, deferred); },
                (error: any) => { this.getGeoCodeFromLatLngForWarehouseFailed(error, deferred); });
        }

        protected getWarehouseFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }

        protected getGeoCodeFromLatLngForWarehouseCompleted(results: google.maps.GeocoderResult[], warehouse: WarehouseModel, deferred: ng.IDeferred<{}>): void {
            deferred.resolve(warehouse);
        }

        protected getGeoCodeFromLatLngForWarehouseFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }
    }

    angular
        .module("insite")
        .service("warehouseService", WarehouseService);
}