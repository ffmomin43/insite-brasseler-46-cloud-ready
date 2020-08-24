module insite.dealers {
    "use strict";

    export interface MarkerOptions {
        position: google.maps.LatLng;
        map: google.maps.Map;
        flat: boolean;
        draggable: boolean;
        content: string;
    }

    declare let Foundation: any;
    declare function RichMarker(options: google.maps.MarkerOptions): void;

    export interface IDealerCollectionScope extends ng.IScope {
        map: google.maps.Map;
        dealerSearchForm: ng.IFormController;
    }

    export class DealerCollectionController {
        protected infoWindow: google.maps.InfoWindow;
        protected markers = [];

        addressSearchField: string;
        center: google.maps.LatLng;
        dealers: DealerModel[];
        distanceUnitOfMeasure: number;
        locationKnown = true;
        pagination: PaginationModel;
        storeName: string;

        static $inject = ["$scope", "$q", "dealerService", "$compile"];

        constructor(
            protected $scope: IDealerCollectionScope,
            protected $q: ng.IQService,
            protected dealerService: IDealerService,
            protected $compile: ng.ICompileService) {
        }

        $onInit(): void {
            this.$scope.$on("mapInitialized", () => {
                this.onMapInitialized();
            });
            this.$scope.$on("$locationChangeStart", () => {
                this.removeAllMarkers();
            });

            Foundation.libs.dropdown.settings.align = "top";
            Foundation.libs.dropdown.settings.is_hover = true;
        }

        protected onMapInitialized(): void {
            this.searchDealers();
        }

        getDealers(): void {
            if (!this.$scope.dealerSearchForm.$valid) {
                return;
            }

            if (this.pagination) {
                this.pagination.page = 1;
            }

            if (this.addressSearchField && this.addressSearchField.trim()) {
                // resolve an address
                this.dealerService.getGeoCodeFromAddress(this.addressSearchField).then(
                    (geocoderResults: google.maps.GeocoderResult[]) => { this.getGeoCodeFromAddressCompleted(geocoderResults); },
                    (error: any) => { this.getGeoCodeFromAddressFailed(error); });
            } else {
                // get from the browser
                this.searchDealers();
            }
        }

        protected getGeoCodeFromAddressCompleted(geocoderResults: google.maps.GeocoderResult[]): void {
            this.locationKnown = true;

            const geocoderResult = geocoderResults[0];
            const coords = new google.maps.LatLng(geocoderResult.geometry.location.lat(), geocoderResult.geometry.location.lng());
            this.getDealerCollection(coords);
        }

        protected getGeoCodeFromAddressFailed(error: any): void {
            this.locationKnown = false;
        }

        protected getDealerCollection(coords: google.maps.LatLng): void {
            const filter = this.getFilter(coords);
            this.dealerService.getDealers(filter).then(
                (dealerCollection: DealerCollectionModel) => { this.getDealerCollectionCompleted(dealerCollection); },
                (error: any) => { this.getDealerCollectionFailed(error); });
        }

        searchDealers(): void {
            this.getCurrentLocation().then(
                (coords: google.maps.LatLng) => { this.getCurrentLocationCompleted(coords); },
                (error: any) => { this.getCurrentLocationFailed(error); });
        }

        protected getCurrentLocationCompleted(coords: google.maps.LatLng): void {
            this.getDealerCollection(coords);
        }

        protected getCurrentLocationFailed(error: any): void {
        }

        protected getDealerCollectionCompleted(dealerCollection: DealerCollectionModel): void {
            this.dealers = dealerCollection.dealers;
            this.pagination = dealerCollection.pagination;
            this.distanceUnitOfMeasure = dealerCollection.distanceUnitOfMeasure === "Metric" ? 1 : 0;

            if (!this.center || this.center.lat() === 0 && this.center.lng() === 0) {
                this.center = new google.maps.LatLng(dealerCollection.defaultLatitude, dealerCollection.defaultLongitude);
            }

            this.setMap();
        }

        protected getDealerCollectionFailed(error: any): void {
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

        protected getFilter(coords: google.maps.LatLng): IDealerFilter {
            this.center = coords;

            const filter: IDealerFilter = {
                name: this.storeName,
                latitude: coords.lat(),
                longitude: coords.lng()
            };

            if (this.pagination) {
                filter.pageSize = this.pagination.pageSize;
                filter.page = this.pagination.page;
            }

            return filter;
        }

        protected getDealerMarkerPopupHtml(dealer: DealerModel): string {
            const markerPopupScope = this.$scope.$new();
            (markerPopupScope as any).dealer = dealer;
            (markerPopupScope as any).dealer.distanceUnitOfMeasure = this.distanceUnitOfMeasure.toString();
            const markerPopupRawHtml = angular.element("#dealerMarkerPopup").html();
            const markerPopup = this.$compile(markerPopupRawHtml)(markerPopupScope);
            markerPopupScope.$digest();

            return markerPopup[0].outerHTML;
        }

        protected setHomeMarker(): void {
            const marker = this.createMarker(this.center.lat(), this.center.lng(), "<span class='home-marker'></span>");

            google.maps.event.addListener(marker, "click", () => {
                this.onHomeMarkerClick(marker);
            });
        }

        protected onHomeMarkerClick(marker: any): void {
            this.openMarker(marker, `Your current location.<br/>${this.addressSearchField}`);
        }

        protected setMap(): void {
            this.$scope.map.setCenter(this.center);
            this.removeAllMarkers();
            this.setHomeMarker();
            this.setDealersMarkers();
            this.fitBounds();
        }

        protected removeAllMarkers(): void {
            for (let m = 0; m < this.markers.length; m++) {
                this.markers[m].setMap(null);
            }
            this.markers = [];
        }

        protected setDealersMarkers(): void {
            this.dealers.forEach((dealer, i) => {
                const marker = this.createMarker(dealer.latitude, dealer.longitude, `<span class='loc-marker'><span>${this.getDealerNumber(i)}</span></span>`);

                google.maps.event.addListener(marker, "click", () => {
                    this.onDealerMarkerClick(marker, dealer);
                });
            });
        }

        protected createMarker(lat: number, lng: number, content: string): any {
            const markerOptions = {
                position: new google.maps.LatLng(lat, lng),
                map: this.$scope.map,
                flat: true,
                draggable: false,
                content: content
            };
            const marker = new RichMarker(markerOptions);
            this.markers.push(marker);

            return marker;
        }

        protected onDealerMarkerClick(marker: any, dealer: DealerModel): void {
            this.openMarker(marker, this.getDealerMarkerPopupHtml(dealer));
        }

        protected openMarker(marker: any, content: string): void {
            if (this.infoWindow) {
                this.infoWindow.close();
            }

            this.infoWindow = new google.maps.InfoWindow();
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.$scope.map, marker);
        }

        getDealerNumber(index: number): number {
            return index + 1 + (this.pagination.pageSize * (this.pagination.page - 1));
        }

        protected fitBounds(): void {
            if (this.$scope.map != null) {
                const bounds = new google.maps.LatLngBounds();
                for (let i = 0, markersLength = this.markers.length; i < markersLength; i++) {
                    bounds.extend(this.markers[i].position);
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

        onOpenHoursClick($event): void {
            $event.preventDefault();
        }
    }

    angular
        .module("insite")
        .controller("DealerCollectionController", DealerCollectionController);
}