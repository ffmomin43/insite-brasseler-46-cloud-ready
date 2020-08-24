import DealerModel = Insite.Dealers.WebApi.V1.ApiModels.DealerModel;
import DealerCollectionModel = Insite.Dealers.WebApi.V1.ApiModels.DealerCollectionModel;

module insite.dealers {
    "use strict";

    export interface IDealerService {
        getGeoCodeFromLatLng(lat: number, lng: number): ng.IPromise<google.maps.GeocoderResult[]>;
        getGeoCodeFromAddress(address: string): ng.IPromise<google.maps.GeocoderResult[]>;
        getGeoLocation(): ng.IPromise<google.maps.LatLng>;
        getDealers(filter: IDealerFilter): ng.IPromise<DealerCollectionModel>;
        getDealer(dealerId: System.Guid): ng.IPromise<DealerModel>;
    }

    export interface IDealerFilter {
        name: string;
        radius?: number;
        latitude: number;
        longitude: number;
        page?: number;
        pageSize?: number;
    }

    export interface IGeoCodingResult {
        results: google.maps.GeocoderResult[];
        status: google.maps.GeocoderStatus;
    }

    export class DealerService implements IDealerService {
        serviceUri = "/api/v1/dealers";

        static $inject = ["$http", "$q", "httpWrapperService"];

        constructor(protected $http: ng.IHttpService, protected $q: ng.IQService, protected httpWrapperService: core.HttpWrapperService) {
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

        getGeoCodeFromAddress(address: string): ng.IPromise<google.maps.GeocoderResult[]> {
            const deferred = this.$q.defer();

            if (address && address.trim()) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: address }, (results, status) => {
                    this.getGeoCodeFromAddressCompleted(results, status, deferred);
                });
            } else {
                deferred.reject(google.maps.GeocoderStatus.ZERO_RESULTS);
            }

            return deferred.promise as any;
        }

        protected getGeoCodeFromAddressCompleted(results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus, deferred: ng.IDeferred<{}>): void {
            if (status === google.maps.GeocoderStatus.OK) {
                deferred.resolve(results);
            } else {
                deferred.reject(status);
            }
        }

        getGeoLocation(): ng.IPromise<google.maps.LatLng> {
            const deferred = this.$q.defer();
            let response = new google.maps.LatLng(0, 0);

            // ok no geoCoder so grab the geolocation from the browser if available.
            if (!navigator.geolocation) {
                deferred.resolve(response);
                return deferred.promise as any;
            }

            navigator.geolocation.getCurrentPosition(
                (position: Position) => { this.getCurrentPositionCompleted(position, deferred as any); },
                (error: any) => { this.getCurrentPositionFailed(error, deferred as any); },
                { timeout: 5500 });

            return deferred.promise as any;
        }

        protected getCurrentPositionCompleted(position: Position, getGeoLocationDeferred: ng.IDeferred<google.maps.LatLng>) {
            getGeoLocationDeferred.resolve(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        }

        protected getCurrentPositionFailed(error: any,getGeoLocationDeferred: ng.IDeferred<google.maps.LatLng>) {
            getGeoLocationDeferred.resolve(new google.maps.LatLng(0, 0));
        }

        getDealers(filter: IDealerFilter): ng.IPromise<DealerCollectionModel> {
            const deferred = this.$q.defer();

            this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: this.serviceUri, params: this.getDealersParams(filter) }),
                (response: ng.IHttpPromiseCallbackArg<DealerCollectionModel>) => { this.getDealersCompleted(response.data, deferred); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getDealersFailed(error.data, deferred); });

            return deferred.promise as any;
        }

        protected getDealersParams(filter: IDealerFilter): any {
            return filter ? JSON.parse(JSON.stringify(filter)) : {};
        }

        protected getDealersCompleted(dealerCollection: DealerCollectionModel, deferred: ng.IDeferred<{}>): void {
            this.getGeoCodeFromLatLng(dealerCollection.defaultLatitude, dealerCollection.defaultLongitude).then(
                (results: google.maps.GeocoderResult[]) => { this.getGeoCodeFromLatLngForDealersCompleted(results, dealerCollection, deferred); },
                (error: any) => { this.getGeoCodeFromLatLngForDealersFailed(error, dealerCollection, deferred); });
        }

        protected getDealersFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }

        protected getGeoCodeFromLatLngForDealersCompleted(results: google.maps.GeocoderResult[], dealerCollection: DealerCollectionModel, deferred: ng.IDeferred<{}>): void {
            dealerCollection.formattedAddress = results[0].formatted_address;
            deferred.resolve(dealerCollection);
        }

        protected getGeoCodeFromLatLngForDealersFailed(error: any, dealerCollection: DealerCollectionModel, deferred: ng.IDeferred<{}>): void {
            deferred.resolve(dealerCollection);
        }

        getDealer(dealerId: System.Guid): ng.IPromise<DealerModel> {
            const deferred = this.$q.defer();

            this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "GET", url: `${this.serviceUri}/${dealerId}` }),
                (response: ng.IHttpPromiseCallbackArg<DealerModel>) => { this.getDealerCompleted(response.data, deferred); },
                (error: ng.IHttpPromiseCallbackArg<any>) => { this.getDealerFailed(error.data, deferred); });

            return deferred.promise as any;
        }

        protected getDealerCompleted(dealer: DealerModel, deferred: ng.IDeferred<{}>): void {
            this.getGeoCodeFromLatLng(dealer.latitude, dealer.longitude).then(
                (results: google.maps.GeocoderResult[]) => { this.getGeoCodeFromLatLngForDealerCompleted(results, dealer, deferred); },
                (error: any) => { this.getGeoCodeFromLatLngForDealerFailed(error, deferred); });
        }

        protected getDealerFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }

        protected getGeoCodeFromLatLngForDealerCompleted(results: google.maps.GeocoderResult[], dealer: DealerModel, deferred: ng.IDeferred<{}>): void {
            deferred.resolve(dealer);
        }

        protected getGeoCodeFromLatLngForDealerFailed(error: any, deferred: ng.IDeferred<{}>): void {
            deferred.reject(error);
        }
    }

    angular
        .module("insite")
        .service("dealerService", DealerService);
}