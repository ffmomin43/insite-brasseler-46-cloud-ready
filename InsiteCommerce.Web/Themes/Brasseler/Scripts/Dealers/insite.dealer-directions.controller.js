var insite;
(function (insite) {
    var dealers;
    (function (dealers) {
        "use strict";
        var DealerDirectionsController = /** @class */ (function () {
            function DealerDirectionsController($scope, dealerService, $sce, queryString) {
                this.$scope = $scope;
                this.dealerService = dealerService;
                this.$sce = $sce;
                this.queryString = queryString;
            }
            DealerDirectionsController.prototype.$onInit = function () {
                var _this = this;
                this.$scope.$on("mapInitialized", function () {
                    _this.onMapInitialized();
                });
            };
            DealerDirectionsController.prototype.onMapInitialized = function () {
                var _this = this;
                this.dealerService.getGeoLocation().then(function (latLng) {
                    _this.getGeoLocationCompleted(latLng);
                });
            };
            DealerDirectionsController.prototype.getGeoLocationCompleted = function (latLng) {
                var _this = this;
                this.setOrigin(latLng);
                this.dealerService.getDealer(this.queryString.get("dealerId")).then(function (dealer) { _this.getDealerCompleted(dealer); }, function (error) { _this.getDealerFailed(error); });
            };
            DealerDirectionsController.prototype.getGeoLocationFailed = function (error) {
            };
            DealerDirectionsController.prototype.getDealerCompleted = function (dealer) {
                this.dealer = dealer;
                this.dealer.htmlContent = this.$sce.trustAsHtml(this.dealer.htmlContent);
                this.initDirectionRenderer();
                this.setDestination();
            };
            DealerDirectionsController.prototype.getDealerFailed = function (error) {
                if (error === 404) {
                    this.notFound = true;
                }
            };
            DealerDirectionsController.prototype.initDirectionRenderer = function () {
                var _this = this;
                this.directionsRenderer = new google.maps.DirectionsRenderer(null);
                this.directionsRenderer.setMap(this.$scope.map);
                this.directionsRenderer.setPanel(document.getElementById("directionsPanel"));
                google.maps.event.addListener(this.directionsRenderer, "directions_changed", function () {
                    _this.onDirectionsChanged();
                });
            };
            DealerDirectionsController.prototype.onDirectionsChanged = function () {
                this.directions = this.directionsRenderer.getDirections();
            };
            DealerDirectionsController.prototype.setOrigin = function (latLng) {
                var _this = this;
                this.geoOrigin = latLng;
                this.$scope.map.setCenter(this.geoOrigin);
                this.dealerService.getGeoCodeFromLatLng(latLng.lat(), latLng.lng()).then(function (geocoderResults) { _this.getGeoCodeFromLatLngCompleted(geocoderResults); }, function (error) { _this.getGeoCodeFromLatLngFailed(error); });
            };
            DealerDirectionsController.prototype.getGeoCodeFromLatLngCompleted = function (geocoderResults) {
                this.addressSearchField = geocoderResults[0].formatted_address;
            };
            DealerDirectionsController.prototype.getGeoCodeFromLatLngFailed = function (error) {
                // if it errors out, just put the lat/lng in
                this.addressSearchField = this.geoOrigin.lat() + ", " + this.geoOrigin.lng();
            };
            DealerDirectionsController.prototype.setDestination = function () {
                var _this = this;
                try {
                    var request = {
                        origin: this.geoOrigin,
                        destination: new google.maps.LatLng(this.dealer.latitude, this.dealer.longitude),
                        travelMode: google.maps.TravelMode.DRIVING,
                        unitSystem: this.dealer.distanceUnitOfMeasure === "Imperial" ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC,
                        durationInTraffic: true
                    };
                    var directionsService = new google.maps.DirectionsService();
                    directionsService.route(request, function (directions, status) {
                        if (status === google.maps.DirectionsStatus.OK) {
                            _this.directionsRenderer.setDirections(directions);
                        }
                    });
                }
                catch (e) {
                }
            };
            DealerDirectionsController.$inject = ["$scope", "dealerService", "$sce", "queryString"];
            return DealerDirectionsController;
        }());
        dealers.DealerDirectionsController = DealerDirectionsController;
        angular
            .module("insite")
            .controller("DealerDirectionsController", DealerDirectionsController);
    })(dealers = insite.dealers || (insite.dealers = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.dealer-directions.controller.js.map