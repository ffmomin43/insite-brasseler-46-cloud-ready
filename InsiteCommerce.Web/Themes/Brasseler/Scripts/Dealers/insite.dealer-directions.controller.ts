module insite.dealers {
    "use strict";

    export interface IDealerDirectionsScope extends ng.IScope {
        map: google.maps.Map;
    }

    export class DealerDirectionsController {
        protected geoOrigin: google.maps.LatLng;
        protected directionsRenderer: google.maps.DirectionsRenderer;

        addressSearchField: string;
        dealer: DealerModel;
        directions: any;
        notFound: boolean;

        static $inject = ["$scope", "dealerService", "$sce", "queryString"];

        constructor(
            protected $scope: IDealerDirectionsScope,
            protected dealerService: IDealerService,
            protected $sce: ng.ISCEService,
            protected queryString: common.IQueryStringService) {
        }

        $onInit(): void {
            this.$scope.$on("mapInitialized", () => {
                this.onMapInitialized();
            });
        }

        protected onMapInitialized(): void {
            this.dealerService.getGeoLocation().then((latLng) => {
                this.getGeoLocationCompleted(latLng);
            });
        }

        protected getGeoLocationCompleted(latLng: google.maps.LatLng): void {
            this.setOrigin(latLng);

            this.dealerService.getDealer(this.queryString.get("dealerId")).then(
                (dealer: DealerModel) => { this.getDealerCompleted(dealer); },
                (error: any) => { this.getDealerFailed(error); });
        }

        protected getGeoLocationFailed(error: any): void {
        }

        protected getDealerCompleted(dealer: DealerModel): void {
            this.dealer = dealer;
            this.dealer.htmlContent = this.$sce.trustAsHtml(this.dealer.htmlContent);

            this.initDirectionRenderer();
            this.setDestination();
        }

        protected getDealerFailed(error: any): void {
            if (error === 404) {
                this.notFound = true;
            }
        }

        protected initDirectionRenderer(): void {
            this.directionsRenderer = new google.maps.DirectionsRenderer(null);
            this.directionsRenderer.setMap(this.$scope.map);
            this.directionsRenderer.setPanel(document.getElementById("directionsPanel"));

            google.maps.event.addListener(this.directionsRenderer, "directions_changed", () => {
                this.onDirectionsChanged();
            });
        }

        protected onDirectionsChanged(): void {
            this.directions = this.directionsRenderer.getDirections();
        }

        protected setOrigin(latLng: google.maps.LatLng): void {
            this.geoOrigin = latLng;
            this.$scope.map.setCenter(this.geoOrigin);

            this.dealerService.getGeoCodeFromLatLng(latLng.lat(), latLng.lng()).then(
                (geocoderResults) => { this.getGeoCodeFromLatLngCompleted(geocoderResults); },
                (error: any) => { this.getGeoCodeFromLatLngFailed(error); });
        }

        protected getGeoCodeFromLatLngCompleted(geocoderResults: google.maps.GeocoderResult[]): void {
            this.addressSearchField = geocoderResults[0].formatted_address;
        }

        protected getGeoCodeFromLatLngFailed(error: any): void {
            // if it errors out, just put the lat/lng in
            this.addressSearchField = `${this.geoOrigin.lat()}, ${this.geoOrigin.lng()}`;
        }

        protected setDestination(): void {
            try {
                const request = {
                    origin: this.geoOrigin,
                    destination: new google.maps.LatLng(this.dealer.latitude, this.dealer.longitude),
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: this.dealer.distanceUnitOfMeasure === "Imperial" ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC,
                    durationInTraffic: true
                };

                const directionsService = new google.maps.DirectionsService();
                directionsService.route(request, (directions, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        this.directionsRenderer.setDirections(directions);
                    }
                });
            } catch (e) {
            }
        }
    }

    angular
        .module("insite")
        .controller("DealerDirectionsController", DealerDirectionsController);
}